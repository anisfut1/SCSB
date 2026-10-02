import { apiFetch } from "./client";
import type { components } from "./generated/schema";
import type { DerogationListItemDto, RespondToDerogationDto, RespondToDerogationResultDto } from "./derogations";
import type { CreateDerogationDto, CreateDerogationResultDto } from "./matches";
import type { RefereeStatusResultDto, TableSuggestionsDto } from "./tables";

/**
 * Client HTTP pour le flux Tables de marque SANS COMPTE (retour du club,
 * 2026-09-29 : "je vais envoyer le lien à tout le monde... l'accès se
 * fera sans création de compte"). Jamais de jeton Supabase ici — l'identité
 * vient exclusivement d'un jeton personnel transmis en `?token=` (voir
 * club-manager-api/docs/PUBLIC_TABLE_ACCESS.md). Utilise `apiFetch`
 * directement (jamais `browserApi`/`api.server`, qui attachent un jeton
 * Supabase) : ce module est volontairement indépendant de toute session.
 */

export type PublicClubDto = components["schemas"]["PublicClubDto"];
export type PublicLicencieDto = components["schemas"]["PublicLicencieDto"];
export type RequestPersonalLinkResultDto = components["schemas"]["RequestPersonalLinkResultDto"];
export type PublicLinkTarget = components["schemas"]["PublicLinkTarget"];
export type PublicMeDto = components["schemas"]["PublicMeDto"];
export type TableAssignmentRole = components["schemas"]["TableAssignmentRole"];
export type TableAssignmentSlotDto = components["schemas"]["TableAssignmentSlotDto"];
export type TableMatchRefDto = components["schemas"]["TableMatchRefDto"];
export type PublicAssignResultDto = components["schemas"]["PublicAssignResultDto"];

/** Même correction manuelle du nullable imbriqué que src/lib/api/tables.ts (openapi-typescript perd le `| null`). */
export interface PublicTableAssignmentsForMatchDto {
  match: TableMatchRefDto;
  assignments: {
    scorer: TableAssignmentSlotDto | null;
    timekeeper: TableAssignmentSlotDto | null;
    clubDelegate: TableAssignmentSlotDto | null;
    referee: TableAssignmentSlotDto | null;
  };
  refereeNotNeeded: boolean;
  hasConflict: boolean;
}

export interface PublicTableAssignmentsListDto {
  me: { id: string; firstName: string; lastName: string };
  matches: PublicTableAssignmentsForMatchDto[];
}

/** GET /v1/public/clubs/:clubSlug — infos club minimales, aucune session requise. */
export async function getPublicClub(clubSlug: string): Promise<PublicClubDto> {
  return apiFetch<PublicClubDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}`);
}

/** GET .../licencies — roster pour choisir son nom (`claimed` seulement, jamais qui). */
export async function listPublicLicencies(clubSlug: string): Promise<PublicLicencieDto[]> {
  const { licencies } = await apiFetch<{ licencies: PublicLicencieDto[] }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/licencies`);
  return licencies;
}

/**
 * POST .../licencies/:licencieId/request-link — envoie le lien personnel
 * PAR EMAIL uniquement (retour du club, 2026-10-01) : le jeton n'est jamais
 * dans la réponse, seulement l'adresse masquée. `email` n'est utilisé par
 * le serveur que si aucune adresse n'est encore connue (sinon `400
 * EMAIL_REQUIRED` est renvoyé quand il en faut une).
 */
export async function requestPersonalLink(clubSlug: string, licencieId: string, params: { email?: string | null; returnTo: PublicLinkTarget }): Promise<RequestPersonalLinkResultDto> {
  return apiFetch<RequestPersonalLinkResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/licencies/${licencieId}/request-link`, {
    method: "POST",
    body: { email: params.email ?? null, returnTo: params.returnTo },
  });
}

/** GET .../derogations?token= — lecture seule, réservée aux licenciés admins du club (403 `CLUB_ADMIN_REQUIRED` sinon). */
export async function listPublicDerogations(clubSlug: string, token: string): Promise<DerogationListItemDto[]> {
  const { derogations } = await apiFetch<{ derogations: DerogationListItemDto[] }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/derogations?token=${encodeURIComponent(token)}`);
  return derogations;
}

