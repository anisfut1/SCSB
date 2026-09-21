"use server";

import { revalidatePath } from "next/cache";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

/**
 * Marque un match comme vérifié manuellement depuis /c/{slug}/admin/issues :
 * l'admin a regardé les avertissements qualité et confirme que les données
 * sont exploitables telles quelles. Ne modifie AUCUNE donnée extraite
 * (joueurs, scores...) — uniquement le statut de revue (ARCHITECTURE.md §21).
 *
 * Sécurité multi-tenant (§53 du brief SaaS) : `matchId` vient du client
 * (payload de formulaire), donc jamais fait confiance seul — on vérifie
 * explicitement que CE match appartient bien au club de l'admin avant toute
 * écriture, même si cette action utilise le client admin (service role, qui
 * bypass la RLS). Un match_id d'un AUTRE club est silencieusement refusé.
 */
export async function resolveMatchIssueAction(clubSlug: string, matchId: string): Promise<void> {
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();
  const { data: updated, error } = await supabase
    .from("matches")
    .update({ emarque_status: "imported" })
    .eq("id", matchId)
    .eq("club_id", club.id)
    .select("id");

  if (error) {
    logError("Résolution manuelle d'une anomalie e-Marque échouée", error, { clubId: club.id, matchId });
  } else if (!updated || updated.length === 0) {
    logError("Résolution manuelle refusée : le match ne correspond pas à ce club", undefined, { clubId: club.id, matchId });
  }

  revalidatePath(`/c/${clubSlug}/admin/issues`);
  revalidatePath(`/c/${clubSlug}/admin/sync`);
}
