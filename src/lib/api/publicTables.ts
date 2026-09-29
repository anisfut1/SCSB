import { apiFetch } from "./client";
import type { components } from "./generated/schema";

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
export type ClaimResultDto = components["schemas"]["ClaimResultDto"];
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

/** POST .../licencies/:licencieId/claim — mint le jeton personnel, renvoyé UNE SEULE FOIS. */
export async function claimLicencie(clubSlug: string, licencieId: string, email: string | null): Promise<ClaimResultDto> {
  return apiFetch<ClaimResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/licencies/${licencieId}/claim`, {
    method: "POST",
    body: { email },
  });
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
 * PUT .../matches/:matchId/table-assignments/:role?token= — auto-
 * affectation. `licencieId` vient TOUJOURS du jeton côté serveur, jamais
 * d'un paramètre ici — impossible de s'affecter au nom de quelqu'un
 * d'autre depuis ce client.
 */
export async function putPublicTableAssignment(clubSlug: string, token: string, matchId: string, role: TableAssignmentRole): Promise<PublicAssignResultDto> {
  return apiFetch<PublicAssignResultDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/table-assignments/${role}?token=${encodeURIComponent(token)}`, { method: "PUT" });
}

/** DELETE .../matches/:matchId/table-assignments/:role?token= — retrait de SA PROPRE affectation uniquement (403 côté serveur sinon). */
export async function deletePublicTableAssignment(clubSlug: string, token: string, matchId: string, role: TableAssignmentRole): Promise<void> {
  await apiFetch<{ removed: true }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/table-assignments/${role}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
}
