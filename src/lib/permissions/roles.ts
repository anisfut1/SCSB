import type { AppRole } from "@/types/database";

export type { AppRole };

/**
 * Libellés affichables des rôles (ARCHITECTURE.md §6). Tenus séparés des
 * valeurs de l'enum SQL pour pouvoir changer le libellé sans migration.
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  correspondant_club: "Correspondant club",
  responsable_tables: "Responsable tables",
  coach: "Coach",
  joueur: "Joueur",
  parent: "Parent",
};

/**
 * Un utilisateur peut cumuler plusieurs rôles : ces fonctions opèrent donc
 * toujours sur une liste de rôles, jamais sur un rôle unique.
 */
export function hasRole(roles: readonly AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: readonly AppRole[], allowed: readonly AppRole[]): boolean {
  return allowed.some((role) => roles.includes(role));
}

export function isSuperAdmin(roles: readonly AppRole[]): boolean {
  return hasRole(roles, "super_admin");
}
