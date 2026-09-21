import { createClient } from "@supabase/supabase-js";
import type { WorkerDatabase } from "./db-types.js";
import type { WorkerConfig } from "./config.js";

/**
 * Client Supabase du worker — service role uniquement, jamais de session
 * utilisateur (le worker n'est pas une app avec des utilisateurs, voir
 * §49 du brief FBI : pas d'API publique, il ne fait que lire/écrire la DB
 * avec ce client).
 */
export function createWorkerSupabaseClient(config: WorkerConfig) {
  return createClient<WorkerDatabase>(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type WorkerSupabaseClient = ReturnType<typeof createWorkerSupabaseClient>;
