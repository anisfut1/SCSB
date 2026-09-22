import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type IntegrationStatusDto = components["schemas"]["IntegrationStatusDto"];
export type SaveFbiCredentialsDto = components["schemas"]["SaveFbiCredentialsDto"];
export type SyncRunDto = components["schemas"]["SyncRunDto"];

export interface TestFbiConnectionResult {
  success: boolean;
  message: string;
  /** Présent en 202 : job `test_connection` (navigateur) empilé en secours, voir docs/API.md §Async. */
  jobId?: string;
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

/** GET /v1/clubs/:clubId/sync-runs */
export async function listSyncRuns(fetcher: ApiFetcher, clubId: string): Promise<SyncRunDto[]> {
  const { syncRuns } = await fetcher<{ syncRuns: SyncRunDto[] }>(`/v1/clubs/${clubId}/sync-runs`);
  return syncRuns;
}
