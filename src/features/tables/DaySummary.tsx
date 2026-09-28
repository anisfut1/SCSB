import type { TableAssignmentsForMatchDto } from "@/lib/api/tables";

/**
 * Résumé léger en haut de page (§79 : "6 matchs domicile / 18 postes / 14
 * affectés / 4 à attribuer / 1 conflit") — pas de grosses cartes KPI,
 * juste une ligne de texte, plus adaptée à la DA sobre déjà en place.
 */
export function DaySummary({ matches }: { matches: TableAssignmentsForMatchDto[] }) {
  const totalSlots = matches.length * 3;
  const assignedSlots = matches.reduce((count, m) => count + [m.assignments.scorer, m.assignments.timekeeper, m.assignments.clubDelegate].filter(Boolean).length, 0);
  const conflictSlots = matches.reduce((count, m) => count + [m.assignments.scorer, m.assignments.timekeeper, m.assignments.clubDelegate].filter((s) => s?.hasConflict).length, 0);
  const toAssign = totalSlots - assignedSlots;

  const parts = [
    `${matches.length} match${matches.length > 1 ? "s" : ""} domicile`,
    `${totalSlots} poste${totalSlots > 1 ? "s" : ""}`,
    `${assignedSlots} affecté${assignedSlots > 1 ? "s" : ""}`,
    `${toAssign} à attribuer`,
  ];
  if (conflictSlots > 0) parts.push(`${conflictSlots} conflit${conflictSlots > 1 ? "s" : ""}`);

  return <p className="text-sm text-black/60 dark:text-white/60">{parts.join(" / ")}</p>;
}
