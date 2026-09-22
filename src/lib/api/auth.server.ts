import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Jeton d'accès Supabase pour un appel club-manager-api depuis un Server
 * Component / Server Action (§8 de la demande). `getUser()` revalide
 * explicitement la session avant de lire le jeton — ne jamais faire
 * confiance à un cookie de session non revalidé (recommandation Supabase
 * SSR), même si club-manager-api revalide lui-même le JWT côté serveur.
 */
export async function getServerAccessToken(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}
