import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env.server";

const VALID_FBI_KEY = Buffer.alloc(32, 7).toString("base64");
const VALID_CRON_SECRET = "a".repeat(16);

describe("parseServerEnv", () => {
  it("accepte une service role key non vide", () => {
    expect(
      parseServerEnv({
        SUPABASE_SERVICE_ROLE_KEY: "secret",
        CRON_SECRET: VALID_CRON_SECRET,
        FBI_CREDENTIALS_ENCRYPTION_KEY: VALID_FBI_KEY,
      }),
    ).toEqual({
      SUPABASE_SERVICE_ROLE_KEY: "secret",
      CRON_SECRET: VALID_CRON_SECRET,
      FBI_CREDENTIALS_ENCRYPTION_KEY: VALID_FBI_KEY,
    });
  });

  it("rejette une service role key manquante", () => {
    expect(() => parseServerEnv({ CRON_SECRET: VALID_CRON_SECRET, FBI_CREDENTIALS_ENCRYPTION_KEY: VALID_FBI_KEY })).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("rejette une service role key vide", () => {
    expect(() =>
      parseServerEnv({ SUPABASE_SERVICE_ROLE_KEY: "", CRON_SECRET: VALID_CRON_SECRET, FBI_CREDENTIALS_ENCRYPTION_KEY: VALID_FBI_KEY }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("rejette une clé de chiffrement FBI qui ne fait pas 32 octets", () => {
    expect(() =>
      parseServerEnv({ SUPABASE_SERVICE_ROLE_KEY: "secret", CRON_SECRET: VALID_CRON_SECRET, FBI_CREDENTIALS_ENCRYPTION_KEY: "trop-court" }),
    ).toThrow(/FBI_CREDENTIALS_ENCRYPTION_KEY/);
  });

  it("rejette un CRON_SECRET trop court", () => {
    expect(() =>
      parseServerEnv({ SUPABASE_SERVICE_ROLE_KEY: "secret", CRON_SECRET: "trop-court", FBI_CREDENTIALS_ENCRYPTION_KEY: VALID_FBI_KEY }),
    ).toThrow(/CRON_SECRET/);
  });
});
