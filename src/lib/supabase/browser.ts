import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/config/env.public";
import type { Database } from "@/types/database";

/**
 * Client Supabase pour les Client Components ("use client").
 * N'utilise jamais la service role — uniquement la clé anonyme, soumise aux
 * politiques RLS de l'utilisateur connecté.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
