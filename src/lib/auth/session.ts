import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/permissions/roles";
import type { AppRole } from "@/types/database";

/**
 * Utilisateur actuellement connecté (Server Components / Server Actions),
 * ou `null` si aucune session valide. Ne redirige jamais — c'est au code
 * appelant de décider quoi faire d'une absence de session.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Rôles applicatifs de l'utilisateur connecté. Tableau vide si non connecté
 * ou si aucun rôle ne lui a encore été attribué.
 */
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

  if (error) {
    throw new Error(`Impossible de charger les rôles de l'utilisateur : ${error.message}`);
  }

  return data.map((row) => row.role);
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

/**
 * Variante stricte pour les pages/actions réservées au super_admin (ex:
 * /admin/integrations/fbi). Redirige vers /dashboard si l'utilisateur est
 * connecté mais n'a pas ce rôle — la policy RLS reste la barrière ultime
 * pour toute donnée sensible, ceci n'est qu'une seconde ligne de défense
 * côté serveur, pas un simple confort d'UI.
 */
export async function requireSuperAdmin(): Promise<User> {
  const user = await requireUser();
  const roles = await getCurrentUserRoles();

  if (!isSuperAdmin(roles)) {
    redirect("/dashboard");
  }

  return user;
}
