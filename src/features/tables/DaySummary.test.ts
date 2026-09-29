import { describe, expect, it } from "vitest";
import { computeDaySummary } from "./DaySummary";
import type { TableAssignmentSlotDto, TableAssignmentsForMatchDto } from "@/lib/api/tables";

function slot(hasConflict = false): TableAssignmentSlotDto {
  return { id: "a1", licencie: { id: "l1", firstName: "Thomas", lastName: "Martin" }, teams: [], hasConflict, conflictReason: hasConflict ? "Conflit." : null };
}

function match(overrides: Partial<TableAssignmentsForMatchDto["assignments"]> = {}, opts: { hasConflict?: boolean; refereeNotNeeded?: boolean } = {}): TableAssignmentsForMatchDto {
  return {
    match: { id: "m1", numero: null, matchDatetime: null, teamName: null, opponentName: null, venueLabel: null },
    assignments: { scorer: null, timekeeper: null, clubDelegate: null, referee: null, ...overrides },
    refereeNotNeeded: opts.refereeNotNeeded ?? false,
    hasConflict: opts.hasConflict ?? false,
  };
}

describe("computeDaySummary", () => {
  it("compte 0 poste/0 match sur une journée vide", () => {
    expect(computeDaySummary([])).toEqual({ matchCount: 0, totalSlots: 0, assignedSlots: 0, toAssign: 0, conflictSlots: 0 });
  });

  it("4 postes par match (marqueur/chrono/délégué/arbitre), jamais affectés/à attribuer confondus", () => {
    const result = computeDaySummary([match(), match()]);
    expect(result).toEqual({ matchCount: 2, totalSlots: 8, assignedSlots: 0, toAssign: 8, conflictSlots: 0 });
  });

  it("compte les postes affectés (peu importe le rôle) et les conflits séparément", () => {
    const result = computeDaySummary([
      match({ scorer: slot(), timekeeper: slot(true), clubDelegate: null }, { hasConflict: true }),
      match({ scorer: slot(), timekeeper: slot(), clubDelegate: slot(), referee: slot() }),
    ]);
    expect(result).toEqual({ matchCount: 2, totalSlots: 8, assignedSlots: 6, toAssign: 2, conflictSlots: 1 });
  });

  it("retour du club, 2026-09-28 : refereeNotNeeded retire le poste Arbitre du total ET du compte à attribuer, même si null", () => {
    const result = computeDaySummary([match({}, { refereeNotNeeded: true })]);
    expect(result).toEqual({ matchCount: 1, totalSlots: 3, assignedSlots: 0, toAssign: 3, conflictSlots: 0 });
  });

  it("refereeNotNeeded n'affecte jamais les 3 autres postes", () => {
    const result = computeDaySummary([match({ scorer: slot(), timekeeper: slot(), clubDelegate: slot() }, { refereeNotNeeded: true })]);
    expect(result).toEqual({ matchCount: 1, totalSlots: 3, assignedSlots: 3, toAssign: 0, conflictSlots: 0 });
  });
});
