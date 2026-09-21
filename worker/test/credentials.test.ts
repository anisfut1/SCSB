import { createCipheriv, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getFbiCredentials } from "../src/credentials.js";

const KEY = randomBytes(32);

function encrypt(plaintext: string, aad: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { ciphertext: encrypted.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

function makeFakeSupabase(rowsByClub: Record<string, { username: string; password: string } | undefined>) {
  return {
    from(table: string) {
      if (table !== "fbi_credentials") throw new Error(`Table inattendue : ${table}`);
      return {
        select: () => ({
          eq: (_col: string, clubId: string) => ({
            maybeSingle: () => {
              const row = rowsByClub[clubId];
              if (!row) return Promise.resolve({ data: null, error: null });
              const encrypted = encrypt(row.password, clubId);
              return Promise.resolve({ data: { username: row.username, password_ciphertext: encrypted.ciphertext, password_iv: encrypted.iv, password_auth_tag: encrypted.authTag }, error: null });
            },
          }),
        }),
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("getFbiCredentials", () => {
  it("déchiffre les identifiants du bon club", async () => {
    const supabase = makeFakeSupabase({ "club-a": { username: "clubA", password: "secretA" } });

    const credentials = await getFbiCredentials(supabase, KEY, "club-a");

    expect(credentials).toEqual({ username: "clubA", password: "secretA" });
  });

  it("renvoie null quand aucun identifiant n'est enregistré (FBI facultatif)", async () => {
    const supabase = makeFakeSupabase({});

    expect(await getFbiCredentials(supabase, KEY, "club-a")).toBeNull();
  });

  it("isole strictement deux clubs : les identifiants d'un club ne sont jamais mélangés avec ceux d'un autre (§56 du brief FBI)", async () => {
    const supabase = makeFakeSupabase({
      "club-a": { username: "clubA", password: "secretA" },
      "club-b": { username: "clubB", password: "secretB" },
    });

    const [credA, credB] = await Promise.all([getFbiCredentials(supabase, KEY, "club-a"), getFbiCredentials(supabase, KEY, "club-b")]);

    expect(credA).toEqual({ username: "clubA", password: "secretA" });
    expect(credB).toEqual({ username: "clubB", password: "secretB" });
  });
});
