import type { WorkerSupabaseClient } from "./supabase-client.js";

export const EMARQUE_BUCKET = "emarque";

/** Même convention que src/lib/storage/emarque-storage.ts (§23 du brief FBI) — ne JAMAIS diverger de ce chemin, l'app et le worker doivent pointer au même endroit. */
export function emarqueStoragePath(clubId: string, season: string, matchId: string, fileName: string): string {
  return `private/emarque/${clubId}/${season}/${matchId}/${fileName}`;
}

/** Pas de saison FFBB exposée de façon fiable sur `matches` à ce stade : dérivée de la date du match (juillet à juin, convention basket FR) — même logique que src/lib/domain/emarque/discover-emarque.ts. */
export function resolveSeasonLabel(matchDatetime: string | null): string {
  const date = matchDatetime ? new Date(matchDatetime) : new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/**
 * Dépose un fichier dans le bucket privé `emarque`. Fichier gardé en mémoire
 * (Buffer) uniquement — jamais écrit sur le disque du worker (§21 du brief
 * FBI : pas d'accumulation de PDF/ZIP, aucun répertoire temporaire utilisé
 * ici puisque Playwright nous donne déjà le contenu en mémoire, voir
 * browser-client.ts `downloadDocument`).
 */
export async function uploadEmarqueFile(supabase: WorkerSupabaseClient, path: string, content: Buffer, contentType: string): Promise<void> {
  const { error } = await supabase.storage.from(EMARQUE_BUCKET).upload(path, content, { contentType, upsert: true });
  if (error) {
    throw new Error(`Dépôt Storage échoué (${path}) : ${error.message}`);
  }
}
