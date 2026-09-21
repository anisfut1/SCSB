"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signInWithPassword, signOut, type AuthActionResult } from "@/lib/auth/service";

/**
 * Server Actions : couche fine appelée par les formulaires. Toute la logique
 * vit dans `lib/auth/service.ts` (testable indépendamment de Next.js) ; ces
 * fonctions se contentent de brancher le client Supabase serveur et la
 * navigation.
 */
export async function signInAction(_prevState: AuthActionResult, formData: FormData): Promise<AuthActionResult> {
  const supabase = await createServerSupabaseClient();

  const result = await signInWithPassword(supabase, {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (result.error) {
    return result;
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await signOut(supabase);
  redirect("/login");
}
