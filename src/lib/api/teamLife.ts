import type { ApiFetcher } from "./client";
import { apiFetch } from "./client";
import { publicFetch } from "./publicTokenTransport";
import type { components } from "./generated/schema";

/**
 * Vie d'équipe — Lot 1 (retour du club, 2026-10-09) : entraînements,
 * planning, réponses Présent / Absent / Incertain, Home « À faire ». Voir
 * club-manager-api/docs/TEAM_LIFE.md. Espace club (compte, `fetcher`) et
 * espace public (lien personnel) : mêmes routes sous `/team-life`.
 */

/** `NonNullable` : openapi-typescript ajoute `null` à cet enum (réutilisé en `.nullable()` dans d'autres schémas). */
export type TrainingResponseValue = NonNullable<components["schemas"]["TrainingResponseValue"]>;
export type TrainingSeriesDto = components["schemas"]["TrainingSeriesDto"];
export type TrainingSlotInput = components["schemas"]["TrainingSlotInput"];
export type CreateTrainingSeriesDto = components["schemas"]["CreateTrainingSeriesDto"];
export type UpdateTrainingSeriesDto = components["schemas"]["UpdateTrainingSeriesDto"];
export type TrainingOccurrenceDto = components["schemas"]["TrainingOccurrenceDto"];
export type TrainingOccurrenceDetailDto = components["schemas"]["TrainingOccurrenceDetailDto"];
export type UpdateTrainingOccurrenceDto = components["schemas"]["UpdateTrainingOccurrenceDto"];
export type TrainingResponseResultDto = components["schemas"]["TrainingResponseResultDto"];
export type PlanningEventDto = components["schemas"]["PlanningEventDto"];
export type PlanningDto = components["schemas"]["PlanningDto"];
export type ActionCenterDto = components["schemas"]["ActionCenterDto"];
export type ActionCenterActionDto = components["schemas"]["ActionCenterActionDto"];

export interface PeriodQuery {
  from?: string;
  to?: string;
}

const clubBase = (clubId: string) => `/v1/clubs/${clubId}/team-life`;
const publicBase = (clubSlug: string) => `/v1/public/clubs/${encodeURIComponent(clubSlug)}/team-life`;

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, value);
  const out = search.toString();
  return out ? `?${out}` : "";
}

// ── Espace club (compte) ────────────────────────────────────────────────

export const clubTeamLife = {
  listSeries: (f: ApiFetcher, clubId: string, teamId: string) => f<{ series: TrainingSeriesDto[] }>(`${clubBase(clubId)}/teams/${teamId}/training-series`),
  createSeries: (f: ApiFetcher, clubId: string, teamId: string, body: CreateTrainingSeriesDto) => f<{ series: TrainingSeriesDto[] }>(`${clubBase(clubId)}/teams/${teamId}/training-series`, { method: "POST", body }),
  updateSeries: (f: ApiFetcher, clubId: string, seriesId: string, body: UpdateTrainingSeriesDto) => f<{ series: TrainingSeriesDto[] }>(`${clubBase(clubId)}/training-series/${seriesId}`, { method: "PATCH", body }),
  stopSeries: (f: ApiFetcher, clubId: string, seriesId: string, from?: string) => f<{ series: TrainingSeriesDto[] }>(`${clubBase(clubId)}/training-series/${seriesId}${qs({ from })}`, { method: "DELETE" }),
  listTrainings: (f: ApiFetcher, clubId: string, teamId: string, period: PeriodQuery = {}) => f<{ trainings: TrainingOccurrenceDto[] }>(`${clubBase(clubId)}/trainings${qs({ teamId, ...period })}`),
  detail: (f: ApiFetcher, clubId: string, occurrenceId: string) => f<TrainingOccurrenceDetailDto>(`${clubBase(clubId)}/trainings/${occurrenceId}`),
  updateOccurrence: (f: ApiFetcher, clubId: string, occurrenceId: string, body: UpdateTrainingOccurrenceDto) => f<TrainingOccurrenceDto>(`${clubBase(clubId)}/trainings/${occurrenceId}`, { method: "PATCH", body }),
  cancel: (f: ApiFetcher, clubId: string, occurrenceId: string, reason: string | null) => f<TrainingOccurrenceDto>(`${clubBase(clubId)}/trainings/${occurrenceId}/cancel`, { method: "POST", body: { reason } }),
  restore: (f: ApiFetcher, clubId: string, occurrenceId: string) => f<TrainingOccurrenceDto>(`${clubBase(clubId)}/trainings/${occurrenceId}/restore`, { method: "POST" }),
  planning: (f: ApiFetcher, clubId: string, params: PeriodQuery & { teamId?: string; kind?: "MATCH" | "TRAINING" } = {}) => f<PlanningDto>(`${clubBase(clubId)}/planning${qs({ ...params })}`),
};

