import type { Browser } from "playwright";
import type { WorkerSupabaseClient } from "../supabase-client.js";
import type { FbiJobRow } from "../db-types.js";
import type { WorkerConfig } from "../config.js";
import { getFbiCredentials } from "../credentials.js";
import { BrowserFbiClient } from "../fbi/browser-client.js";
import { classifyFbiLoginStatus, FbiError } from "../fbi/errors.js";
import { logError, logInfo } from "../logger.js";

/**
 * Traite un job `test_connection` (§31 du brief FBI) : vérifie qu'une vraie
 * connexion FBI fonctionne pour ce club, via LE MÊME `BrowserFbiClient` que
 * `discover_emarque` — jamais un test simulé. Le bouton "Tester la
 * connexion" de /c/{slug}/admin/integrations/fbi utilise aujourd'hui
 * `HttpFbiClient` directement (synchrone, plus rapide, voir
 * src/server/actions/fbi-integration.ts) ; ce chemin par job existe pour un
 * futur bouton "Tester avec le navigateur" ou comme diagnostic de secours
 * si le test HTTP échoue alors que le navigateur, lui, réussirait.
 */
export async function processTestConnectionJob(
  supabase: WorkerSupabaseClient,
  config: WorkerConfig,
  browser: Browser,
  job: FbiJobRow,
): Promise<void> {
  const credentials = await getFbiCredentials(supabase, config.fbiEncryptionKey, job.club_id);
  const testedAt = new Date().toISOString();

  if (!credentials) {
    await supabase
      .from("fbi_jobs")
      .update({ status: "failed", finished_at: testedAt, last_error: "Aucun identifiant FBI enregistré." })
      .eq("id", job.id);
    return;
  }

  const client = new BrowserFbiClient({ baseUrl: config.fbiBaseUrl, browser });

  try {
    const session = await client.login(credentials);
    await client.closeSession(session);

    await supabase.from("fbi_integration_status").upsert(
      { club_id: job.club_id, configured: true, last_test_at: testedAt, last_test_success: true, last_test_message: "Connexion réussie (navigateur).", last_login_at: testedAt, last_login_success: true, updated_at: testedAt },
      { onConflict: "club_id" },
    );
    await supabase.from("fbi_jobs").update({ status: "succeeded", finished_at: testedAt, result: { loginStatus: "CONNECTED" } }).eq("id", job.id);
    logInfo("Job test_connection réussi", { clubId: job.club_id, jobId: job.id });
  } catch (error) {
    const status = classifyFbiLoginStatus(error);
    const message = error instanceof FbiError ? error.message : "Connexion FBI impossible.";

    await supabase.from("fbi_integration_status").upsert(
      { club_id: job.club_id, configured: true, last_test_at: testedAt, last_test_success: false, last_test_message: message, last_login_success: false, last_error: message, updated_at: testedAt },
      { onConflict: "club_id" },
    );
    await supabase.from("fbi_jobs").update({ status: "failed", finished_at: testedAt, last_error: message, result: { loginStatus: status } }).eq("id", job.id);
    logError("Job test_connection en échec", error, { clubId: job.club_id, jobId: job.id, loginStatus: status });
  }
}
