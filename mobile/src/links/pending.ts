/**
 * Destination d'origine en attente pendant la connexion (§13) : un parent qui
 * ouvre une convocation sans être connecté y arrive APRÈS la connexion, pas sur
 * l'accueil. En mémoire seulement (jamais un lien personnel ici).
 */
let pending: { clubSlug: string; path: string } | null = null;

export function setPendingDestination(value: { clubSlug: string; path: string } | null): void {
  pending = value;
}

/** Destination pour CE club (consommée une seule fois). */
export function takePendingDestination(clubSlug: string): string | null {
  if (!pending || pending.clubSlug !== clubSlug) return null;
  const path = pending.path;
  pending = null;
  return path;
}

export function peekPendingDestination(): { clubSlug: string; path: string } | null {
  return pending;
}
