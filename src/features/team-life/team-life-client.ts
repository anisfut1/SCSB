import { browserApi } from "@/lib/api/browserClient";
import { publicTeamLife, type ConvocationPreviewDto, type MatchTeamLifeDto, type PutConvocationDraftDto, type CreateTrainingSeriesDto, type PeriodQuery, type TrainingOccurrenceDetailDto, type TrainingOccurrenceDto, type TrainingSeriesDto, type UpdateTrainingOccurrenceDto, type UpdateTrainingSeriesDto } from "@/lib/api/teamLife";

/**
 * Gestion des entraînements d'une équipe, quel que soit le point d'entrée :
 * espace club (compte : admin, coach de l'équipe) ou espace public (coach /
 * admin du club via son lien personnel). Mêmes écrans, le serveur revérifie
 * les droits à chaque appel — même principe que `TablesClient`.
 */
export interface TeamLifeClient {
  listSeries(teamId: string): Promise<{ series: TrainingSeriesDto[] }>;
  createSeries(teamId: string, body: CreateTrainingSeriesDto): Promise<{ series: TrainingSeriesDto[] }>;
  updateSeries(seriesId: string, body: UpdateTrainingSeriesDto): Promise<{ series: TrainingSeriesDto[] }>;
  stopSeries(seriesId: string, from?: string): Promise<{ series: TrainingSeriesDto[] }>;
  listTrainings(teamId: string, period?: PeriodQuery): Promise<{ trainings: TrainingOccurrenceDto[] }>;
  detail(occurrenceId: string): Promise<TrainingOccurrenceDetailDto>;
  updateOccurrence(occurrenceId: string, body: UpdateTrainingOccurrenceDto): Promise<TrainingOccurrenceDto>;
  cancel(occurrenceId: string, reason: string | null): Promise<TrainingOccurrenceDto>;
  restore(occurrenceId: string): Promise<TrainingOccurrenceDto>;
  // Lot 2 : disponibilités et convocation d'un match.
  match(matchId: string): Promise<MatchTeamLifeDto>;
  openAvailability(matchId: string): Promise<MatchTeamLifeDto>;
  saveDraft(matchId: string, body: PutConvocationDraftDto): Promise<MatchTeamLifeDto>;
  preview(matchId: string): Promise<ConvocationPreviewDto>;
  send(matchId: string): Promise<MatchTeamLifeDto>;
}

export function clubTeamLifeClient(clubId: string): TeamLifeClient {
  const api = browserApi.teamLife;
  return {
    listSeries: (teamId) => api.listSeries(clubId, teamId),
    createSeries: (teamId, body) => api.createSeries(clubId, teamId, body),
    updateSeries: (seriesId, body) => api.updateSeries(clubId, seriesId, body),
    stopSeries: (seriesId, from) => api.stopSeries(clubId, seriesId, from),
    listTrainings: (teamId, period) => api.listTrainings(clubId, teamId, period),
    detail: (occurrenceId) => api.detail(clubId, occurrenceId),
    updateOccurrence: (occurrenceId, body) => api.updateOccurrence(clubId, occurrenceId, body),
    cancel: (occurrenceId, reason) => api.cancel(clubId, occurrenceId, reason),
    restore: (occurrenceId) => api.restore(clubId, occurrenceId),
    match: (matchId) => api.match(clubId, matchId),
    openAvailability: (matchId) => api.openAvailability(clubId, matchId),
    saveDraft: (matchId, body) => api.saveDraft(clubId, matchId, body),
    preview: (matchId) => api.preview(clubId, matchId),
    send: (matchId) => api.send(clubId, matchId),
  };
}

export function publicTeamLifeClient(clubSlug: string, token: string): TeamLifeClient {
  const api = publicTeamLife;
  return {
    listSeries: (teamId) => api.listSeries(clubSlug, token, teamId),
    createSeries: (teamId, body) => api.createSeries(clubSlug, token, teamId, body),
    updateSeries: (seriesId, body) => api.updateSeries(clubSlug, token, seriesId, body),
    stopSeries: (seriesId, from) => api.stopSeries(clubSlug, token, seriesId, from),
    listTrainings: (teamId, period) => api.listTrainings(clubSlug, token, teamId, period),
    detail: (occurrenceId) => api.detail(clubSlug, token, occurrenceId),
    updateOccurrence: (occurrenceId, body) => api.updateOccurrence(clubSlug, token, occurrenceId, body),
    cancel: (occurrenceId, reason) => api.cancel(clubSlug, token, occurrenceId, reason),
    restore: (occurrenceId) => api.restore(clubSlug, token, occurrenceId),
    match: (matchId) => api.match(clubSlug, token, matchId),
    openAvailability: (matchId) => api.openAvailability(clubSlug, token, matchId),
    saveDraft: (matchId, body) => api.saveDraft(clubSlug, token, matchId, body),
    preview: (matchId) => api.preview(clubSlug, token, matchId),
    send: (matchId) => api.send(clubSlug, token, matchId),
  };
}
