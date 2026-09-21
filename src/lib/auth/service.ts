import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

export const loginCredentialsSchema = z.object({
  email: z.string().trim().min(1, "Email requis").email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

export type AuthActionResult = { error: string | null };

/**
 * Logique de connexion, indépendante de Next.js (Server Action) et testable
 * avec un client Supabase simulé. Ne fait pas de redirection : c'est au
 * point d'entrée (Server Action) de décider de la navigation après coup.
 */
export async function signInWithPassword(
  supabase: SupabaseClient<Database>,
  credentials: LoginCredentials,
): Promise<AuthActionResult> {
  const parsed = loginCredentialsSchema.safeParse(credentials);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Identifiants invalides" };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email ou mot de passe incorrect" };
  }

  return { error: null };
}

export async function signOut(supabase: SupabaseClient<Database>): Promise<AuthActionResult> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "La déconnexion a échoué, réessaie." };
  }

  return { error: null };
}
