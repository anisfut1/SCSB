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
