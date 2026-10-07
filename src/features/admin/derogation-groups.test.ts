import { describe, expect, it } from "vitest";
import type { DerogationListItemDto } from "@/lib/api/derogations";
import { etatTone, groupDerogationsByMatch, parseFbiDate, summarizeEtats } from "./derogation-groups";

function derogation(overrides: Partial<DerogationListItemDto>): DerogationListItemDto {
  return {
    id: "d-1",
    numero: "9608",
    etat: "Refusée",
    dateDepot: null,
    dateDerogation: null,
    dateRencontre: null,
    heure: null,
    domicile: null,
    visiteur: null,
    demandeur: null,
    motif: null,
    dateRencontreDemandee: null,
    heureDemandee: null,
    adversaire: null,
    dateReponse: null,
    acceptation: null,
    motifRefus: null,
    checkedAt: "2026-10-07T09:15:00Z",
    actionRequired: false,
    matchId: "m-9608",
    opponentName: "BASKET BALL LUNEL VIEL - 1",
    matchDatetime: "2026-10-17T18:00:00Z",
    categoryLabel: "Seniors",
    teamName: "Seniors M 3",
    scheduleConflict: null,
    ...overrides,
  } as DerogationListItemDto;
}

describe("groupDerogationsByMatch", () => {
  it("regroupe toutes les dérogations d'un même match dans une seule carte (rencontre 9608 : 3 dérogations, 2 refusées)", () => {
    const groups = groupDerogationsByMatch([
      derogation({ id: "a", etat: "Refusée", dateDepot: "01/09/2026" }),
      derogation({ id: "other", matchId: "m-other", numero: "9700" }),
      derogation({ id: "b", etat: "Refusée", dateDepot: "10/09/2026" }),
      derogation({ id: "c", etat: "Acceptée par l'organisme dirigeant", dateDepot: "20/09/2026" }),
    ]);

    expect(groups).toHaveLength(2);
    const group9608 = groups.find((g) => g.key === "match:m-9608")!;
    expect(group9608.derogations.map((d) => d.id)).toEqual(["c", "b", "a"]);
  });

  it("met en tête la dérogation qui attend une réponse du club, et le match concerné en premier", () => {
    const groups = groupDerogationsByMatch([
      derogation({ id: "x", matchId: "m-1", matchDatetime: "2026-10-01T10:00:00Z" }),
      derogation({ id: "old", matchId: "m-2", dateDepot: "20/09/2026", matchDatetime: "2026-12-01T10:00:00Z" }),
      derogation({ id: "pending", matchId: "m-2", etat: "En Cours", actionRequired: true, dateDepot: "01/09/2026", matchDatetime: "2026-12-01T10:00:00Z" }),
    ]);

    expect(groups[0]!.key).toBe("match:m-2");
    expect(groups[0]!.actionRequired).toBe(true);
    expect(groups[0]!.derogations[0]!.id).toBe("pending");
  });

  it("place les dérogations sans date connue après celles datées, sans inventer d'ordre entre elles", () => {
    const groups = groupDerogationsByMatch([derogation({ id: "nodate-1" }), derogation({ id: "dated", dateDepot: "05/09/2026" }), derogation({ id: "nodate-2" })]);
    expect(groups[0]!.derogations.map((d) => d.id)).toEqual(["dated", "nodate-1", "nodate-2"]);
  });
});

describe("summarizeEtats / etatTone / parseFbiDate", () => {
  it("compte les états tels que lus sur FBI", () => {
    expect(summarizeEtats([derogation({ etat: "Refusée" }), derogation({ etat: "Refusée" }), derogation({ etat: "Acceptée par l'organisme dirigeant" })])).toEqual([
      { etat: "Refusée", count: 2 },
      { etat: "Acceptée par l'organisme dirigeant", count: 1 },
    ]);
  });

  it("colore uniquement selon les mots présents dans le libellé", () => {
    expect(etatTone("Refusée")).toBe("danger");
    expect(etatTone("Acceptée par l'organisme dirigeant")).toBe("success");
    expect(etatTone("En Cours")).toBe("warning");
    expect(etatTone("Autre")).toBe("neutral");
    expect(etatTone(null)).toBe("neutral");
  });

  it("lit les dates FBI jj/mm/aaaa, null sinon", () => {
    expect(parseFbiDate("17/10/2026")).toBe(Date.UTC(2026, 9, 17));
    expect(parseFbiDate("—")).toBeNull();
    expect(parseFbiDate(null)).toBeNull();
  });
});