/** GET .../me?token= — vérifie/résout l'identité d'un lien déjà en poche. */
export async function getPublicMe(clubSlug: string, token: string): Promise<PublicMeDto> {
  return apiFetch<PublicMeDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/me?token=${encodeURIComponent(token)}`);
}

export interface ListPublicTableAssignmentsParams {
  from?: string;
  to?: string;
}

/** GET .../table-assignments?token=&from=&to= — même contenu que la vue admin, `me` en plus. */
export async function listPublicTableAssignments(clubSlug: string, token: string, params: ListPublicTableAssignmentsParams = {}): Promise<PublicTableAssignmentsListDto> {
  const search = new URLSearchParams({ token });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  return apiFetch<PublicTableAssignmentsListDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/table-assignments?${search.toString()}`);
}

/**
 * PUT .../matches/:matchId/table-assignments/:role?token= — sans
 * `licencieId` : auto-affectation (identité du jeton). Avec : désignation
 * d'un autre licencié, que le serveur réserve aux coachs / admins du club
 * (403 `TABLES_MANAGER_REQUIRED` sinon — retour du club, 2026-10-02).
 */
export async function putPublicTableAssignment(clubSlug: string, token: string, matchId: string, role: TableAssignmentRole, licencieId?: string): Promise<PublicAssignResultDto> {
  return apiFetch<PublicAssignResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/table-assignments/${role}?token=${encodeURIComponent(token)}`, {
    method: "PUT",
    ...(licencieId ? { body: { licencieId } } : {}),
  });
}

/** GET .../matches/:matchId/table-suggestions?token=&role= — coachs / admins du club, mêmes suggestions que la vue admin. */
export async function getPublicTableSuggestions(clubSlug: string, token: string, matchId: string, role: TableAssignmentRole): Promise<TableSuggestionsDto> {
  return apiFetch<TableSuggestionsDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/table-suggestions?token=${encodeURIComponent(token)}&role=${role}`);
}

/** PUT .../matches/:matchId/referee-status?token= — « pas besoin d'arbitre », coachs / admins du club. */
export async function setPublicRefereeStatus(clubSlug: string, token: string, matchId: string, noRefereeNeeded: boolean): Promise<RefereeStatusResultDto> {
  return apiFetch<RefereeStatusResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/referee-status?token=${encodeURIComponent(token)}`, {
    method: "PUT",
    body: { noRefereeNeeded },
  });
}

/** DELETE .../matches/:matchId/table-assignments/:role?token= — sa propre affectation ; n'importe laquelle pour un coach / admin du club (403 côté serveur sinon). */
export async function deletePublicTableAssignment(clubSlug: string, token: string, matchId: string, role: TableAssignmentRole): Promise<void> {
  await apiFetch<{ removed: true }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/table-assignments/${role}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
}

/**
 * POST .../derogations/:derogationId/respond?token= — ÉCRIT sur FBI
 * (accepter / refuser). Admin du club ou coordinateur (retour du club,
 * 2026-10-02) ; même délai généreux que la version espace club.
 */
export async function respondPublicDerogation(clubSlug: string, token: string, derogationId: string, body: RespondToDerogationDto): Promise<RespondToDerogationResultDto> {
  return apiFetch<RespondToDerogationResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/derogations/${encodeURIComponent(derogationId)}/respond?token=${encodeURIComponent(token)}`, {
    method: "POST",
    body,
    timeoutMs: 120_000,
  });
}

/** POST .../matches/:matchId/derogation/create?token= — ÉCRIT sur FBI : nouvelle dérogation officielle. Admin du club ou coordinateur. */
export async function createPublicDerogation(clubSlug: string, token: string, matchId: string, body: CreateDerogationDto): Promise<CreateDerogationResultDto> {
  return apiFetch<CreateDerogationResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/derogation/create?token=${encodeURIComponent(token)}`, {
    method: "POST",
    body,
    timeoutMs: 120_000,
  });
}
