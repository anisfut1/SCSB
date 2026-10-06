import type { ApiFetcher } from "./client";
import * as clubs from "./clubs";
import * as me from "./me";
import * as matches from "./matches";
import * as integrations from "./integrations";
import * as issues from "./issues";
import * as emarqueTracking from "./emarqueTracking";
import * as jobs from "./jobs";
import * as licencies from "./licencies";
import * as platform from "./platform";
import * as derogations from "./derogations";
import * as tables from "./tables";
import * as standings from "./standings";
import * as derogationRequests from "./derogationRequests";
import * as members from "./members";

/**
 * Fonctions ergonomiques (§40 de la demande) : un composant appelle
 * `api.matches.list(clubId)`, jamais une URL en dur. Une seule
 * implémentation (`createApi`) partagée entre le client serveur
 * (src/lib/api/server.ts) et le client navigateur
 * (src/lib/api/browserClient.ts) — seule la façon d'obtenir le jeton
 * d'accès diffère entre les deux (voir auth.server.ts / auth.browser.ts).
 */
export function createApi(fetcher: ApiFetcher) {
  return {
    me: () => me.getMe(fetcher),
    clubs: {
      list: () => clubs.listClubs(fetcher),
      get: (clubId: string) => clubs.getClub(fetcher, clubId),
      update: (clubId: string, body: clubs.UpdateClubDto) => clubs.updateClub(fetcher, clubId, body),
      capabilities: (clubId: string) => clubs.getClubCapabilities(fetcher, clubId),
      teams: (clubId: string) => clubs.listTeams(fetcher, clubId),
      createTeam: (clubId: string, body: clubs.CreateTeamDto) => clubs.createTeam(fetcher, clubId, body),
      updateTeam: (clubId: string, teamId: string, body: clubs.UpdateTeamDto) => clubs.updateTeam(fetcher, clubId, teamId, body),
    },
    matches: {
      list: (clubId: string, params?: matches.ListMatchesParams) => matches.listMatches(fetcher, clubId, params),
      get: (clubId: string, matchId: string) => matches.getMatch(fetcher, clubId, matchId),
      documents: (clubId: string, matchId: string) => matches.listMatchDocuments(fetcher, clubId, matchId),
      derogation: (clubId: string, matchId: string) => matches.getMatchDerogation(fetcher, clubId, matchId),
      checkDerogation: (clubId: string, matchId: string) => matches.checkMatchDerogation(fetcher, clubId, matchId),
      createDerogation: (clubId: string, matchId: string, body: matches.CreateDerogationDto) => matches.createDerogation(fetcher, clubId, matchId, body),
    },
    integrations: {
      get: (clubId: string) => integrations.getIntegrationStatus(fetcher, clubId),
      saveFbi: (clubId: string, body: integrations.SaveFbiCredentialsDto) => integrations.saveFbiCredentials(fetcher, clubId, body),
      testFbi: (clubId: string) => integrations.testFbiConnection(fetcher, clubId),
      processFbiJobs: (clubId: string) => integrations.processFbiJobs(fetcher, clubId),
      parseFbiDocuments: (clubId: string) => integrations.parseFbiDocuments(fetcher, clubId),
      triggerFbiScheduleReconciliation: (clubId: string) => integrations.triggerFbiScheduleReconciliation(fetcher, clubId),
      checkAllDerogations: (clubId: string) => integrations.checkAllDerogations(fetcher, clubId),
      triggerFfbbSync: (clubId: string) => integrations.triggerFfbbSync(fetcher, clubId),
      syncRuns: (clubId: string) => integrations.listSyncRuns(fetcher, clubId),
    },
    standings: {
      list: (clubId: string) => standings.listStandings(fetcher, clubId),
    },
    derogationRequests: {
      context: (clubId: string) => derogationRequests.getDerogationContext(fetcher, clubId),
      list: (clubId: string, params?: derogationRequests.ListDerogationRequestsParams) => derogationRequests.listDerogationRequests(fetcher, clubId, params),
      get: (clubId: string, requestId: string) => derogationRequests.getDerogationRequest(fetcher, clubId, requestId),
      create: (clubId: string, body: derogationRequests.CreateDerogationRequestDto) => derogationRequests.createDerogationRequest(fetcher, clubId, body),
      message: (clubId: string, requestId: string, message: string) => derogationRequests.postDerogationMessage(fetcher, clubId, requestId, message),
      action: (clubId: string, requestId: string, action: derogationRequests.DerogationAction, message?: string | null) => derogationRequests.performDerogationAction(fetcher, clubId, requestId, action, message),
      propose: (clubId: string, requestId: string, body: derogationRequests.ProposeDerogationSlotDto) => derogationRequests.proposeDerogationSlot(fetcher, clubId, requestId, body),
      official: (clubId: string, requestId: string, body: derogationRequests.OfficialDerogationDto) => derogationRequests.submitOfficialDerogation(fetcher, clubId, requestId, body),
      availability: (clubId: string, matchId: string, date: string) => derogationRequests.getDerogationAvailability(fetcher, clubId, matchId, date),
      checkSlot: (clubId: string, matchId: string, startAt: string, venueId: string | null) => derogationRequests.checkDerogationSlot(fetcher, clubId, matchId, startAt, venueId),
    },
    members: {
      venues: (clubId: string) => members.listClubVenues(fetcher, clubId),
      updateVenue: (clubId: string, venueId: string, body: members.UpdateClubVenueDto) => members.updateClubVenue(fetcher, clubId, venueId, body),
    },
    derogations: {
      list: (clubId: string) => derogations.listDerogations(fetcher, clubId),
      respond: (clubId: string, derogationId: string, body: derogations.RespondToDerogationDto) => derogations.respondToDerogation(fetcher, clubId, derogationId, body),
    },
    issues: {
      list: (clubId: string) => issues.listIssues(fetcher, clubId),
      resolve: (clubId: string, matchId: string) => issues.resolveIssue(fetcher, clubId, matchId),
    },
    emarqueTracking: {
      list: (clubId: string) => emarqueTracking.listEmarqueTracking(fetcher, clubId),
      relaunch: (clubId: string, matchId: string) => emarqueTracking.relaunchEmarqueTracking(fetcher, clubId, matchId),
    },
    jobs: {
      get: (jobId: string) => jobs.getJob(fetcher, jobId),
      pollUntilTerminal: (jobId: string, options?: jobs.PollJobOptions) => jobs.pollJobUntilTerminal(fetcher, jobId, options),
    },
    licencies: {
      list: (clubId: string) => licencies.listLicencies(fetcher, clubId),
      get: (clubId: string, licencieId: string) => licencies.getLicencieProfile(fetcher, clubId, licencieId),
      updateProfile: (clubId: string, licencieId: string, body: licencies.UpdateLicencieProfileDto) => licencies.updateLicencieProfile(fetcher, clubId, licencieId, body),
      import: (clubId: string, body: licencies.ImportLicenciesDto) => licencies.importLicencies(fetcher, clubId, body),
      autoAssignTeams: (clubId: string) => licencies.autoAssignTeams(fetcher, clubId),
      remove: (clubId: string, licencieId: string) => licencies.deleteLicencie(fetcher, clubId, licencieId),
      create: (clubId: string, body: licencies.CreateLicencieDto) => licencies.createLicencie(fetcher, clubId, body),
    },
    platform: {
      listClubs: () => platform.listPlatformClubs(fetcher),
      createClub: (body: platform.CreateClubDto) => platform.createClub(fetcher, body),
      purgeEmarqueDocuments: () => platform.purgeEmarqueDocuments(fetcher),
      deleteOldSeasons: (clubId: string) => platform.deleteOldSeasons(fetcher, clubId),
      retryFailedEmarqueImports: () => platform.retryFailedEmarqueImports(fetcher),
    },
    tables: {
      list: (clubId: string, params?: tables.ListTableAssignmentsParams) => tables.listTableAssignments(fetcher, clubId, params),
      suggestions: (clubId: string, matchId: string, role: tables.TableAssignmentRole) => tables.getTableSuggestions(fetcher, clubId, matchId, role),
      assign: (clubId: string, matchId: string, role: tables.TableAssignmentRole, body: tables.PutTableAssignmentDto) => tables.putTableAssignment(fetcher, clubId, matchId, role, body),
      unassign: (clubId: string, matchId: string, role: tables.TableAssignmentRole) => tables.deleteTableAssignment(fetcher, clubId, matchId, role),
      setRefereeStatus: (clubId: string, matchId: string, noRefereeNeeded: boolean) => tables.setRefereeStatus(fetcher, clubId, matchId, noRefereeNeeded),
      listPublicAccess: (clubId: string) => tables.listPublicAccess(fetcher, clubId),
      resetPublicAccess: (clubId: string, licencieId: string) => tables.resetPublicAccess(fetcher, clubId, licencieId),
      personalLink: (clubId: string, licencieId: string) => tables.getPersonalLink(fetcher, clubId, licencieId),
    },
  };
}

export type Api = ReturnType<typeof createApi>;
