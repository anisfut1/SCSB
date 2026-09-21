"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getClubId } from "@/lib/domain/club/club-repository";
import { getFbiCredentials, saveFbiCredentials } from "@/lib/fbi/credentials-store";
import { FbiError, FbiProvider, type FbiErrorCode } from "@/lib/fbi/provider";
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
 * Enregistre les identifiants FBI (chiffrés, voir src/lib/security/crypto.ts).
 * Utilise le client admin (service role) : la table fbi_credentials n'a
 * volontairement aucune policy RLS pour un utilisateur authentifié, voir
 * supabase/migrations/20260921090070_fbi_integration.sql.
 */
export async function saveFbiCredentialsAction(
  _prevState: FbiActionResult,
  formData: FormData,
): Promise<FbiActionResult> {
  const user = await requireSuperAdmin();

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username) {
    return { success: false, message: "L'identifiant est requis." };
  }

  const supabase = createAdminSupabaseClient();

  try {
    const clubId = await getClubId(supabase);

    if (password) {
      await saveFbiCredentials(supabase, clubId, { username, password }, user.id);
    } else {
      // Mot de passe laissé vide : on ne change que l'identifiant, à
      // condition qu'un mot de passe soit déjà enregistré.
      const existing = await getFbiCredentials(supabase, clubId);
      if (!existing) {
        return { success: false, message: "Un mot de passe est requis lors du premier enregistrement." };
      }
      await saveFbiCredentials(supabase, clubId, { username, password: existing.password }, user.id);
    }
  } catch (error) {
    logError("Enregistrement des identifiants FBI échoué", error);
    return { success: false, message: "Enregistrement impossible. Réessaie." };
  }

  revalidatePath("/admin/integrations/fbi");
  revalidatePath("/admin/integrations");
  return { success: true, message: "Identifiants FBI enregistrés." };
}

/**
 * Tente une connexion FBI réelle avec les identifiants enregistrés, sans
 * rien télécharger ni modifier côté FBI. Le résultat (jamais le mot de
 * passe) est enregistré dans fbi_integration_status pour /admin/integrations.
 */
export async function testFbiConnectionAction(): Promise<FbiActionResult> {
  await requireSuperAdmin();

  const supabase = createAdminSupabaseClient();
  const clubId = await getClubId(supabase);
  const credentials = await getFbiCredentials(supabase, clubId);

  if (!credentials) {
    return { success: false, message: "Aucun identifiant FBI enregistré pour l'instant." };
  }

  const testedAt = new Date().toISOString();
  const provider = new FbiProvider();

  try {
    await provider.login(credentials);

    await supabase.from("fbi_integration_status").upsert(
      {
        club_id: clubId,
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

    revalidatePath("/admin/integrations/fbi");
    revalidatePath("/admin/integrations");
    return { success: true, message: "FBI connecté ✅" };
  } catch (error) {
    const message = error instanceof FbiError ? messageForErrorCode(error.code) : "Connexion FBI impossible.";

    await supabase.from("fbi_integration_status").upsert(
      {
        club_id: clubId,
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

    logError("Test de connexion FBI échoué", error);
    revalidatePath("/admin/integrations/fbi");
    revalidatePath("/admin/integrations");
    return { success: false, message };
  }
}
