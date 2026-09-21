import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { loadWorkerConfig } from "../src/config.js";

const VALID_KEY = randomBytes(32).toString("base64");

const BASE_ENV = {
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  FBI_CREDENTIALS_ENCRYPTION_KEY: VALID_KEY,
};

describe("loadWorkerConfig", () => {
  it("charge une config valide avec les valeurs par défaut", () => {
    const config = loadWorkerConfig(BASE_ENV);

    expect(config.supabaseUrl).toBe(BASE_ENV.SUPABASE_URL);
    expect(config.concurrency).toBe(2);
    expect(config.fbiEncryptionKey.length).toBe(32);
  });

  it("lève une erreur si une variable requise manque", () => {
    expect(() => loadWorkerConfig({ ...BASE_ENV, SUPABASE_URL: undefined })).toThrow(/SUPABASE_URL/);
  });

  it("lève une erreur si la clé de chiffrement ne fait pas 32 octets", () => {
    expect(() => loadWorkerConfig({ ...BASE_ENV, FBI_CREDENTIALS_ENCRYPTION_KEY: Buffer.from("trop-court").toString("base64") })).toThrow(
      /32 octets/,
    );
  });

  it("respecte les overrides d'environnement (concurrency, poll interval)", () => {
    const config = loadWorkerConfig({ ...BASE_ENV, WORKER_CONCURRENCY: "5", WORKER_POLL_INTERVAL_MS: "1000" });

    expect(config.concurrency).toBe(5);
    expect(config.pollIntervalMs).toBe(1000);
  });
});
