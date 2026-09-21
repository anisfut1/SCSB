"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

/**
 * Marque un match comme vérifié manuellement depuis /admin/issues : l'admin
 * a regardé les avertissements qualité et confirme que les données sont
 * exploitables telles quelles. Ne modifie AUCUNE donnée extraite (joueurs,
 * scores...) — uniquement le statut de revue (ARCHITECTURE.md §21).
 */
export async function resolveMatchIssueAction(matchId: string): Promise<void> {
  await requireSuperAdmin();

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("matches").update({ emarque_status: "imported" }).eq("id", matchId);

  if (error) {
    logError("Résolution manuelle d'une anomalie e-Marque échouée", error, { matchId });
  }

  revalidatePath("/admin/issues");
  revalidatePath("/admin/sync");
}
