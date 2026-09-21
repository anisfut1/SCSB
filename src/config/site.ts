/**
 * Constantes de configuration produit (pas de secret ici, ce fichier est
 * importable côté client comme côté serveur).
 */

export const SITE_NAME = "SC Sète Basket";

/**
 * Chemins accessibles sans session. Tout le reste de l'application est
 * protégé par défaut (voir `src/middleware.ts`) : plutôt qu'une liste des
 * routes protégées à maintenir à chaque nouveau module, on maintient une
 * liste courte des routes publiques.
 */
export const PUBLIC_PATHS = ["/login"];

export interface DashboardCardConfig {
  title: string;
  description: string;
}

/**
 * Cartes placeholder du dashboard (Phase 0). Chaque module listé ici sera
 * remplacé par un vrai lien vers sa page dans sa propre phase.
 */
export const DASHBOARD_PLACEHOLDER_CARDS: DashboardCardConfig[] = [
  { title: "Matchs", description: "Bientôt disponible" },
  { title: "Tables de marque", description: "Bientôt disponible" },
  { title: "Dérogations", description: "Bientôt disponible" },
];
