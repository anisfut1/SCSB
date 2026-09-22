import { describe, expect, it } from "vitest";
import { listMatches, type MatchListItemDto } from "./matches";
import type { ApiFetcher } from "./client";

function fakeMatch(id: string): MatchListItemDto {
  return {
    id,
    numero: null,
    journee: null,
    matchDatetime: null,
    isHome: null,
    teamName: null,
    opponentName: null,
    venueLabel: null,
    scoreHome: null,
    scoreAway: null,
    status: "scheduled",
    emarqueStatus: "not_applicable",
  } as MatchListItemDto;
}

describe("listMatches", () => {
  it("transmet from/to en query params (filtre CÔTÉ API, jamais un fetch complet filtré ensuite)", async () => {
    const calls: string[] = [];
    const fetcher: ApiFetcher = (async (path: string) => {
      calls.push(path);
      return { matches: [], pagination: { limit: 200, offset: 0, total: 0 } };
    }) as ApiFetcher;

    await listMatches(fetcher, "club-1", { from: "2026-08-01T00:00:00.000Z", to: "2027-01-01T00:00:00.000Z" });

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]!, "http://x");
    expect(url.searchParams.get("from")).toBe("2026-08-01T00:00:00.000Z");
    expect(url.searchParams.get("to")).toBe("2027-01-01T00:00:00.000Z");
  });

  it("pagine jusqu'à récupérer pagination.total résultats, pas un seul appel supposé tout ramener", async () => {
    // 250 matchs au total, page de 200 (PAGE_SIZE) : 2 appels attendus.
    const page1 = Array.from({ length: 200 }, (_, i) => fakeMatch(`m${i}`));
    const page2 = Array.from({ length: 50 }, (_, i) => fakeMatch(`m${200 + i}`));
    const offsetsRequested: number[] = [];

    const fetcher: ApiFetcher = (async (path: string) => {
      const offset = Number(new URL(path, "http://x").searchParams.get("offset"));
      offsetsRequested.push(offset);
      return {
        matches: offset === 0 ? page1 : page2,
        pagination: { limit: 200, offset, total: 250 },
      };
    }) as ApiFetcher;

    const matches = await listMatches(fetcher, "club-1", {});

    expect(offsetsRequested).toEqual([0, 200]);
    expect(matches).toHaveLength(250);
  });

  it("s'arrête après une seule page quand elle renvoie moins que PAGE_SIZE éléments", async () => {
    let requestCount = 0;
    const fetcher: ApiFetcher = (async () => {
      requestCount += 1;
      return { matches: [fakeMatch("only-one")], pagination: { limit: 200, offset: 0, total: 1 } };
    }) as ApiFetcher;

    const matches = await listMatches(fetcher, "club-1", {});

    expect(requestCount).toBe(1);
    expect(matches).toHaveLength(1);
  });
});
