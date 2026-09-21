import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "./session";

/**
 * platform_admin : opérateur de la plateforme SaaS, jamais un rôle de club
 * (voir docs/MULTI_TENANCY.md). Aucune voie de self-service pour devenir
 * platform_admin — la table `platform_admins` n'a aucune policy RLS
 * d'écriture pour `authenticated` (voir la migration correspondante).
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

/** Variante stricte pour les routes /platform/* : redirige si l'utilisateur n'est pas platform_admin. */
export async function requirePlatformAdmin(): Promise<User> {
  const user = await requireUser();

  if (!(await isPlatformAdmin(user.id))) {
    redirect("/");
  }

  return user;
}
