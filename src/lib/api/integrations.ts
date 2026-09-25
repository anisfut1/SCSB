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

export interface ParseFbiDocumentsResult {
  candidatesExamined: number;
  imported: number;
  errors: number;
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
  // timeoutMs généreux : jusqu'à CLUB_JOB_BATCH_SIZE jobs `discover_emarque`
  // traités en série côté club-manager-api, chacun pilotant un vrai
  // Chromium serverless (~25-30s en pratique, voir docs/FBI.md côté
  // club-manager-api) — le timeout par défaut de 20s (client.ts) expirait
  // avant la fin d'un seul job.
  return fetcher<ProcessFbiJobsResult>(`/v1/clubs/${clubId}/integrations/fbi/process-jobs`, { method: "POST", timeoutMs: 280_000 });
}

/**
 * POST /v1/clubs/:clubId/integrations/fbi/parse-documents — deuxième étape,
 * séparée de `processFbiJobs` : celle-ci ne fait que TÉLÉCHARGER les
 * documents e-Marque, elle ne les transforme jamais en composition/stats/
 * officiels affichables. Sans cet appel, un document reste "Téléchargé"
 * indéfiniment (constaté en production le 2026-09-24 : 14 documents
 * téléchargés, 0 importés — le parsing ne tournait que via le cron
 * quotidien `/internal/cron/emarque-parse`, voir docs/FBI.md côté
 * club-manager-api). Pas de navigateur ici (OCR/PDF seulement) : plus
 * rapide par document que processFbiJobs, mais le timeout par défaut de
 * 20s reste trop court dès que plusieurs documents sont à traiter.
 */
export async function parseFbiDocuments(fetcher: ApiFetcher, clubId: string): Promise<ParseFbiDocumentsResult> {
  return fetcher<ParseFbiDocumentsResult>(`/v1/clubs/${clubId}/integrations/fbi/parse-documents`, { method: "POST", timeoutMs: 120_000 });
}

/**
 * POST /v1/clubs/:clubId/integrations/fbi/reconcile-schedule — rapprochement
 * calendrier FFBB/FBI (demande du club, voir docs/FBI.md côté
 * club-manager-api) : "FBI est l'info réelle. si ya une info sur fbi pour
 * la même rencontre différente de ffbb, c'est une anomalie. si un match est
 * sur fbi, et pas sur ffbb, c'est à alerter aussi." FFBB reste la SEULE
 * source du calendrier — cet appel empile un job de VÉRIFICATION (jamais un
 * remplacement), consommé ensuite par `processFbiJobs`. Les anomalies
 * détectées apparaissent sur /admin/issues (IssueDto.integration ===
 * "fbi_schedule").
 */
export async function triggerFbiScheduleReconciliation(fetcher: ApiFetcher, clubId: string): Promise<{ queued: true }> {
  return fetcher<{ queued: true }>(`/v1/clubs/${clubId}/integrations/fbi/reconcile-schedule`, { method: "POST" });
}

/**
 * POST /v1/clubs/:clubId/integrations/fbi/check-all-derogations — "je veux
 * un bouton global qui check toutes les demandes, pas match par match" :
 * empile UN SEUL job `check_all_derogations` qui parcourt toutes les
 * dérogations connues de FBI en une seule connexion (recherche à numéro de
 * rencontre VIDE), au lieu de boucler un job par match (risque de blocage
 * anti-bot déjà constaté, voir ProcessFbiJobsButton.tsx). Lecture seule
 * uniquement — jamais de soumission/modification de dérogation vers FBI.
 * Les résultats apparaissent ensuite via `derogations.list` (derogations.ts).
 */
export async function triggerCheckAllDerogations(fetcher: ApiFetcher, clubId: string): Promise<{ queued: true }> {
  return fetcher<{ queued: true }>(`/v1/clubs/${clubId}/integrations/fbi/check-all-derogations`, { method: "POST" });
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