// ── Espace public (lien personnel, jamais de jeton Supabase) ───────────

export const publicTeamLife = {
  listSeries: (clubSlug: string, token: string, teamId: string) => publicFetch<{ series: TrainingSeriesDto[] }>(`${publicBase(clubSlug)}/teams/${teamId}/training-series`, token),
  createSeries: (clubSlug: string, token: string, teamId: string, body: CreateTrainingSeriesDto) => publicFetch<{ series: TrainingSeriesDto[] }>(`${publicBase(clubSlug)}/teams/${teamId}/training-series`, token, { method: "POST", body }),
  updateSeries: (clubSlug: string, token: string, seriesId: string, body: UpdateTrainingSeriesDto) => publicFetch<{ series: TrainingSeriesDto[] }>(`${publicBase(clubSlug)}/training-series/${seriesId}`, token, { method: "PATCH", body }),
  stopSeries: (clubSlug: string, token: string, seriesId: string, from?: string) => publicFetch<{ series: TrainingSeriesDto[] }>(`${publicBase(clubSlug)}/training-series/${seriesId}`, token, { method: "DELETE", query: { from } }),
  listTrainings: (clubSlug: string, token: string, teamId: string, period: PeriodQuery = {}) => publicFetch<{ trainings: TrainingOccurrenceDto[] }>(`${publicBase(clubSlug)}/teams/${teamId}/trainings`, token, { query: { ...period } }),
  detail: (clubSlug: string, token: string, occurrenceId: string) => publicFetch<TrainingOccurrenceDetailDto>(`${publicBase(clubSlug)}/trainings/${occurrenceId}`, token),
  updateOccurrence: (clubSlug: string, token: string, occurrenceId: string, body: UpdateTrainingOccurrenceDto) => publicFetch<TrainingOccurrenceDto>(`${publicBase(clubSlug)}/trainings/${occurrenceId}`, token, { method: "PATCH", body }),
  cancel: (clubSlug: string, token: string, occurrenceId: string, reason: string | null) => publicFetch<TrainingOccurrenceDto>(`${publicBase(clubSlug)}/trainings/${occurrenceId}/cancel`, token, { method: "POST", body: { reason } }),
  restore: (clubSlug: string, token: string, occurrenceId: string) => publicFetch<TrainingOccurrenceDto>(`${publicBase(clubSlug)}/trainings/${occurrenceId}/restore`, token, { method: "POST" }),
  /** Réponse du licencié DU LIEN (un lien par enfant : on envoie celui de l'enfant concerné). */
  respond: (clubSlug: string, token: string, occurrenceId: string, response: TrainingResponseValue) => publicFetch<TrainingResponseResultDto>(`${publicBase(clubSlug)}/trainings/${occurrenceId}/response`, token, { method: "PUT", body: { response } }),
  /** Home « À faire » : les liens de l'appareil voyagent dans le corps, jamais dans l'URL. */
  actionCenter: (clubSlug: string, tokens: string[]) => apiFetch<ActionCenterDto>(`${publicBase(clubSlug)}/action-center`, { method: "POST", body: { tokens } }),
  planning: (clubSlug: string, tokens: string[], period: PeriodQuery = {}) => apiFetch<PlanningDto>(`${publicBase(clubSlug)}/planning${qs({ ...period })}`, { method: "POST", body: { tokens } }),
};
