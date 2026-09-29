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
/**
 * `/public` (retour du club, 2026-09-29) : accès sans compte aux Tables de
 * marque, voir club-manager-api/docs/PUBLIC_TABLE_ACCESS.md — l'identité
 * vient d'un jeton personnel, jamais d'une session Supabase.
 */
export const PUBLIC_PATHS = ["/login", "/public"];

export interface DashboardCardConfig {
  title: string;
  description: string;
}

/**
 * Cartes placeholder du dashboard club pour les modules pas encore développés.
 * Les modules Matchs, Dérogations et Tables de marque sont réels (voir
 * /c/{slug}/matchs, /c/{slug}/admin/derogations, /c/{slug}/tables) et ne
 * sont plus listés ici — une carte "Bientôt disponible" restait affichée
 * alors que la page existe déjà, un doublon relevé par le club.
 */
export const DASHBOARD_PLACEHOLDER_CARDS: DashboardCardConfig[] = [];
