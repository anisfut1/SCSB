"use server";

import { revalidatePath } from "next/cache";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { FfbbPublicProvider } from "@/lib/ffbb/public-provider";
import { syncFfbb } from "@/lib/domain/sync/sync-ffbb";
import { logError } from "@/lib/logger";

/**
 * Déclenchement manuel depuis /c/{slug}/admin/integrations ("Relancer
 * maintenant"). Outil de diagnostic admin réservé au club_admin DE CE CLUB,
 * pas une étape requise du fonctionnement normal (voir ARCHITECTURE.md
 * §28) : le même service tourne automatiquement via /api/internal/sync-ffbb
 * (cron multi-club).
 */
export async function triggerFfbbSyncAction(clubSlug: string): Promise<void> {
  const { club } = await requireClubAdminContext(clubSlug);

  try {
    const supabase = createAdminSupabaseClient();
    await syncFfbb(supabase, new FfbbPublicProvider(), { id: club.id, ffbbClubId: club.ffbbClubId });
  } catch (error) {
    logError("Synchronisation FFBB manuelle échouée", error, { clubId: club.id });
  }

  revalidatePath(`/c/${clubSlug}/admin/integrations`);
  revalidatePath(`/c/${clubSlug}/admin/sync`);
}
