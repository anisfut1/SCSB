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
 * Cartes placeholder du dashboard pour les modules pas encore développés.
 * Le module Matchs est réel (voir /matchs) et n'est plus listé ici.
 */
export const DASHBOARD_PLACEHOLDER_CARDS: DashboardCardConfig[] = [
  { title: "Tables de marque", description: "Bientôt disponible" },
  { title: "Dérogations", description: "Bientôt disponible" },
];
