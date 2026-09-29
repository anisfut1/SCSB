import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type PlatformClubDto = components["schemas"]["PlatformClubDto"];
export type CreateClubDto = components["schemas"]["CreateClubDto"];
export type PurgeEmarqueDocumentsResultDto = components["schemas"]["PurgeEmarqueDocumentsResultDto"];
export type DeleteOldSeasonsResultDto = components["schemas"]["DeleteOldSeasonsResultDto"];

/** GET /v1/platform/clubs — §24 de la demande, réservé platform_admin (vérifié côté backend). */
export async function listPlatformClubs(fetcher: ApiFetcher): Promise<PlatformClubDto[]> {
  const { clubs } = await fetcher<{ clubs: PlatformClubDto[] }>("/v1/platform/clubs");
  return clubs;
}

/** POST /v1/platform/clubs — §24 de la demande : invitation gérée par le backend (`inviteUserByEmail`), jamais depuis le frontend. */
export async function createClub(fetcher: ApiFetcher, body: CreateClubDto): Promise<{ clubId: string; slug: string; adminInviteError: string | null }> {
  return fetcher(`/v1/platform/clubs`, { method: "POST", body });
}

/**
 * POST /v1/platform/maintenance/purge-emarque-documents — retour du club,
 * 2026-09-29 : "je veux juste l'interpréter... pas la stocker", appliqué
 * rétroactivement à tout document déjà stocké. Idempotente, jamais
 * destructive pour les stats déjà en base (voir docs/EMARQUE.md côté
 * club-manager-api).
 */
export async function purgeEmarqueDocuments(fetcher: ApiFetcher): Promise<PurgeEmarqueDocumentsResultDto> {
  return fetcher(`/v1/platform/maintenance/purge-emarque-documents`, { method: "POST" });
}

/**
 * POST /v1/platform/maintenance/delete-old-seasons — retour du club,
 * 2026-09-29 : "focus saison 2026-2027". IRRÉVERSIBLE — supprime tous les
 * matchs du club antérieurs à la saison en cours (cascade FK sur toutes
 * les données liées). La confirmation utilisateur est de la responsabilité
 * de l'UI appelante (voir `DangerZone.tsx`).
 */
export async function deleteOldSeasons(fetcher: ApiFetcher, clubId: string): Promise<DeleteOldSeasonsResultDto> {
  return fetcher(`/v1/platform/maintenance/delete-old-seasons`, { method: "POST", body: { clubId } });
}
