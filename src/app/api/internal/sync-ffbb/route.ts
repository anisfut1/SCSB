import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { FfbbPublicProvider } from "@/lib/ffbb/public-provider";
import { SC_SETE_CLUB_CODE } from "@/lib/ffbb/config";
import { syncFfbb } from "@/lib/domain/sync/sync-ffbb";
import { logError } from "@/lib/logger";

/**
 * Déclenchée par Vercel Cron (voir vercel.json) toutes les
 * FFBB_SYNC_INTERVAL_MINUTES minutes. Le cron Vercel appelle cette route en
 * GET avec l'en-tête `Authorization: Bearer $CRON_SECRET` (convention
 * documentée par Vercel) — jamais accessible publiquement sans ce secret.
 *
 * Un job plus long que la limite par défaut d'une fonction Vercel est
 * attendu ici (parcours de tous les matchs du club) : voir ARCHITECTURE.md
 * §8 ("ne pars pas du principe que tout doit tourner en 10 secondes").
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
    const result = await syncFfbb(supabase, new FfbbPublicProvider(), SC_SETE_CLUB_CODE);
    return NextResponse.json(result);
  } catch (error) {
    logError("Route /api/internal/sync-ffbb en erreur", error);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
