import { describe, expect, it } from "vitest";
import { listDerogations } from "./derogations";
import type { ApiFetcher } from "./client";

function fakeFetcher(response: unknown): { fetcher: ApiFetcher; calls: string[] } {
  const calls: string[] = [];
  const fetcher: ApiFetcher = (async (path: string) => {
    calls.push(path);
    return response;
  }) as ApiFetcher;
  return { fetcher, calls };
}

describe("listDerogations", () => {
  it("appelle GET /v1/clubs/:clubId/derogations et déballe le tableau", async () => {
    const derogation = {
      matchId: "match-1",
      opponentName: "Castelnau Basket - 2",
      matchDatetime: "2026-09-26T13:30:00.000Z",
      numero: "1",
      etat: "Acceptée par l'organisme dirigeant",
      dateDepot: null,
      dateDerogation: null,
      dateRencontre: "26/09/2026",
      heure: "15:30",
      domicile: "SPORT CLUB DE SETE BASKET - 1",
      visiteur: "CASTELNAU BASKET - 2",
      checkedAt: "2026-09-25T16:00:00.000Z",
    };
    const { fetcher, calls } = fakeFetcher({ derogations: [derogation] });

    const result = await listDerogations(fetcher, "club-1");

    expect(calls).toEqual(["/v1/clubs/club-1/derogations"]);
    expect(result).toEqual([derogation]);
  });
});
