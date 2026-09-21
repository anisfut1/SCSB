import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const EMARQUE_BUCKET = "emarque";

/**
 * Convention de chemin pour les documents e-Marque (voir ARCHITECTURE.md
 * §12) : private/emarque/{season}/{matchId}/{fileName}.
 */
export function emarqueStoragePath(season: string, matchId: string, fileName: string): string {
  return `private/emarque/${season}/${matchId}/${fileName}`;
}

/**
 * Dépose un fichier dans le bucket privé `emarque`. Utilise uniquement le
 * client admin (service role) : aucune policy RLS n'accorde d'accès à ce
 * bucket depuis le navigateur (voir la migration de création du bucket).
 */
export async function uploadEmarqueFile(path: string, content: Buffer, contentType: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.storage.from(EMARQUE_BUCKET).upload(path, content, { contentType, upsert: true });

  if (error) {
    throw new Error(`Dépôt Storage échoué (${path}) : ${error.message}`);
  }
}

export async function downloadEmarqueFile(path: string): Promise<Buffer> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage.from(EMARQUE_BUCKET).download(path);

  if (error || !data) {
    throw new Error(`Téléchargement Storage échoué (${path}) : ${error?.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}
