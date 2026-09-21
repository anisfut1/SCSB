import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { discoverEmarqueForAllClubs } from "@/lib/domain/emarque/discover-emarque";
import { logError } from "@/lib/logger";

/**
 * Déclenchée par Vercel Cron (voir vercel.json). Même convention
 * d'authentification que /api/internal/sync-ffbb (en-tête
 * `Authorization: Bearer $CRON_SECRET`).
 *
 * Multi-tenant (§28 du brief SaaS) : traite tous les clubs ayant FBI
 * configuré, un par un, avec verrou (voir discover-emarque.ts).
 *
 * Le pipeline OCR (rendu de page + reconnaissance) peut être lent sur
 * plusieurs matchs de plusieurs clubs : durée maximale alignée sur la
 * limite la plus haute disponible côté Vercel plutôt que sur le défaut de 10s.
 */
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${serverEnv.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const result = await discoverEmarqueForAllClubs(supabase);
    return NextResponse.json(result);
  } catch (error) {
    logError("Route /api/internal/discover-emarque en erreur", error);
    return NextResponse.json({ error: "discovery_failed" }, { status: 500 });
  }
}
