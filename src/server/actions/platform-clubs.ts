"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/platform";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export interface CreateClubActionResult {
  success: boolean;
  message: string;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Crée un nouveau club (tenant) et, si un email est fourni, son premier
 * club_admin — sans aucune opération SQL manuelle (§30/§31 du brief SaaS).
 * Réservé au platform_admin (`requirePlatformAdmin`) : jamais un admin de
 * club, jamais du self-service.
 */
export async function createClubAction(_prevState: CreateClubActionResult, formData: FormData): Promise<CreateClubActionResult> {
  await requirePlatformAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const ffbbClubId = String(formData.get("ffbb_club_id") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Europe/Paris").trim() || "Europe/Paris";
  const adminEmail = String(formData.get("admin_email") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();

  if (!name || !ffbbClubId) {
    return { success: false, message: "Le nom et le code FFBB sont requis." };
  }

  const slug = slugify(requestedSlug || name);
  if (!slug) {
    return { success: false, message: "Impossible de générer un slug à partir de ce nom." };
  }

  const supabase = createAdminSupabaseClient();

  const { data: existingSlug } = await supabase.from("clubs").select("id").eq("slug", slug).maybeSingle();
  if (existingSlug) {
    return { success: false, message: `Le slug "${slug}" est déjà utilisé par un autre club.` };
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({ name, slug, ffbb_club_id: ffbbClubId, timezone })
    .select("id")
    .single();

  if (clubError || !club) {
    logError("Création de club échouée", clubError, { slug });
    return { success: false, message: "Création du club impossible (code FFBB déjà utilisé ?)." };
  }

  if (adminEmail) {
    try {
      await inviteFirstClubAdmin(supabase, club.id, adminEmail);
    } catch (error) {
      logError("Invitation du premier admin de club échouée", error, { clubId: club.id, adminEmail });
      revalidatePath("/platform/clubs");
      return { success: true, message: `Club "${name}" créé, mais l'invitation de l'admin a échoué (à refaire manuellement).` };
    }
  }

  revalidatePath("/platform/clubs");
  return { success: true, message: `Club "${name}" créé (/c/${slug}).` };
}

/**
 * Rattache un premier club_admin à un club fraîchement créé (§31 du brief
 * SaaS) : réutilise le compte Supabase Auth existant s'il y en a un pour cet
 * email, sinon envoie une invitation Supabase (qui crée le compte en
 * attente d'activation). Jamais une étape manuelle en base.
 */
async function inviteFirstClubAdmin(supabase: ReturnType<typeof createAdminSupabaseClient>, clubId: string, email: string): Promise<void> {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw new Error(`Recherche de l'utilisateur échouée : ${listError.message}`);

  let userId = existingUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;

  if (!userId) {
    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
    if (inviteError || !invited.user) {
      throw new Error(`Invitation échouée : ${inviteError?.message ?? "aucun utilisateur retourné"}`);
    }
    userId = invited.user.id;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("club_memberships")
    .upsert({ club_id: clubId, user_id: userId }, { onConflict: "club_id,user_id" })
    .select("id")
    .single();

  if (membershipError || !membership) {
    throw new Error(`Création du membership échouée : ${membershipError?.message}`);
  }

  // onConflict cible la contrainte UNIQUE(membership_id, role, scope_key) —
  // scope_key est une colonne générée (voir la migration club_memberships) ;
  // l'omettre du payload est normal, Postgres la calcule lui-même.
  const { error: roleError } = await supabase
    .from("membership_roles")
    .upsert({ membership_id: membership.id, role: "club_admin" }, { onConflict: "membership_id,role,scope_key" });

  if (roleError) {
    throw new Error(`Attribution du rôle club_admin échouée : ${roleError.message}`);
  }
}
