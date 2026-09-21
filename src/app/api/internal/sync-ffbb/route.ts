import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { FfbbPublicProvider } from "@/lib/ffbb/public-provider";
import { syncAllDueClubs } from "@/lib/domain/sync/sync-ffbb-scheduler";
import { logError } from "@/lib/logger";

/**
 * Déclenchée par Vercel Cron (voir vercel.json) toutes les
 * FFBB_SYNC_INTERVAL_MINUTES minutes. Le cron Vercel appelle cette route en
 * GET avec l'en-tête `Authorization: Bearer $CRON_SECRET` (convention
 * documentée par Vercel) — jamais accessible publiquement sans ce secret.
 *
 * Multi-tenant (§25 du brief SaaS) : cette route ne synchronise plus "le
 * club", elle traite tous les clubs actifs dus à ce moment (voir
 * sync-ffbb-scheduler.ts) — verrouillage par club, petits lots.
 */
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${serverEnv.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const result = await syncAllDueClubs(supabase, new FfbbPublicProvider());
    return NextResponse.json(result);
  } catch (error) {
    logError("Route /api/internal/sync-ffbb en erreur", error);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
