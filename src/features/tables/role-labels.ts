import type { TableAssignmentRole } from "@/lib/api/tables";

/** Libellés FR des 3 rôles (§3 de la demande) — mêmes libellés que `ROLE_LABELS` côté club-manager-api (table-suggestion-service.ts), capitalisés ici pour les titres d'UI. */
export const TABLE_ROLE_LABELS: Record<TableAssignmentRole, string> = {
  SCORER: "Marqueur",
  TIMEKEEPER: "Chronométreur",
  CLUB_DELEGATE: "Délégué de club",
};

/** "Choisir un marqueur" / "...un chronométreur" / "...un délégué de club" (§72) — les 3 rôles sont masculins, toujours "un". */
export function chooseRolePanelTitle(role: TableAssignmentRole): string {
  return `Choisir un ${TABLE_ROLE_LABELS[role].toLowerCase()}`;
}

export const TABLE_ROLES: readonly TableAssignmentRole[] = ["SCORER", "TIMEKEEPER", "CLUB_DELEGATE"];
