import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { logError, logInfo } from "@/lib/logger";

type Client = SupabaseClient<Database>;

const UNIQUE_VIOLATION = "23505";

export interface EnqueueEmarqueJobsResult {
  candidatesExamined: number;
  jobsCreated: number;
  alreadyQueued: number;
  skippedNotConfigured: boolean;
}

/**
 * Empile un job `discover_emarque` PAR MATCH CANDIDAT de ce club, au lieu
 * de faire le travail FBI en ligne (§9/§11 du brief FBI : Playwright ne
 * tourne jamais dans une route Vercel). Un vrai worker séparé
 * (voir worker/README.md) consomme ensuite ces jobs via
 * `claim_next_fbi_job` — ce cron n'a donc plus besoin d'ouvrir de session
 * FBI ni de durée d'exécution longue.
 *
 * FBI EST FACULTATIF (addendum du brief FBI) : un club sans FBI configuré,
 * ou avec `auto_import_emarque` désactivé, n'obtient AUCUN job — ce n'est
 * jamais une erreur, juste `skippedNotConfigured: true`. Un club dont FBI
 * est configuré mais actuellement EN ERREUR obtient quand même ses jobs
 * (ils échoueront et seront replanifiés par le worker, §27/§47) : le
 * calendrier FFBB de ce club continue de fonctionner indépendamment.
 */
export async function enqueueEmarqueDiscoveryJobsForClub(supabase: Client, clubId: string): Promise<EnqueueEmarqueJobsResult> {
  const result: EnqueueEmarqueJobsResult = {
    candidatesExamined: 0,
    jobsCreated: 0,
    alreadyQueued: 0,
    skippedNotConfigured: false,
  };

  const { data: fbiStatus, error: fbiStatusError } = await supabase
    .from("fbi_integration_status")
    .select("configured, auto_import_emarque")
    .eq("club_id", clubId)
    .maybeSingle();

  if (fbiStatusError) {
    throw new Error(`Lecture du statut FBI échouée : ${fbiStatusError.message}`);
  }

  if (!fbiStatus?.configured || !fbiStatus.auto_import_emarque) {
    result.skippedNotConfigured = true;
    logInfo("Découverte e-Marque ignorée (FBI non configuré ou récupération automatique désactivée)", { clubId });
    return result;
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("matches")
    .select("id, numero")
    .eq("club_id", clubId)
    .eq("status", "played")
    .in("emarque_status", ["pending", "waiting_for_emarque"]);

  if (candidatesError) {
    throw new Error(`Recherche des matchs candidats à la découverte e-Marque échouée : ${candidatesError.message}`);
  }

  const queueable = (candidates ?? []).filter((match) => Boolean(match.numero));
  result.candidatesExamined = queueable.length;

  for (const match of queueable) {
    const { error: insertError } = await supabase.from("fbi_jobs").insert({
      club_id: clubId,
      match_id: match.id,
      type: "discover_emarque",
    });

    if (!insertError) {
      result.jobsCreated += 1;
      continue;
    }

    if (insertError.code === UNIQUE_VIOLATION) {
      // Un job discover_emarque est déjà en attente/en cours pour ce match
      // (voir l'index partiel fbi_jobs_unique_pending_discovery) — normal
      // si le cron tourne plus souvent que le worker ne vide la file.
      result.alreadyQueued += 1;
      continue;
    }

    logError("Création d'un job de découverte e-Marque échouée", insertError, { clubId, matchId: match.id });
  }

  logInfo("Empilement des jobs de découverte e-Marque terminé", { clubId, ...result });
  return result;
}

export interface EnqueueEmarqueJobsAllClubsResult {
  clubsProcessed: number;
  perClub: Record<string, EnqueueEmarqueJobsResult>;
}

/**
 * Point d'entrée multi-club du cron e-Marque : parcourt tous les clubs
 * actifs — pas seulement ceux ayant FBI configuré, puisque ce cron doit
 * pouvoir constater lui-même qu'un club n'a pas FBI et l'ignorer proprement
 * (`skippedNotConfigured`) plutôt que de dépendre d'une présélection.
 * Aucun verrou nécessaire ici : insérer des lignes `fbi_jobs` est une
 * opération courte et idempotente (contrainte unique), contrairement à
 * l'ancienne version qui ouvrait une session FBI par club.
 */
export async function enqueueEmarqueDiscoveryJobsForAllClubs(supabase: Client): Promise<EnqueueEmarqueJobsAllClubsResult> {
  const { data: activeClubs, error: clubsError } = await supabase.from("clubs").select("id").eq("status", "active");

  if (clubsError) {
    throw new Error(`Recherche des clubs actifs échouée : ${clubsError.message}`);
  }

  const result: EnqueueEmarqueJobsAllClubsResult = { clubsProcessed: 0, perClub: {} };

  for (const club of activeClubs ?? []) {
    try {
      result.perClub[club.id] = await enqueueEmarqueDiscoveryJobsForClub(supabase, club.id);
      result.clubsProcessed += 1;
    } catch (error) {
      logError("Empilement des jobs de découverte e-Marque en erreur pour un club", error, { clubId: club.id });
    }
  }

  return result;
}
