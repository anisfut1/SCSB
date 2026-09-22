import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type JobStatusDto = components["schemas"]["JobStatusDto"];

/** GET /v1/jobs/:jobId — §21/§36 de la demande : suivi d'une opération asynchrone (202 + jobId). */
export async function getJob(fetcher: ApiFetcher, jobId: string): Promise<JobStatusDto> {
  return fetcher<JobStatusDto>(`/v1/jobs/${jobId}`);
}

const TERMINAL_JOB_STATUSES: ReadonlySet<JobStatusDto["status"]> = new Set(["succeeded", "failed"]);

export interface PollJobOptions {
  /** Intervalle entre deux vérifications, en ms (défaut 1500). */
  intervalMs?: number;
  /** Nombre maximum de vérifications avant abandon — §21 de la demande : jamais un polling infini (défaut 40, ~1 minute). */
  maxAttempts?: number;
}

/**
 * Interroge `GET /v1/jobs/:jobId` jusqu'à un statut terminal
 * (`succeeded`/`failed`) ou expiration du nombre d'essais — jamais
 * indéfiniment. Utilisé par le suivi UI "Test de connexion en cours…"
 * (§21 de la demande).
 */
export async function pollJobUntilTerminal(fetcher: ApiFetcher, jobId: string, options: PollJobOptions = {}): Promise<JobStatusDto> {
  const intervalMs = options.intervalMs ?? 1500;
  const maxAttempts = options.maxAttempts ?? 40;

  let lastStatus: JobStatusDto | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastStatus = await getJob(fetcher, jobId);
    if (TERMINAL_JOB_STATUSES.has(lastStatus.status)) {
      return lastStatus;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Expiration UX raisonnable (§21) : on renvoie le dernier statut connu
  // (probablement "pending"/"claimed"/"running") plutôt que de bloquer
  // indéfiniment — l'appelant affiche alors "toujours en cours".
  return lastStatus!;
}
