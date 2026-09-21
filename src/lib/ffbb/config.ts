/**
 * Configuration de l'API publique FFBB (Directus), telle que documentée
 * dans docs/FFBB_ECOSYSTEM_RESEARCH.md §3 — confirmée par recoupement du
 * code source de 3 bibliothèques clientes open source indépendantes,
 * jamais testée en direct depuis cet environnement (réseau bloqué, voir
 * le même document, section méthodologie).
 */

export const FFBB_API_BASE_URL = "https://api.ffbb.app/";

export const FFBB_ENDPOINTS = {
  configuration: "items/configuration",
  organismes: "items/ffbbserver_organismes",
  engagements: "items/ffbbserver_engagements",
  competitions: "items/ffbbserver_competitions",
  poules: "items/ffbbserver_poules",
  rencontres: "items/ffbbserver_rencontres",
} as const;

/**
 * Le backend est protégé par un WAF/CDN qui bloque les clients qui ne
 * ressemblent pas à l'application mobile officielle (voir docs/
 * FFBB_ECOSYSTEM_RESEARCH.md §3.2). Reproduit ce qu'utilisent les
 * bibliothèques open source étudiées.
 */
export const FFBB_USER_AGENT = "okhttp/4.12.0";

/** Code FFBB du club (voir ARCHITECTURE.md). Jamais un id interne codé en dur. */
export const SC_SETE_CLUB_CODE = "OCC0034008";
