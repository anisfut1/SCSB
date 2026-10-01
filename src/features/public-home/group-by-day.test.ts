import { describe, expect, it } from "vitest";
import { groupByDay } from "./group-by-day";

describe("groupByDay", () => {
  it("un seul en-tête par jour (fuseau du club), ordre conservé, sans date à la fin", () => {
    const items = [
      { id: "a", at: "2026-10-03T11:00:00Z" }, // sam. 13:00 Paris
      { id: "b", at: "2026-10-03T18:00:00Z" }, // sam. 20:00 Paris
      { id: "x", at: null },
      { id: "c", at: "2026-10-03T22:30:00Z" }, // dim. 00:30 Paris → dimanche
    ];
    const groups = groupByDay(items, (i) => i.at, "Europe/Paris");
    expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ["Samedi 3 octobre", ["a", "b"]],
      ["Dimanche 4 octobre", ["c"]],
      ["Date à confirmer", ["x"]],
    ]);
  });
});
