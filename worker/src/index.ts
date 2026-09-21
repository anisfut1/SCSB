import { chromium } from "playwright";
import { loadWorkerConfig } from "./config.js";
import { createWorkerSupabaseClient } from "./supabase-client.js";
import { claimNextJob } from "./jobs/claim.js";
import { processTestConnectionJob } from "./jobs/process-test-connection.js";
import { processDiscoverEmarqueJob } from "./jobs/process-discover-emarque.js";
import { startHealthServer } from "./health.js";
import { logError, logInfo } from "./logger.js";

/**
 * Point d'entrée du worker (§9/§12 du brief FBI) : `concurrency` boucles de
 * réclamation tournent EN PARALLÈLE dans CE processus (voir config.ts,
 * défaut 2 — "commencer bas"), chacune traitant un job à la fois avant de
 * réclamer le suivant. Aucune de ces boucles ne peut jamais traiter le même
 * club qu'une autre : `claim_next_fbi_job` (SQL, FOR UPDATE SKIP LOCKED)
 * exclut déjà les clubs ayant un job claimed/running, quel que soit le
 * nombre de workers OU de boucles internes à un même worker.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runClaimLoop(
  loopId: number,
  config: ReturnType<typeof loadWorkerConfig>,
  supabase: ReturnType<typeof createWorkerSupabaseClient>,
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  shouldStop: () => boolean,
): Promise<void> {
  while (!shouldStop()) {
    const job = await claimNextJob(supabase, `${config.workerId}#${loopId}`);

    if (!job) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    logInfo("Job réclamé", { loopId, jobId: job.id, clubId: job.club_id, type: job.type });

    try {
      if (job.type === "test_connection") {
        await processTestConnectionJob(supabase, config, browser, job);
      } else {
        await processDiscoverEmarqueJob(supabase, config, browser, job);
      }
    } catch (error) {
      // Filet de sécurité : un bug dans un handler de job ne doit jamais
      // arrêter la boucle ni faire planter le worker entier (§44 du brief
      // FBI : une panne FBI reste scopée, jamais toute la plateforme).
      logError("Erreur non gérée en traitant un job FBI", error, { loopId, jobId: job.id, clubId: job.club_id });
      await supabase.from("fbi_jobs").update({ status: "failed", finished_at: new Date().toISOString(), last_error: "Erreur interne du worker." }).eq("id", job.id);
    }
  }
}

async function main(): Promise<void> {
  const config = loadWorkerConfig();
  const supabase = createWorkerSupabaseClient(config);
  const browser = await chromium.launch({ headless: true });
  const stopHealthServer = startHealthServer(supabase, config.healthPort);

  logInfo("Worker FBI démarré", { workerId: config.workerId, concurrency: config.concurrency, healthPort: config.healthPort });

  let stopping = false;
  const shouldStop = () => stopping;

  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    logInfo("Arrêt du worker demandé, fin des jobs en cours...", {});
    await stopHealthServer();
    await browser.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  const loops = Array.from({ length: config.concurrency }, (_, i) => runClaimLoop(i, config, supabase, browser, shouldStop));
  await Promise.all(loops);
}

main().catch((error) => {
  logError("Le worker FBI s'est arrêté sur une erreur fatale", error);
  process.exit(1);
});
