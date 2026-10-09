import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/public-session/policy";
import { openSession, sealSession } from "@/lib/public-session/seal";

const valid = vi.fn();
vi.mock("@/lib/public-session/validate", () => ({ publicTokenValid: (...a: unknown[]) => valid(...a) }));

import { DELETE, GET, POST } from "./route";

const SECRET = "s".repeat(40);
const ORIGIN = "https://www.ball-manager.fr";
const T1 = "token-un-valide-1111";
const T2 = "token-deux-valide-2222";

function req(slug: string, method: string, opts: { body?: unknown; cookie?: string; csrf?: boolean; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...(opts.csrf === false ? {} : { "x-bm-csrf": "1" }), ...(opts.cookie ? { cookie: `${SESSION_COOKIE}=${opts.cookie}` } : {}), ...opts.headers };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  return new NextRequest(`${ORIGIN}/public/${slug}/session`, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
}
const ctx = (slug: string) => ({ params: Promise.resolve({ clubSlug: slug }) });
const setCookie = (res: Response) => res.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`));
const cookieValue = (res: Response) => setCookie(res)!.split(";")[0].slice(SESSION_COOKIE.length + 1);
const sealFor = (slug: string, tokens: string[], extra: Partial<{ epoch: string; issuedAt: number }> = {}) =>
  sealSession({ v: 1, slug, epoch: "1", firstIssuedAt: Date.now(), issuedAt: Date.now(), tokens, ...extra }, SECRET);

beforeEach(() => {
  valid.mockReset();
  vi.stubEnv("SESSION_SECRET", SECRET);
  vi.stubEnv("SESSION_EPOCH", "1");
});

describe("/public/{slug}/session", () => {
  it("première connexion : valide le jeton côté serveur, pose un cookie HttpOnly/SameSite=Lax limité au club", async () => {
    valid.mockResolvedValue(true);
    const res = await POST(req("sete", "POST", { body: { tokens: [T1], active: T1 } }), ctx("sete"));
    expect(res.status).toBe(200);
    expect(valid).toHaveBeenCalledWith("sete", T1);
    const cookie = setCookie(res)!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\/public\/sete/);
    expect(cookie).toMatch(/Max-Age=7776000/); // 90 jours
    expect(cookie).not.toContain(T1);
    expect(openSession(cookieValue(res), SECRET)?.tokens).toEqual([T1]);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("jeton refusé par l'API : aucune session créée", async () => {
    valid.mockResolvedValue(false);
    const res = await POST(req("sete", "POST", { body: { tokens: [T1] } }), ctx("sete"));
    expect(res.status).toBe(401);
    expect(setCookie(res)).toBeUndefined();
  });

  it("retour sans token : GET restitue les jetons de la session (fermeture/réouverture)", async () => {
    const res = await GET(req("sete", "GET", { cookie: sealFor("sete", [T1, T2]) }), ctx("sete"));
    expect(await res.json()).toEqual({ tokens: [T1, T2] });
  });

  it("sans cookie : liste vide", async () => {
    expect(await (await GET(req("sete", "GET"), ctx("sete"))).json()).toEqual({ tokens: [] });
  });

  it("renouvellement glissant : un cookie de plus d'un jour est ré-émis, un cookie frais non", async () => {
    const old = await GET(req("sete", "GET", { cookie: sealFor("sete", [T1], { issuedAt: Date.now() - 3 * 86_400_000 }) }), ctx("sete"));
    expect(setCookie(old)).toBeDefined();
    const fresh = await GET(req("sete", "GET", { cookie: sealFor("sete", [T1]) }), ctx("sete"));
    expect(setCookie(fresh)).toBeUndefined();
  });

  it("session expirée (> 90 jours) : rejetée et cookie effacé", async () => {
    const res = await GET(req("sete", "GET", { cookie: sealFor("sete", [T1], { issuedAt: Date.now() - 91 * 86_400_000 }) }), ctx("sete"));
    expect(await res.json()).toEqual({ tokens: [] });
    expect(setCookie(res)).toMatch(/Max-Age=0/);
  });

  it("isolation entre clubs : le cookie d'un club n'ouvre pas un autre club", async () => {
    const res = await GET(req("autre-club", "GET", { cookie: sealFor("sete", [T1]) }), ctx("autre-club"));
    expect(await res.json()).toEqual({ tokens: [] });
  });

  it("révocation globale : changer SESSION_EPOCH invalide toutes les sessions", async () => {
    const cookie = sealFor("sete", [T1]);
    vi.stubEnv("SESSION_EPOCH", "2");
    expect(await (await GET(req("sete", "GET", { cookie }), ctx("sete"))).json()).toEqual({ tokens: [] });
  });

  it("changement de profil : un second jeton s'ajoute et devient actif, l'ancien reste disponible", async () => {
    valid.mockResolvedValue(true);
    const res = await POST(req("sete", "POST", { cookie: sealFor("sete", [T1]), body: { tokens: [T2], active: T2 } }), ctx("sete"));
    expect(openSession(cookieValue(res), SECRET)?.tokens).toEqual([T2, T1]);
    expect(valid).toHaveBeenCalledTimes(1); // T1 déjà connu : non revalidé
  });

  it("déconnexion volontaire : DELETE efface cookie de session et marqueur", async () => {
    const res = await DELETE(req("sete", "DELETE", { cookie: sealFor("sete", [T1, T2]), body: {} }), ctx("sete"));
    expect(setCookie(res)).toMatch(/Max-Age=0/);
  });

  it("révocation d'un jeton : DELETE ciblé retire seulement celui-là", async () => {
    const res = await DELETE(req("sete", "DELETE", { cookie: sealFor("sete", [T1, T2]), body: { tokens: [T1] } }), ctx("sete"));
    expect(openSession(cookieValue(res), SECRET)?.tokens).toEqual([T2]);
  });

  it("CSRF : sans en-tête personnalisé ou depuis une autre origine → 403, rien n'est écrit", async () => {
    valid.mockResolvedValue(true);
    expect((await POST(req("sete", "POST", { csrf: false, body: { tokens: [T1] } }), ctx("sete"))).status).toBe(403);
    expect((await POST(req("sete", "POST", { headers: { origin: "https://evil.example" }, body: { tokens: [T1] } }), ctx("sete"))).status).toBe(403);
    expect((await GET(req("sete", "GET", { csrf: false, cookie: sealFor("sete", [T1]) }), ctx("sete"))).status).toBe(403);
    expect(valid).not.toHaveBeenCalled();
  });

  it("sans SESSION_SECRET : 503 (le front retombe sur son comportement d'avant)", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    expect((await GET(req("sete", "GET"), ctx("sete"))).status).toBe(503);
  });

  it("slug invalide : 404", async () => {
    expect((await GET(req("../x", "GET"), ctx("../x"))).status).toBe(404);
  });
});
