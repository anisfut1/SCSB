/**
 * Persistance du jeton personnel sans compte (retour du club, 2026-09-29)
 * côté navigateur — jamais un cookie/session Supabase, ce lien n'authentifie
 * QUE "je suis ce licencié précis de ce club" (voir
 * club-manager-api/docs/PUBLIC_TABLE_ACCESS.md). `localStorage` peut être
 * indisponible (navigation privée, storage bloqué) : chaque accès est
 * protégé par try/catch, le lien complet (`?token=`) reste alors la seule
 * façon de revenir, ce qui est acceptable (c'est déjà le cas pour tout le
 * monde à la toute première visite).
 */

function storageKey(clubSlug: string): string {
  return `scsb:public-token:${clubSlug}`;
}

export function getStoredPublicToken(clubSlug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(clubSlug));
  } catch {
    return null;
  }
}

export function setStoredPublicToken(clubSlug: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(clubSlug), token);
  } catch {
    // Rien à faire : le lien complet reste utilisable à chaque visite.
  }
}

export function clearStoredPublicToken(clubSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(clubSlug));
  } catch {
    // Rien à faire.
  }
}

/**
 * Lecture du jeton dans l'URL du lien d'e-mail. Fonctions pures sur une chaîne
 * (testables sans DOM). R-014 : le jeton passe en FRAGMENT (`#token=`, jamais
 * envoyé au serveur ni journalisé par la plateforme) ; `?token=` reste accepté
 * (liens déjà envoyés). Le fragment est prioritaire s'il y a les deux.
 */
export function tokenFromHref(href: string): string | null {
  const url = new URL(href);
  const fromFragment = new URLSearchParams(url.hash.slice(1)).get("token");
  return fromFragment || url.searchParams.get("token") || null;
}

/** Chemin + query + hash sans le jeton (query ET fragment), ou `null` s'il n'y en a aucun. */
export function hrefWithoutToken(href: string): string | null {
  const url = new URL(href);
  const hadQuery = url.searchParams.has("token");
  const fragment = new URLSearchParams(url.hash.slice(1));
  const hadFragment = fragment.has("token");
  if (!hadQuery && !hadFragment) return null;

  url.searchParams.delete("token");
  let hash = url.hash;
  if (hadFragment) {
    fragment.delete("token");
    const rest = fragment.toString();
    hash = rest ? `#${rest}` : "";
  }
  return `${url.pathname}${url.search}${hash}`;
}

// Jeton déjà lu dans l'URL pendant ce chargement de page : l'URL est nettoyée dès
// la première lecture, donc une seconde exécution de l'effet (StrictMode en dev)
// ne le retrouverait plus.
let consumedUrlToken: string | null = null;

/**
 * Lit le jeton du lien (fragment, puis query) et RETIRE AUSSITÔT l'URL
 * (`history.replaceState`) : ni historique, ni `Referer`, ni capture d'écran,
 * ni rapport CSP ne le gardent, même si la validation échoue ensuite.
 */
export function consumePublicTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const href = window.location.href;
  const token = tokenFromHref(href);
  const clean = hrefWithoutToken(href);
  if (clean !== null) {
    try {
      window.history.replaceState(window.history.state, "", clean);
    } catch {
      // Rien à faire : l'URL reste telle quelle.
    }
  }
  if (token) consumedUrlToken = token;
  return token ?? consumedUrlToken;
}

/** Oublie le jeton mémorisé pour cette page (appelé avec `forget`). */
export function resetConsumedPublicToken(): void {
  consumedUrlToken = null;
}
