import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Utilisateur actuellement connecté (Server Components / Server Actions),
 * ou `null` si aucune session valide. Ne redirige jamais — c'est au code
 * appelant de décider quoi faire d'une absence de session.
 *
 * Les rôles applicatifs sont désormais scopés par club (voir
 * src/lib/tenancy/club-context.ts) : ce module ne gère plus que
 * l'authentification globale (compte Supabase Auth), pas les permissions.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Variante stricte de `getCurrentUser` : redirige vers /login si aucune
 * session valide. Destinée aux layouts/pages protégés. Le proxy protège déjà
 * ces routes en amont (voir src/proxy.ts) ; cet appel est la seconde
 * barrière côté serveur, pas un simple confort d'UI.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
