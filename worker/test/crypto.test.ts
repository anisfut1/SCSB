import { createCipheriv, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, DecryptionError } from "../src/crypto.js";

function encrypt(plaintext: string, key: Buffer, aad: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { ciphertext: encrypted.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

const KEY = randomBytes(32);

describe("decryptSecret (déchiffrement worker, AES-256-GCM AAD=club_id)", () => {
  it("déchiffre un secret chiffré avec la même clé et le même AAD (club_id)", () => {
    const payload = encrypt("mot-de-passe-fbi", KEY, "club-1");
    expect(decryptSecret(payload, KEY, "club-1")).toBe("mot-de-passe-fbi");
  });

  it("refuse de déchiffrer avec l'AAD d'un AUTRE club (§52 du brief FBI : isolation stricte par club)", () => {
    const payload = encrypt("mot-de-passe-fbi", KEY, "club-1");
    expect(() => decryptSecret(payload, KEY, "club-2")).toThrow(DecryptionError);
  });

  it("refuse de déchiffrer avec une mauvaise clé", () => {
    const payload = encrypt("mot-de-passe-fbi", KEY, "club-1");
    expect(() => decryptSecret(payload, randomBytes(32), "club-1")).toThrow(DecryptionError);
  });
});
