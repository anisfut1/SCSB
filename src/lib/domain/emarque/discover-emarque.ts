import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getFbiCredentials } from "@/lib/fbi/credentials-store";
import { FbiError, FbiProvider, type FbiSession } from "@/lib/fbi/provider";
import { emarqueStoragePath, uploadEmarqueFile } from "@/lib/storage/emarque-storage";
import { parseEmarqueZip, PARSER_VERSION } from "@/server/emarque/parser/parse-emarque-zip";
import { persistEmarqueMatchData } from "@/server/emarque/persist/persist-emarque-match";
import { logError, logInfo } from "@/lib/logger";

type Client = SupabaseClient<Database>;

/** Calendrier de retry (ARCHITECTURE.md §20) : 30min / 2h / 6h / 24h, puis répétition quotidienne. */
const BACKOFF_SCHEDULE_SECONDS = [30 * 60, 2 * 60 * 60, 6 * 60 * 60, 24 * 60 * 60];

function nextBackoffDelaySeconds(previousAttemptCount: number): number {
  const index = Math.min(previousAttemptCount, BACKOFF_SCHEDULE_SECONDS.length - 1);
  return BACKOFF_SCHEDULE_SECONDS[index]!;
}

/** Pas de saison FFBB exposée de façon fiable à ce stade sur `matches` : dérivée de la date du match (juillet à juin, convention basket FR). */
function resolveSeasonLabel(matchDatetime: string | null): string {
  const date = matchDatetime ? new Date(matchDatetime) : new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export interface DiscoverEmarqueResult {
  candidatesExamined: number;
  imported: number;
  stillWaiting: number;
  errors: number;
  skippedNoCredentials: boolean;
  skippedLoginFailed: boolean;
}

async function scheduleNextAttempt(supabase: Client, matchId: string, previousAttemptCount: number): Promise<void> {
  const delaySeconds = nextBackoffDelaySeconds(previousAttemptCount);
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  const { error } = await supabase
    .from("matches")
    .update({
      emarque_status: "waiting_for_emarque",
      emarque_discovery_attempt_count: previousAttemptCount + 1,
      emarque_next_discovery_attempt_at: nextAttemptAt,
    })
    .eq("id", matchId);

  if (error) {
    logError("Planification de la prochaine tentative de découverte e-Marque échouée", error, { matchId });
  }
}

/**
 * Job de découverte e-Marque POUR UN CLUB (§22/§23/§28 du brief SaaS) :
 * pour chaque match joué en attente DE CE CLUB, tente de trouver puis
 * d'importer le document e-Marque via LA session FBI de ce club (jamais
 * partagée avec un autre tenant), avec retry/backoff.
 *
 * Statut : PREPARED — `FbiProvider.findEmarqueDocuments` n'a pas d'endpoint
 * confirmé (voir docs/FBI_AUTHENTICATED_SPIKE.md), indépendamment du
 * multi-tenant : ce job se comporte donc comme une boucle de retry qui
 * échoue proprement (`waiting_for_emarque` + diagnostic
 * `EMARQUE_DOWNLOAD_ENDPOINT_NOT_CONFIRMED`) jusqu'à ce que l'endpoint réel
 * soit confirmé et implémenté dans FbiProvider.
 */
export async function discoverEmarqueForClub(supabase: Client, clubId: string): Promise<DiscoverEmarqueResult> {
  const result: DiscoverEmarqueResult = {
    candidatesExamined: 0,
    imported: 0,
    stillWaiting: 0,
    errors: 0,
    skippedNoCredentials: false,
    skippedLoginFailed: false,
  };

  const now = new Date().toISOString();

  const { data: candidates, error: candidatesError } = await supabase
    .from("matches")
    .select("id, numero, match_datetime, score_home, score_away, emarque_discovery_attempt_count")
    .eq("club_id", clubId)
    .eq("status", "played")
    .in("emarque_status", ["pending", "waiting_for_emarque"])
    .or(`emarque_next_discovery_attempt_at.is.null,emarque_next_discovery_attempt_at.lte.${now}`);

  if (candidatesError) {
    throw new Error(`Recherche des matchs candidats à la découverte e-Marque échouée : ${candidatesError.message}`);
  }

  if (!candidates || candidates.length === 0) {
    logInfo("Découverte e-Marque : aucun match candidat", { clubId });
    return result;
  }

  result.candidatesExamined = candidates.length;

  const credentials = await getFbiCredentials(supabase, clubId);
  if (!credentials) {
    result.skippedNoCredentials = true;
    logInfo("Découverte e-Marque ignorée : aucun identifiant FBI enregistré", { clubId });
    return result;
  }

  const provider = new FbiProvider();
  let session: FbiSession;
  const loginTimestamp = new Date().toISOString();

  try {
    session = await provider.login(credentials);
    await supabase
      .from("fbi_integration_status")
      .upsert(
        { club_id: clubId, configured: true, last_login_at: loginTimestamp, last_login_success: true, updated_at: loginTimestamp },
        { onConflict: "club_id" },
      );
  } catch (error) {
    result.skippedLoginFailed = true;
    const message = error instanceof FbiError ? error.message : "Connexion FBI impossible.";

    await supabase.from("fbi_integration_status").upsert(
      {
        club_id: clubId,
        configured: true,
        last_login_at: loginTimestamp,
        last_login_success: false,
        last_job_at: loginTimestamp,
        last_job_status: "error",
        last_error: message,
        updated_at: loginTimestamp,
      },
      { onConflict: "club_id" },
    );

    logError("Découverte e-Marque : connexion FBI échouée, job interrompu", error, { clubId });
    return result;
  }

  for (const match of candidates) {
    try {
      if (!match.numero) {
        // Pas de numéro de rencontre : rien à chercher (candidat de rapprochement principal, voir ARCHITECTURE.md §19).
        result.stillWaiting += 1;
        continue;
      }

      const documents = await provider.findEmarqueDocuments(session, match.numero);

      if (documents.length === 0) {
        await scheduleNextAttempt(supabase, match.id, match.emarque_discovery_attempt_count);
        result.stillWaiting += 1;
        continue;
      }

      const zipDoc = documents[0]!;
      const zipBuffer = await provider.downloadDocument(session, zipDoc.url);
      const fileHash = createHash("sha256").update(zipBuffer).digest("hex");

      const storagePath = emarqueStoragePath(clubId, resolveSeasonLabel(match.match_datetime), match.id, "original.zip");
      await uploadEmarqueFile(storagePath, zipBuffer, "application/zip");

      const parsed = await parseEmarqueZip(zipBuffer, {
        ffbbMatchNumero: match.numero,
        ffbbScoreHome: match.score_home,
        ffbbScoreAway: match.score_away,
      });

      await persistEmarqueMatchData(supabase, {
        matchId: match.id,
        clubId,
        fileHash,
        sourceFileName: zipDoc.fileName,
        storagePath,
        parserVersion: PARSER_VERSION,
        data: parsed,
      });

      result.imported += 1;
    } catch (error) {
      result.errors += 1;

      if (error instanceof FbiError && error.code === "EMARQUE_DOWNLOAD_ENDPOINT_NOT_CONFIRMED") {
        // Limitation documentée, pas une panne : voir docs/FBI_AUTHENTICATED_SPIKE.md.
        logInfo("Découverte e-Marque : endpoint non confirmé, nouvelle tentative planifiée", { clubId, matchId: match.id });
      } else {
        logError("Découverte e-Marque : échec pour un match", error, { clubId, matchId: match.id });
      }

      await scheduleNextAttempt(supabase, match.id, match.emarque_discovery_attempt_count);
    }
  }

  const jobTimestamp = new Date().toISOString();
  await supabase.from("fbi_integration_status").upsert(
    {
      club_id: clubId,
      configured: true,
      last_job_at: jobTimestamp,
      last_job_status: result.errors === 0 ? "success" : "partial",
      updated_at: jobTimestamp,
    },
    { onConflict: "club_id" },
  );

  logInfo("Découverte e-Marque terminée", { clubId, ...result });
  return result;
}

export interface DiscoverEmarqueAllClubsResult {
  clubsProcessed: number;
  clubsSkippedLocked: number;
  perClub: Record<string, DiscoverEmarqueResult>;
}

/**
 * Point d'entrée multi-club du cron e-Marque (§28 du brief SaaS) : ne
 * traite que les clubs ayant FBI configuré (`fbi_integration_status.configured`),
 * un club à la fois, avec un verrou (club, 'fbi') pour ne jamais faire
 * cohabiter deux sessions FBI simultanées pour le même club. Chaque club est
 * traité intégralement indépendamment des autres — aucune donnée ne
 * traverse d'un club à l'autre (nouvelle session FBI, nouveau storage path,
 * nouvelles écritures DB scopées club_id).
 */
export async function discoverEmarqueForAllClubs(supabase: Client): Promise<DiscoverEmarqueAllClubsResult> {
  const { data: configuredStatuses, error: statusError } = await supabase.from("fbi_integration_status").select("club_id").eq("configured", true);

  if (statusError) {
    throw new Error(`Recherche des clubs avec FBI configuré échouée : ${statusError.message}`);
  }

  const result: DiscoverEmarqueAllClubsResult = { clubsProcessed: 0, clubsSkippedLocked: 0, perClub: {} };

  const clubIds = (configuredStatuses ?? []).map((s) => s.club_id);
  if (clubIds.length === 0) return result;

  const { data: activeClubs, error: clubsError } = await supabase.from("clubs").select("id").eq("status", "active").in("id", clubIds);

  if (clubsError) {
    throw new Error(`Recherche des clubs actifs échouée : ${clubsError.message}`);
  }

  for (const club of activeClubs ?? []) {
    const { data: acquired, error: lockError } = await supabase.rpc("try_acquire_sync_lock", { p_club_id: club.id, p_integration: "fbi" });

    if (lockError) {
      logError("Acquisition du verrou de découverte e-Marque échouée", lockError, { clubId: club.id });
      continue;
    }

    if (!acquired) {
      logInfo("Découverte e-Marque déjà en cours pour ce club, ignorée", { clubId: club.id });
      result.clubsSkippedLocked += 1;
      continue;
    }

    try {
      result.perClub[club.id] = await discoverEmarqueForClub(supabase, club.id);
      result.clubsProcessed += 1;
    } catch (error) {
      logError("Découverte e-Marque d'un club en erreur", error, { clubId: club.id });
    } finally {
      await supabase.rpc("release_sync_lock", { p_club_id: club.id, p_integration: "fbi" });
    }
  }

  return result;
}
