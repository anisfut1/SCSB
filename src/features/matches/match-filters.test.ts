import { describe, expect, it } from "vitest";
import { applyMatchFilters, buildFilterHref, parseMatchFilters } from "./match-filters";
import type { MatchListItemDto } from "@/lib/api/matches";

function match(overrides: Partial<MatchListItemDto>): MatchListItemDto {
  return {
    id: "m",
    numero: null,
    journee: null,
    matchDatetime: null,
    isHome: true,
    teamName: "U15",
    opponentName: "Agde",
    opponentLogoUrl: null,
    venueLabel: null,
    scoreHome: null,
    scoreAway: null,
    status: "scheduled",
    emarqueStatus: "pending",
    derogationStatus: null,
    ...overrides,
  };
}

describe("match filters", () => {
  it("parses defaults and ignores unknown values", () => {
    expect(parseMatchFilters({})).toEqual({ when: "weekend", side: "all", team: null });
    expect(parseMatchFilters({ when: "past", side: "away", team: "t1" })).toEqual({ when: "past", side: "away", team: "t1" });
    expect(parseMatchFilters({ when: "nope", side: ["home"] })).toEqual({ when: "weekend", side: "all", team: null });
  });

  it("builds hrefs omitting default values", () => {
    const current = { when: "weekend", side: "all", team: null } as const;
    expect(buildFilterHref("/c/x/matchs", current, {})).toBe("/c/x/matchs");
    expect(buildFilterHref("/c/x/matchs", current, { when: "upcoming", team: "t1" })).toBe("/c/x/matchs?when=upcoming&team=t1");
  });

  it("filters by side, team and period, sorted", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    const all = [
      match({ id: "a", matchDatetime: "2026-10-10T18:00:00Z", isHome: false }),
      match({ id: "b", matchDatetime: "2026-10-05T18:00:00Z", teamName: "U17" }),
      match({ id: "c", matchDatetime: "2026-09-20T18:00:00Z" }),
    ];
    const teams = [{ id: "t15", name: "U15", category: null, sexe: null, numeroEquipe: null, active: true }];
    expect(applyMatchFilters(all, teams, { when: "upcoming", side: "all", team: null }, now).map((m) => m.id)).toEqual(["b", "a"]);
    expect(applyMatchFilters(all, teams, { when: "upcoming", side: "home", team: null }, now).map((m) => m.id)).toEqual(["b"]);
    expect(applyMatchFilters(all, teams, { when: "upcoming", side: "all", team: "t15" }, now).map((m) => m.id)).toEqual(["a"]);
    expect(applyMatchFilters(all, teams, { when: "past", side: "all", team: null }, now).map((m) => m.id)).toEqual(["c"]);
  });
});
