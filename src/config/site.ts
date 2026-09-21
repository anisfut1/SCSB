/**
 * Constantes de configuration produit (pas de secret ici, ce fichier est
 * importable côté client comme côté serveur).
 */

/** Nom de la plateforme elle-même (hors contexte club, ex: /platform, chooser). Jamais un nom de club en dur — voir docs/MULTI_TENANCY.md §17. */
export const PLATFORM_NAME = "Basket Club Manager";

/**
 * Chemins accessibles sans session. Tout le reste de l'application est
 * protégé par défaut (voir `src/proxy.ts`) : plutôt qu'une liste des
 * routes protégées à maintenir à chaque nouveau module, on maintient une
 * liste courte des routes publiques.
 */
export const PUBLIC_PATHS = ["/login"];

export interface DashboardCardConfig {
  title: string;
  description: string;
}

/**
 * Cartes placeholder du dashboard club pour les modules pas encore développés.
 * Le module Matchs est réel (voir /c/{slug}/matchs) et n'est plus listé ici.
 */
export const DASHBOARD_PLACEHOLDER_CARDS: DashboardCardConfig[] = [
  { title: "Tables de marque", description: "Bientôt disponible" },
  { title: "Dérogations", description: "Bientôt disponible" },
];
