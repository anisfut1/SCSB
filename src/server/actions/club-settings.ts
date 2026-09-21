"use server";

import { revalidatePath } from "next/cache";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

export interface ClubSettingsActionResult {
  success: boolean;
  message: string;
}

/**
 * Met à jour le branding léger du club (§17/§42 du brief SaaS) : nom,
 * nom court, logo, fuseau horaire. N'utilise PAS le client admin : le
 * privilège de colonne restreint sur `clubs` (voir la migration RLS)
 * empêche déjà d'écrire slug/status/ffbb_club_id depuis ce chemin, même par
 * erreur de code — la RLS + les GRANT/REVOKE sont la vraie barrière, pas
 * cette action.
 */
export async function updateClubSettingsAction(clubSlug: string, _prevState: ClubSettingsActionResult, formData: FormData): Promise<ClubSettingsActionResult> {
  await requireClubAdminContext(clubSlug);

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("short_name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!name) {
    return { success: false, message: "Le nom du club est requis." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("clubs")
    .update({ name, short_name: shortName || null, timezone: timezone || "Europe/Paris" })
    .eq("slug", clubSlug);

  if (error) {
    logError("Mise à jour des réglages du club échouée", error, { clubSlug });
    return { success: false, message: "Enregistrement impossible. Réessaie." };
  }

  revalidatePath(`/c/${clubSlug}/admin/settings`);
  revalidatePath(`/c/${clubSlug}`);
  return { success: true, message: "Réglages enregistrés." };
}
