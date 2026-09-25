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
 * Les modules Matchs et Dérogations sont réels (voir /c/{slug}/matchs et
 * /c/{slug}/admin/derogations) et ne sont plus listés ici — la carte
 * "Dérogations : Bientôt disponible" restait affichée alors que la page
 * existe déjà, un doublon relevé par le club.
 */
export const DASHBOARD_PLACEHOLDER_CARDS: DashboardCardConfig[] = [{ title: "Tables de marque", description: "Bientôt disponible" }];
