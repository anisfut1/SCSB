import "server-only";
import { NextResponse } from "next/server";
import { serverEnv } from "@/config/env.server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { parseDownloadedEmarqueDocuments } from "@/lib/domain/emarque/parse-downloaded-documents";
import { logError } from "@/lib/logger";

/**
 * Déclenchée par Vercel Cron (voir vercel.json). Étape PARSING du pipeline
 * e-Marque : consomme les documents déposés par le worker FBI
 * (match_documents.status = 'downloaded'), tous clubs confondus — ne fait
 * AUCUN accès réseau FBI, donc jamais besoin de Playwright ni de session par
 * club ici (voir src/lib/domain/emarque/parse-downloaded-documents.ts).
 *
 * Le pipeline OCR (rendu de page + reconnaissance) peut être lent sur
 * plusieurs documents de plusieurs clubs : durée maximale alignée sur la
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
    const result = await parseDownloadedEmarqueDocuments(supabase);
    return NextResponse.json(result);
  } catch (error) {
    logError("Route /api/internal/parse-emarque en erreur", error);
    return NextResponse.json({ error: "parse_failed" }, { status: 500 });
  }
}
