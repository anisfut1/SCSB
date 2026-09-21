"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { FfbbPublicProvider } from "@/lib/ffbb/public-provider";
import { SC_SETE_CLUB_CODE } from "@/lib/ffbb/config";
import { syncFfbb } from "@/lib/domain/sync/sync-ffbb";
import { logError } from "@/lib/logger";

/**
 * Déclenchement manuel depuis /admin/integrations ("Relancer maintenant").
 * C'est un outil de diagnostic admin, pas une étape requise du
 * fonctionnement normal (voir ARCHITECTURE.md §28) : le même service tourne
 * automatiquement via /api/internal/sync-ffbb (cron).
 */
export async function triggerFfbbSyncAction(): Promise<void> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminSupabaseClient();
    await syncFfbb(supabase, new FfbbPublicProvider(), SC_SETE_CLUB_CODE);
  } catch (error) {
    logError("Synchronisation FFBB manuelle échouée", error);
  }

  revalidatePath("/admin/integrations");
  revalidatePath("/admin/sync");
}
