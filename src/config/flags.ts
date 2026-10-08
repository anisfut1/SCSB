import "server-only";

/**
 * Feature flags de la migration (docs/migration/03-plan-migration.md).
 * Lus côté SERVEUR uniquement (variable sans préfixe NEXT_PUBLIC_ : un flag
 * n'est jamais exposé au navigateur) ; défaut = ancien comportement.
 */
function enabled(name: string): boolean {
  return process.env[name] === "1";
}

/** LOT-06 : filtres de la liste des matchs (équipe, domicile/extérieur, période) appliqués par l'API. */
export function matchesServerFiltersEnabled(): boolean {
  return enabled("FF_MATCHES_SERVER_FILTERS");
}
