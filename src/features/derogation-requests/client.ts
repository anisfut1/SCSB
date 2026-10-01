import { browserApi } from "@/lib/api/browserClient";
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
} from "@/lib/api/derogationRequests";
import * as pub from "@/lib/api/publicDerogationRequests";

/**
 * D'où viennent les droits : compte connecté (espace club) ou lien personnel
 * (espace public sans compte). Sérialisable — passé des Server Components
 * aux composants clients, qui en déduisent le client HTTP.
 */
export type DerogationSource = { kind: "club"; clubId: string } | { kind: "public"; clubSlug: string; token: string };

export interface DerogationRequestsClient {
  context(): Promise<DerogationContextDto>;
  list(params?: ListDerogationRequestsParams): Promise<DerogationRequestListDto>;
  get(requestId: string): Promise<DerogationRequestDetailDto>;
  create(body: CreateDerogationRequestDto): Promise<DerogationRequestDetailDto>;
  message(requestId: string, message: string): Promise<DerogationRequestDetailDto>;
  action(requestId: string, action: DerogationAction, message?: string | null): Promise<DerogationRequestDetailDto>;
  propose(requestId: string, body: ProposeDerogationSlotDto): Promise<DerogationRequestDetailDto>;
  availability(matchId: string, date: string): Promise<DerogationAvailabilityDto>;
  checkSlot(matchId: string, startAt: string, venueId: string | null): Promise<DerogationSlotCheckDto>;
  official(requestId: string, body: OfficialDerogationDto): Promise<SubmitOfficialDerogationResultDto>;
}

export function derogationClient(source: DerogationSource): DerogationRequestsClient {
  if (source.kind === "club") {
    const api = browserApi.derogationRequests;
    const id = source.clubId;
    return {
      context: () => api.context(id),
      list: (params) => api.list(id, params),
      get: (requestId) => api.get(id, requestId),
      create: (body) => api.create(id, body),
      message: (requestId, message) => api.message(id, requestId, message),
      action: (requestId, action, message) => api.action(id, requestId, action, message),
      propose: (requestId, body) => api.propose(id, requestId, body),
      availability: (matchId, date) => api.availability(id, matchId, date),
      checkSlot: (matchId, startAt, venueId) => api.checkSlot(id, matchId, startAt, venueId),
      official: (requestId, body) => api.official(id, requestId, body),
    };
  }
  const { clubSlug: slug, token } = source;
  return {
    context: () => pub.getPublicDerogationContext(slug, token),
    list: (params) => pub.listPublicDerogationRequests(slug, token, params),
    get: (requestId) => pub.getPublicDerogationRequest(slug, token, requestId),
    create: (body) => pub.createPublicDerogationRequest(slug, token, body),
    message: (requestId, message) => pub.postPublicDerogationMessage(slug, token, requestId, message),
    action: (requestId, action, message) => pub.performPublicDerogationAction(slug, token, requestId, action, message),
    propose: (requestId, body) => pub.proposePublicDerogationSlot(slug, token, requestId, body),
    availability: (matchId, date) => pub.getPublicDerogationAvailability(slug, token, matchId, date),
    checkSlot: (matchId, startAt, venueId) => pub.checkPublicDerogationSlot(slug, token, matchId, startAt, venueId),
    official: (requestId, body) => pub.submitPublicOfficialDerogation(slug, token, requestId, body),
  };
}
