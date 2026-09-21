import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Le club est unique dans cette application (voir ARCHITECTURE.md) : ce
 * helper évite de répéter la même requête partout où l'id interne du club
 * est nécessaire (sync FFBB, identifiants FBI...).
 */
export async function getClubId(supabase: SupabaseClient<Database>): Promise<string> {
  const { data, error } = await supabase.from("club").select("id").limit(1).single();

  if (error || !data) {
    throw new Error(`Club introuvable en base : ${error?.message ?? "aucune ligne"}`);
  }

  return data.id;
}
