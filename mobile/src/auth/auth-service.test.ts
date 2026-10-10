import { describe, expect, it } from "vitest";
import { parseCallback, SsoCancelled } from "./callback";

describe("rappel de la connexion Safari", () => {
  it("code + state attendu", () => {
    expect(parseCallback("fr.ballmanager.app://auth/callback?code=abc&state=s1", "s1")).toEqual({ code: "abc" });
  });
  it("state différent : refusé (CSRF / réponse rejouée)", () => {
    expect(() => parseCallback("fr.ballmanager.app://auth/callback?code=abc&state=autre", "s1")).toThrow(/state/);
  });
  it("annulation par l'utilisateur", () => {
    expect(() => parseCallback("fr.ballmanager.app://auth/callback?error=cancelled&state=s1", "s1")).toThrow(SsoCancelled);
  });
  it("rappel vers une autre destination : refusé", () => {
    expect(() => parseCallback("fr.ballmanager.app://autre?code=abc&state=s1", "s1")).toThrow();
  });
});
