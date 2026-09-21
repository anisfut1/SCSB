import type { WorkerSupabaseClient } from "../supabase-client.js";
import type { FbiJobRow } from "../db-types.js";

/**
 * Réclame le prochain job éligible via `claim_next_fbi_job` (FOR UPDATE
 * SKIP LOCKED côté Postgres, voir supabase/migrations/20260921110000_fbi_jobs.sql)
 * — §11 du brief FBI : c'est CETTE fonction SQL, jamais une logique
 * applicative, qui garantit qu'aucun job n'est traité par deux workers à la
 * fois, et qu'un club n'a jamais plus d'une session FBI active
 * simultanément quel que soit le nombre de workers qui tournent.
 */
export async function claimNextJob(supabase: WorkerSupabaseClient, workerId: string): Promise<FbiJobRow | null> {
  const { data, error } = await supabase.rpc("claim_next_fbi_job", { p_worker_id: workerId });

  if (error) {
    throw new Error(`Réclamation d'un job FBI échouée : ${error.message}`);
  }

  return data ?? null;
}
