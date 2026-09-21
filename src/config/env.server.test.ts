import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env.server";

describe("parseServerEnv", () => {
  it("accepte une service role key non vide", () => {
    expect(parseServerEnv({ SUPABASE_SERVICE_ROLE_KEY: "secret" })).toEqual({
      SUPABASE_SERVICE_ROLE_KEY: "secret",
    });
  });

  it("rejette une service role key manquante", () => {
    expect(() => parseServerEnv({})).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("rejette une service role key vide", () => {
    expect(() => parseServerEnv({ SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
