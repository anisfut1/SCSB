import { describe, expect, it } from "vitest";
import { buildAgenda } from "./agenda";

const match = (id: string, at: string) => ({ match: { id, matchDatetime: at } as never, relations: ["PLAYER" as const] });
const ev = (kind: "MATCH" | "TRAINING", id: string, team: string, at: string) => ({ kind, id, team: { id: team, name: team }, startsAt: at, endsAt: null, title: "x", isHome: null, location: null, status: "scheduled", forFirstNames: ["Lina"] });

describe("Mon agenda : matchs + entraînements", () => {
  it("mêle entraînements et matchs par date, sans doubler un match déjà affiché, avec la relation (coach / joueur)", () => {
    const items = buildAgenda(
      { upcoming: [match("m1", "2026-10-11T13:00:00Z")] },
      {
        people: [{ tokenIndex: 0, licencieId: "a", firstName: "Lina", lastName: "M", team: { id: "u15", name: "U15" }, coachTeams: [{ id: "u9", name: "U9" }] }],
        upcoming: [ev("MATCH", "m1", "u15", "2026-10-11T13:00:00Z"), ev("TRAINING", "t1", "u15", "2026-10-10T17:00:00Z"), ev("TRAINING", "t2", "u9", "2026-10-12T17:00:00Z")],
      },
    );
    expect(items.map((i) => i.key)).toEqual(["TRAINING-t1", "m-m1", "TRAINING-t2"]);
    expect(items.map((i) => (i.kind === "EVENT" ? i.relations : null))).toEqual([["PLAYER"], null, ["COACH"]]);
  });
  it("sans données « À faire » : les matchs seuls, comme avant", () => {
    expect(buildAgenda({ upcoming: [match("m1", "2026-10-11T13:00:00Z")] }, null)).toHaveLength(1);
  });
});
