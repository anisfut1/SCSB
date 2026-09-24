import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type IntegrationStatusDto = components["schemas"]["IntegrationStatusDto"];
export type SaveFbiCredentialsDto = components["schemas"]["SaveFbiCredentialsDto"];
export type SyncRunDto = components["schemas"]["SyncRunDto"];

export interface TestFbiConnectionResult {
  success: boolean;
  message: string;
  /**
   * Toujours absent depuis le 2026-09-24 (voir docs/FBI.md côté
   * club-manager-api) : `POST .../fbi/test` répond désormais de façon
   * synchrone (le repli navigateur tourne dans la même requête, jamais un
   * job 202 empilé). Champ conservé optionnel pour ne pas casser un appelant
   * qui le lirait encore.
   */
  jobId?: string;
}

export interface ProcessFbiJobsResult {
  claimed: number;
  succeeded: number;
  failed: number;
}

/** GET /v1/clubs/:clubId/integrations — §19 de la demande. */
export async function getIntegrationStatus(fetcher: ApiFetcher, clubId: string): Promise<IntegrationStatusDto> {
  return fetcher<IntegrationStatusDto>(`/v1/clubs/${clubId}/integrations`);
}

/** POST /v1/clubs/:clubId/integrations/fbi — §20 de la demande : jamais stocké/loggé côté frontend, vider le mot de passe du formulaire après succès. */
export async function saveFbiCredentials(fetcher: ApiFetcher, clubId: string, body: SaveFbiCredentialsDto): Promise<{ saved: boolean }> {
  return fetcher<{ saved: boolean }>(`/v1/clubs/${clubId}/integrations/fbi`, { method: "POST", body });
}

/** POST /v1/clubs/:clubId/integrations/fbi/test — §21 de la demande : peut renvoyer 202 + jobId, voir jobs.ts. */
export async function testFbiConnection(fetcher: ApiFetcher, clubId: string): Promise<TestFbiConnectionResult> {
  return fetcher<TestFbiConnectionResult>(`/v1/clubs/${clubId}/integrations/fbi/test`, { method: "POST" });
}

/** POST /v1/clubs/:clubId/integrations/ffbb/sync — §22 de la demande : outil de diagnostic admin, le cron backend fait déjà tourner ce même service. */
export async function triggerFfbbSync(fetcher: ApiFetcher, clubId: string): Promise<{ syncRunId: string; status: string; stats: unknown }> {
  return fetcher(`/v1/clubs/${clubId}/integrations/ffbb/sync`, { method: "POST" });
}

/**
 * POST /v1/clubs/:clubId/integrations/fbi/process-jobs — traite un lot des
 * jobs FBI en attente (`discover_emarque`/`test_connection`) DE CE CLUB,
 * DANS LA REQUÊTE, sans dépendre de `/internal/cron/fbi-jobs` (une fois par
 * jour seulement, voir docs/FBI.md côté club-manager-api) ni du déclenchement
 * manuel du dashboard Vercel — c'est exactement ce que "FBI connecté" ne
 * faisait pas tout seul (le login réussi ne récupère aucun document e-Marque
 * de lui-même).
 */
export async function processFbiJobs(fetcher: ApiFetcher, clubId: string): Promise<ProcessFbiJobsResult> {
  return fetcher<ProcessFbiJobsResult>(`/v1/clubs/${clubId}/integrations/fbi/process-jobs`, { method: "POST" });
}

/**
 * GET /v1/clubs/:clubId/integrations/sync-runs — la route vit sous
 * `integrationsRouter`, monté à `/v1/clubs/:clubId/integrations` côté
 * club-manager-api (voir `api/v1/index.ts`) : l'URL manquait `/integrations`
 * ici, causant un 404 "Route introuvable" à chaque chargement de
 * /admin/sync (constaté en production, voir docs/FFBB.md côté
 * club-manager-api).
 */
export async function listSyncRuns(fetcher: ApiFetcher, clubId: string): Promise<SyncRunDto[]> {
  const { syncRuns } = await fetcher<{ syncRuns: SyncRunDto[] }>(`/v1/clubs/${clubId}/integrations/sync-runs`);
  return syncRuns;
}
