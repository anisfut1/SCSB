"use server";

import { revalidatePath } from "next/cache";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getFbiCredentials, saveFbiCredentials } from "@/lib/fbi/credentials-store";
import { FbiError, type FbiErrorCode } from "@/lib/fbi/errors";
import { HttpFbiClient } from "@/lib/fbi/http-client";
import { logError } from "@/lib/logger";

export interface FbiActionResult {
  success: boolean;
  message: string;
}

function messageForErrorCode(code: FbiErrorCode): string {
  switch (code) {
    case "LOGIN_FAILED":
      return "Connexion FBI impossible : identifiant ou mot de passe incorrect.";
    case "LOGIN_PAGE_UNREACHABLE":
      return "Connexion FBI impossible : le site FBI est injoignable pour le moment. Réessaie plus tard.";
    case "LOGIN_FORM_NOT_RECOGNIZED":
      return "Connexion FBI impossible : la page de connexion FBI a changé de structure. À signaler à l'équipe technique.";
    case "SESSION_EXPIRED":
      return "Session FBI expirée.";
    case "EMARQUE_DOWNLOAD_ENDPOINT_NOT_CONFIRMED":
      return "Connecté à FBI, mais la récupération des documents e-Marque n'est pas encore confirmée techniquement.";
    case "REQUEST_FAILED":
      return "Connexion FBI impossible : une requête a échoué.";
    default:
      return "Connexion FBI impossible.";
  }
}

/**
 * Enregistre les identifiants FBI DU CLUB `clubSlug` (chiffrés, AAD =
 * club_id — voir src/lib/security/crypto.ts). Utilise le client admin
 * (service role) : la table fbi_credentials n'a volontairement aucune
 * policy RLS pour un utilisateur authentifié, voir
 * supabase/migrations/20260921090070_fbi_integration.sql. `requireClubAdminContext`
 * vérifie que l'utilisateur est bien club_admin DE CE CLUB avant toute écriture.
 */
export async function saveFbiCredentialsAction(clubSlug: string, _prevState: FbiActionResult, formData: FormData): Promise<FbiActionResult> {
  const { club } = await requireClubAdminContext(clubSlug);
  const user = await getCurrentUser();

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username) {
    return { success: false, message: "L'identifiant est requis." };
  }

  const supabase = createAdminSupabaseClient();

  try {
    if (password) {
      await saveFbiCredentials(supabase, club.id, { username, password }, user?.id ?? null);
    } else {
      // Mot de passe laissé vide : on ne change que l'identifiant, à
      // condition qu'un mot de passe soit déjà enregistré.
      const existing = await getFbiCredentials(supabase, club.id);
      if (!existing) {
        return { success: false, message: "Un mot de passe est requis lors du premier enregistrement." };
      }
      await saveFbiCredentials(supabase, club.id, { username, password: existing.password }, user?.id ?? null);
    }
  } catch (error) {
    logError("Enregistrement des identifiants FBI échoué", error, { clubId: club.id });
    return { success: false, message: "Enregistrement impossible. Réessaie." };
  }

  revalidatePath(`/c/${clubSlug}/admin/integrations/fbi`);
  revalidatePath(`/c/${clubSlug}/admin/integrations`);
  return { success: true, message: "Identifiants FBI enregistrés." };
}

/**
 * Tente une connexion FBI réelle avec les identifiants enregistrés DU CLUB
 * `clubSlug`, sans rien télécharger ni modifier côté FBI. Le résultat
 * (jamais le mot de passe) est enregistré dans fbi_integration_status pour
 * /c/{slug}/admin/integrations.
 */
export async function testFbiConnectionAction(clubSlug: string): Promise<FbiActionResult> {
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();
  const credentials = await getFbiCredentials(supabase, club.id);

  if (!credentials) {
    return { success: false, message: "Aucun identifiant FBI enregistré pour l'instant." };
  }

  const testedAt = new Date().toISOString();
  const provider = new HttpFbiClient();

  try {
    await provider.login(credentials);

    await supabase.from("fbi_integration_status").upsert(
      {
        club_id: club.id,
        configured: true,
        last_test_at: testedAt,
        last_test_success: true,
        last_test_message: "Connexion réussie.",
        last_login_at: testedAt,
        last_login_success: true,
        updated_at: testedAt,
      },
      { onConflict: "club_id" },
    );

    revalidatePath(`/c/${clubSlug}/admin/integrations/fbi`);
    revalidatePath(`/c/${clubSlug}/admin/integrations`);
    return { success: true, message: "FBI connecté ✅" };
  } catch (error) {
    const message = error instanceof FbiError ? messageForErrorCode(error.code) : "Connexion FBI impossible.";

    await supabase.from("fbi_integration_status").upsert(
      {
        club_id: club.id,
        configured: true,
        last_test_at: testedAt,
        last_test_success: false,
        last_test_message: message,
        last_login_success: false,
        last_error: message,
        updated_at: testedAt,
      },
      { onConflict: "club_id" },
    );

    logError("Test de connexion FBI échoué", error, { clubId: club.id });
    revalidatePath(`/c/${clubSlug}/admin/integrations/fbi`);
    revalidatePath(`/c/${clubSlug}/admin/integrations`);
    return { success: false, message };
  }
}

/**
 * Active/désactive la récupération automatique e-Marque DU CLUB `clubSlug`
 * (§29 du brief FBI : un seul interrupteur, pas 50 options). Désactivée,
 * `enqueueEmarqueDiscoveryJobsForClub` ne crée plus aucun job pour ce club
 * — sans jamais toucher au calendrier FFBB.
 */
export async function setAutoImportEmarqueAction(clubSlug: string, enabled: boolean): Promise<void> {
  const { club } = await requireClubAdminContext(clubSlug);
  const supabase = createAdminSupabaseClient();

  await supabase
    .from("fbi_integration_status")
    .upsert({ club_id: club.id, configured: true, auto_import_emarque: enabled, updated_at: new Date().toISOString() }, { onConflict: "club_id" });

  revalidatePath(`/c/${clubSlug}/admin/integrations/fbi`);
  revalidatePath(`/c/${clubSlug}/admin/integrations`);
}
