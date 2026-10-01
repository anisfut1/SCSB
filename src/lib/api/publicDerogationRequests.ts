import { apiFetch } from "./client";
import type {
  CreateDerogationRequestDto,
  DerogationAction,
  DerogationAvailabilityDto,
  DerogationContextDto,
  DerogationRequestDetailDto,
  DerogationRequestListDto,
  DerogationSlotCheckDto,
  ListDerogationRequestsParams,
  OfficialDerogationDto,
  ProposeDerogationSlotDto,
  SubmitOfficialDerogationResultDto,
} from "./derogationRequests";

/**
 * Demandes de dérogation internes depuis l'ESPACE PUBLIC SANS COMPTE
 * (retour du club, 2026-10-01 : coachs et coordinateurs désignés depuis
 * /joueurs). Identité = lien personnel (`?token=`), jamais un jeton
 * Supabase : `apiFetch` direct, comme `publicTables.ts`. Mêmes réponses que
 * l'espace club (club-manager-api réutilise les mêmes handlers).
 */
const base = (clubSlug: string) => `/v1/public/clubs/${encodeURIComponent(clubSlug)}/derogation-requests`;

function withToken(path: string, token: string, params: Record<string, string | undefined> = {}): string {
  const search = new URLSearchParams({ token });
  for (const [k, v] of Object.entries(params)) if (v !== undefined) search.set(k, v);
  return `${path}?${search.toString()}`;
}

export function getPublicDerogationContext(clubSlug: string, token: string): Promise<DerogationContextDto> {
  return apiFetch<DerogationContextDto>(withToken(`${base(clubSlug)}/context`, token));
}

export function listPublicDerogationRequests(clubSlug: string, token: string, params: ListDerogationRequestsParams = {}): Promise<DerogationRequestListDto> {
  return apiFetch<DerogationRequestListDto>(
    withToken(base(clubSlug), token, {
      status: params.status,
      teamId: params.teamId,
      matchId: params.matchId,
      createdByMe: params.createdByMe === undefined ? undefined : String(params.createdByMe),
      limit: params.limit === undefined ? undefined : String(params.limit),
      offset: params.offset === undefined ? undefined : String(params.offset),
    }),
  );
}

export function getPublicDerogationRequest(clubSlug: string, token: string, requestId: string): Promise<DerogationRequestDetailDto> {
  return apiFetch<DerogationRequestDetailDto>(withToken(`${base(clubSlug)}/${requestId}`, token));
}

export function createPublicDerogationRequest(clubSlug: string, token: string, body: CreateDerogationRequestDto): Promise<DerogationRequestDetailDto> {
  return apiFetch<DerogationRequestDetailDto>(withToken(base(clubSlug), token), { method: "POST", body });
}

export function postPublicDerogationMessage(clubSlug: string, token: string, requestId: string, message: string): Promise<DerogationRequestDetailDto> {
  return apiFetch<DerogationRequestDetailDto>(withToken(`${base(clubSlug)}/${requestId}/messages`, token), { method: "POST", body: { message } });
}

export function performPublicDerogationAction(clubSlug: string, token: string, requestId: string, action: DerogationAction, message?: string | null): Promise<DerogationRequestDetailDto> {
  return apiFetch<DerogationRequestDetailDto>(withToken(`${base(clubSlug)}/${requestId}/actions`, token), { method: "POST", body: { action, message: message ?? null } });
}

export function proposePublicDerogationSlot(clubSlug: string, token: string, requestId: string, body: ProposeDerogationSlotDto): Promise<DerogationRequestDetailDto> {
  return apiFetch<DerogationRequestDetailDto>(withToken(`${base(clubSlug)}/${requestId}/proposals`, token), { method: "POST", body });
}

export function getPublicDerogationAvailability(clubSlug: string, token: string, matchId: string, date: string): Promise<DerogationAvailabilityDto> {
  return apiFetch<DerogationAvailabilityDto>(withToken(`${base(clubSlug)}/availability`, token, { matchId, date }));
}

export function checkPublicDerogationSlot(clubSlug: string, token: string, matchId: string, startAt: string, venueId: string | null): Promise<DerogationSlotCheckDto> {
  return apiFetch<DerogationSlotCheckDto>(withToken(`${base(clubSlug)}/slot-check`, token, { matchId, startAt, venueId: venueId ?? undefined }));
}

export function submitPublicOfficialDerogation(clubSlug: string, token: string, requestId: string, body: OfficialDerogationDto): Promise<SubmitOfficialDerogationResultDto> {
  return apiFetch<SubmitOfficialDerogationResultDto>(withToken(`${base(clubSlug)}/${requestId}/official`, token), { method: "POST", body });
}
