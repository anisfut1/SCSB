import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/config/env.server";
import type { Database } from "@/types/database";

/**
 * Client Supabase "admin" — utilise la service role et bypass donc TOUTE la
 * RLS. Réservé aux futures tâches système (synchronisation FFBB, cron,
 * scripts d'administration serveur). Aucun écran de l'application ne doit
 * l'utiliser pour servir une requête utilisateur.
 *
 * L'import de `server-only` interdit tout import (même transitif) depuis un
 * Client Component : toute tentative fait échouer le build plutôt que de
 * risquer d'exposer la service role au navigateur.
 */
export function createAdminSupabaseClient() {
  return createClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
