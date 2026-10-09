import { describe, expect, it } from "vitest";
import { isPlausibleToken, isSameOriginRequest, isSessionLive, mergeTokens, needsRenewal, SESSION_ABSOLUTE_MAX_MS, SESSION_MAX_AGE_SECONDS, sessionSecret } from "./policy";
import { openSession, sealSession, type SessionPayload } from "./seal";

const SECRET = "x".repeat(40);
const DAY = 86_400_000;
const base: SessionPayload = { v: 1, slug: "sete", epoch: "1", firstIssuedAt: 1_000, issuedAt: 1_000, tokens: ["token-aaaa-1111", "token-bbbb-2222"] };

describe("scellage du cookie", () => {
  it("aller-retour, et le jeton n'apparaît pas en clair", () => {
    const sealed = sealSession(base, SECRET);
    expect(sealed).not.toContain("token-aaaa");
    expect(Buffer.from(sealed, "base64url").toString("utf8")).not.toContain("token-aaaa");
    expect(openSession(sealed, SECRET)).toEqual(base);
  });
  it("refuse un autre secret, un cookie altéré, du bruit et l'absence de cookie", () => {
    const sealed = sealSession(base, SECRET);
    expect(openSession(sealed, "y".repeat(40))).toBeNull();
    const bytes = Buffer.from(sealed, "base64url");
    bytes[bytes.length - 1] ^= 1;
    expect(openSession(bytes.toString("base64url"), SECRET)).toBeNull();
    expect(openSession("n'importe quoi", SECRET)).toBeNull();
    expect(openSession(undefined, SECRET)).toBeNull();
  });
  it("deux scellements du même contenu diffèrent (IV aléatoire)", () => {
    expect(sealSession(base, SECRET)).not.toBe(sealSession(base, SECRET));
  });
});

describe("politique de session", () => {
  const now = 1_000 + 10 * DAY;
  it("valide pour son club et son époque seulement (isolation entre clubs)", () => {
    expect(isSessionLive(base, "sete", "1", now)).toBe(true);
    expect(isSessionLive(base, "autre-club", "1", now)).toBe(false);
    expect(isSessionLive(base, "sete", "2", now)).toBe(false); // révocation globale SESSION_EPOCH
  });
  it("expire après 90 jours sans renouvellement, et au plafond absolu de 365 jours", () => {
    expect(isSessionLive(base, "sete", "1", 1_000 + SESSION_MAX_AGE_SECONDS * 1000 - 1)).toBe(true);
    expect(isSessionLive(base, "sete", "1", 1_000 + SESSION_MAX_AGE_SECONDS * 1000)).toBe(false);
    const renewed = { ...base, issuedAt: 1_000 + 300 * DAY };
    expect(isSessionLive(renewed, "sete", "1", 1_000 + 301 * DAY)).toBe(true);
    expect(isSessionLive({ ...renewed, issuedAt: 1_000 + SESSION_ABSOLUTE_MAX_MS }, "sete", "1", 1_000 + SESSION_ABSOLUTE_MAX_MS + 1)).toBe(false);
  });
  it("renouvelle au plus une fois par jour", () => {
    expect(needsRenewal(base, 1_000 + DAY - 1)).toBe(false);
    expect(needsRenewal(base, 1_000 + DAY)).toBe(true);
  });
  it("fusionne les jetons : actif en tête, sans doublon, plafonné à 8", () => {
    expect(mergeTokens(["a", "b"], ["c"], "b")).toEqual(["b", "c", "a"]);
    expect(mergeTokens(Array.from({ length: 6 }, (_, i) => `e${i}`), Array.from({ length: 6 }, (_, i) => `n${i}`))).toHaveLength(8);
  });
  it("secret : absent ou trop court = fonctionnalité désactivée", () => {
    expect(sessionSecret({})).toBeNull();
    expect(sessionSecret({ SESSION_SECRET: "court" })).toBeNull();
    expect(sessionSecret({ SESSION_SECRET: SECRET })).toBe(SECRET);
  });
  it("forme plausible d'un jeton", () => {
    expect(isPlausibleToken("abcdefgh")).toBe(true);
    expect(isPlausibleToken("court")).toBe(false);
    expect(isPlausibleToken("a b c d e f g h")).toBe(false);
    expect(isPlausibleToken(42)).toBe(false);
  });
});

describe("anti-CSRF", () => {
  const url = "https://www.ball-manager.fr/public/sete/session";
  const h = (init: Record<string, string>) => new Headers(init);
  it("exige l'en-tête personnalisé", () => {
    expect(isSameOriginRequest(h({}), url)).toBe(false);
    expect(isSameOriginRequest(h({ "x-bm-csrf": "1" }), url)).toBe(true);
  });
  it("refuse une origine ou un Sec-Fetch-Site étrangers", () => {
    expect(isSameOriginRequest(h({ "x-bm-csrf": "1", origin: "https://evil.example" }), url)).toBe(false);
    expect(isSameOriginRequest(h({ "x-bm-csrf": "1", "sec-fetch-site": "cross-site" }), url)).toBe(false);
    expect(isSameOriginRequest(h({ "x-bm-csrf": "1", origin: "https://www.ball-manager.fr", "sec-fetch-site": "same-origin" }), url)).toBe(true);
  });
});
