import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchListItemDto } from "./matches";

const mockApiFetch = vi.fn();
vi.mock("./client", async () => {
  const actual = await vi.importActual<typeof import("./client")>("./client");
  return { ...actual, apiFetch: (...args: unknown[]) => mockApiFetch(...args) };
});

import { listPublicMatches, PUBLIC_MATCHES_MAX_PAGES } from "./publicMatches";

/** Faux serveur public : `total` matchs au total, tri croissant, `limit`/`offset` respectés. */
function serve(total: number) {
  const all = Array.from({ length: total }, (_, i) => ({ id: `m${String(i).padStart(5, "0")}` }) as MatchListItemDto);
  mockApiFetch.mockImplementation(async (path: string) => {
    const q = new URL(path, "http://api.test").searchParams;
    const limit = Number(q.get("limit") ?? 50);
    const offset = Number(q.get("offset") ?? 0);
    return { matches: all.slice(offset, offset + limit), pagination: { limit, offset, total } };
  });
  return all;
}

const calls = () => mockApiFetch.mock.calls.map(([path]) => new URL(path as string, "http://api.test"));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listPublicMatches — pagination jusqu'à épuisement (R-015)", () => {
  // Caractérisation d'origine (écrite AVANT le correctif, verte sur l'ancien code) : un seul appel
  // `limit=200` ; 390 matchs → 200 reçus, 190 perdus. Remplacée ci-dessous par l'attendu corrigé.
  it("saison de 390 matchs : TOUS les matchs sont récupérés, en 2 pages de 200, dans l'ordre", async () => {
    const all = serve(390);

    const matches = await listPublicMatches("sete", { from: "2026-08-01T00:00:00.000Z" });

    expect(matches.map((m) => m.id)).toEqual(all.map((m) => m.id));
    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    expect(calls().map((u) => [u.searchParams.get("limit"), u.searchParams.get("offset")])).toEqual([
      ["200", "0"],
      ["200", "200"],
    ]);
  });

  it("moins de 200 matchs : un seul appel (aucune requête de trop)", async () => {
    serve(57);

    expect(await listPublicMatches("sete")).toHaveLength(57);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it("exactement 200 matchs : s'arrête grâce à pagination.total, sans page vide", async () => {
    serve(200);

    expect(await listPublicMatches("sete")).toHaveLength(200);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it("aucun match : une requête, liste vide", async () => {
    serve(0);

    expect(await listPublicMatches("sete")).toEqual([]);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it("plafond de sécurité : un total aberrant ne provoque jamais plus de MAX_PAGES requêtes", async () => {
    mockApiFetch.mockImplementation(async (path: string) => {
      const offset = Number(new URL(path, "http://api.test").searchParams.get("offset"));
      return { matches: Array.from({ length: 200 }, (_, i) => ({ id: `m${offset + i}` })), pagination: { limit: 200, offset, total: 9_999_999 } };
    });

    const matches = await listPublicMatches("sete");

    expect(mockApiFetch).toHaveBeenCalledTimes(PUBLIC_MATCHES_MAX_PAGES);
    expect(matches).toHaveLength(PUBLIC_MATCHES_MAX_PAGES * 200);
  });

  it("une page pleine sans `pagination` dans la réponse : continue jusqu'à une page incomplète", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ matches: Array.from({ length: 200 }, (_, i) => ({ id: `a${i}` })) })
      .mockResolvedValueOnce({ matches: [{ id: "b0" }] });

    expect(await listPublicMatches("sete")).toHaveLength(201);
    expect(mockApiFetch).toHaveBeenCalledTimes(2);
  });

  it("une erreur sur une page suivante remonte (jamais une liste silencieusement partielle)", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ matches: Array.from({ length: 200 }, (_, i) => ({ id: `a${i}` })), pagination: { limit: 200, offset: 0, total: 400 } })
      .mockRejectedValueOnce(new Error("réseau"));

    await expect(listPublicMatches("sete")).rejects.toThrow("réseau");
  });

  it("transmet les filtres from/to/teamId/homeAway sur CHAQUE page (comportement conservé)", async () => {
    serve(250);

    await listPublicMatches("sete", { from: "2026-08-01T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z", teamId: "t-1", homeAway: "home" });

    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    for (const url of calls()) {
      const q = url.searchParams;
      expect([q.get("from"), q.get("to"), q.get("teamId"), q.get("homeAway")]).toEqual(["2026-08-01T00:00:00.000Z", "2027-01-01T00:00:00.000Z", "t-1", "home"]);
    }
  });
});
