import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { enqueueEmarqueDiscoveryJobsForAllClubs } from "@/lib/domain/emarque/discover-emarque";
import { logError } from "@/lib/logger";

/**
 * Déclenchée par Vercel Cron (voir vercel.json). Même convention
 * d'authentification que /api/internal/sync-ffbb (en-tête
 * `Authorization: Bearer $CRON_SECRET`).
 *
 * Empile des jobs `fbi_jobs` (type discover_emarque) pour tous les clubs
 * actifs ayant FBI configuré et la récupération automatique activée — c'est
 * TOUT ce que fait cette route désormais (§9/§11 du brief FBI : Playwright
 * ne peut pas tourner dans une Vercel Function, donc le login/téléchargement
 * FBI se fait dans le worker séparé, voir worker/README.md, qui consomme
 * cette file via `claim_next_fbi_job`). Rapide et léger, la durée par
 * défaut de la route suffit.
 */
function isAuthorized(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${serverEnv.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const result = await enqueueEmarqueDiscoveryJobsForAllClubs(supabase);
    return NextResponse.json(result);
  } catch (error) {
    logError("Route /api/internal/discover-emarque en erreur", error);
    return NextResponse.json({ error: "discovery_failed" }, { status: 500 });
  }
}
