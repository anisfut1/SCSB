import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const EMARQUE_BUCKET = "emarque";

/**
 * Convention de chemin pour les documents e-Marque, tenant-scopée (§23 du
 * brief SaaS) : private/emarque/{clubId}/{season}/{matchId}/{fileName}.
 * `clubId` en premier segment rend une fuite cross-tenant immédiatement
 * visible dans les logs/audits Storage, et permettrait une policy Storage
 * par préfixe si on en ajoutait une un jour (aujourd'hui : bucket privé,
 * accès service role uniquement, voir la migration de création du bucket).
 */
export function emarqueStoragePath(clubId: string, season: string, matchId: string, fileName: string): string {
  return `private/emarque/${clubId}/${season}/${matchId}/${fileName}`;
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
