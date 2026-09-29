import type { TableAssignmentsForMatchDto } from "@/lib/api/tables";

/**
 * Fonction pure isolée pour être testable indépendamment du rendu (même
 * principe que le moteur de suggestion côté club-manager-api).
 *
 * `refereeNotNeeded` (retour du club, 2026-09-28 : "pas besoin d'arbitre")
 * retire le poste Arbitre du compte pour CE match, dans les deux sens :
 * ni compté dans `totalSlots`, ni dans `toAssign`, même s'il vaut `null` —
 * un club qui n'a jamais besoin d'arbitre ne doit jamais voir de "postes à
 * attribuer" fantômes.
 */
export function computeDaySummary(matches: TableAssignmentsForMatchDto[]): { matchCount: number; totalSlots: number; assignedSlots: number; toAssign: number; conflictSlots: number } {
  let totalSlots = 0;
  let assignedSlots = 0;
  let conflictSlots = 0;

  for (const m of matches) {
    const requiredSlots = [m.assignments.scorer, m.assignments.timekeeper, m.assignments.clubDelegate, ...(m.refereeNotNeeded ? [] : [m.assignments.referee])];
    totalSlots += requiredSlots.length;
    assignedSlots += requiredSlots.filter(Boolean).length;
    conflictSlots += [m.assignments.scorer, m.assignments.timekeeper, m.assignments.clubDelegate, m.assignments.referee].filter((s) => s?.hasConflict).length;
  }

  return { matchCount: matches.length, totalSlots, assignedSlots, toAssign: totalSlots - assignedSlots, conflictSlots };
}

/**
 * Résumé léger en haut de page (§79 : "6 matchs domicile / 18 postes / 14
 * affectés / 4 à attribuer / 1 conflit") — pas de grosses cartes KPI,
 * juste une ligne de texte, plus adaptée à la DA sobre déjà en place.
 */
export function DaySummary({ matches }: { matches: TableAssignmentsForMatchDto[] }) {
  const { matchCount, totalSlots, assignedSlots, toAssign, conflictSlots } = computeDaySummary(matches);

  const parts = [
    `${matchCount} match${matchCount > 1 ? "s" : ""} domicile`,
    `${totalSlots} poste${totalSlots > 1 ? "s" : ""}`,
    `${assignedSlots} affecté${assignedSlots > 1 ? "s" : ""}`,
    `${toAssign} à attribuer`,
  ];
  if (conflictSlots > 0) parts.push(`${conflictSlots} conflit${conflictSlots > 1 ? "s" : ""}`);

  return <p className="text-sm text-black/60 dark:text-white/60">{parts.join(" / ")}</p>;
}
