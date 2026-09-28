import { describe, expect, it } from "vitest";
import { computeDaySummary } from "./DaySummary";
import type { TableAssignmentSlotDto, TableAssignmentsForMatchDto } from "@/lib/api/tables";

function slot(hasConflict = false): TableAssignmentSlotDto {
  return { id: "a1", licencie: { id: "l1", firstName: "Thomas", lastName: "Martin" }, teams: [], hasConflict, conflictReason: hasConflict ? "Conflit." : null };
}

function match(overrides: Partial<TableAssignmentsForMatchDto["assignments"]> = {}, hasConflict = false): TableAssignmentsForMatchDto {
  return {
    match: { id: "m1", numero: null, matchDatetime: null, teamName: null, opponentName: null, venueLabel: null },
    assignments: { scorer: null, timekeeper: null, clubDelegate: null, ...overrides },
    hasConflict,
  };
}

describe("computeDaySummary", () => {
  it("compte 0 poste/0 match sur une journée vide", () => {
    expect(computeDaySummary([])).toEqual({ matchCount: 0, totalSlots: 0, assignedSlots: 0, toAssign: 0, conflictSlots: 0 });
  });

  it("3 postes par match, jamais affectés/à attribuer confondus", () => {
    const result = computeDaySummary([match(), match()]);
    expect(result).toEqual({ matchCount: 2, totalSlots: 6, assignedSlots: 0, toAssign: 6, conflictSlots: 0 });
  });

  it("compte les postes affectés (peu importe le rôle) et les conflits séparément", () => {
    const result = computeDaySummary([
      match({ scorer: slot(), timekeeper: slot(true), clubDelegate: null }, true),
      match({ scorer: slot(), timekeeper: slot(), clubDelegate: slot() }),
    ]);
    expect(result).toEqual({ matchCount: 2, totalSlots: 6, assignedSlots: 5, toAssign: 1, conflictSlots: 1 });
  });
});
