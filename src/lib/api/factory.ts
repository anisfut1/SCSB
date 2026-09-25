import type { ApiFetcher } from "./client";
import * as clubs from "./clubs";
import * as matches from "./matches";
import * as integrations from "./integrations";
import * as issues from "./issues";
import * as jobs from "./jobs";
import * as licencies from "./licencies";
import * as platform from "./platform";

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
    clubs: {
      list: () => clubs.listClubs(fetcher),
      get: (clubId: string) => clubs.getClub(fetcher, clubId),
      capabilities: (clubId: string) => clubs.getClubCapabilities(fetcher, clubId),
      teams: (clubId: string) => clubs.listTeams(fetcher, clubId),
    },
    matches: {
      list: (clubId: string, params?: matches.ListMatchesParams) => matches.listMatches(fetcher, clubId, params),
      get: (clubId: string, matchId: string) => matches.getMatch(fetcher, clubId, matchId),
      documents: (clubId: string, matchId: string) => matches.listMatchDocuments(fetcher, clubId, matchId),
    },
    integrations: {
      get: (clubId: string) => integrations.getIntegrationStatus(fetcher, clubId),
      saveFbi: (clubId: string, body: integrations.SaveFbiCredentialsDto) => integrations.saveFbiCredentials(fetcher, clubId, body),
      testFbi: (clubId: string) => integrations.testFbiConnection(fetcher, clubId),
      processFbiJobs: (clubId: string) => integrations.processFbiJobs(fetcher, clubId),
      parseFbiDocuments: (clubId: string) => integrations.parseFbiDocuments(fetcher, clubId),
      triggerFfbbSync: (clubId: string) => integrations.triggerFfbbSync(fetcher, clubId),
      syncRuns: (clubId: string) => integrations.listSyncRuns(fetcher, clubId),
    },
    issues: {
      list: (clubId: string) => issues.listIssues(fetcher, clubId),
      resolve: (clubId: string, matchId: string) => issues.resolveIssue(fetcher, clubId, matchId),
    },
    jobs: {
      get: (jobId: string) => jobs.getJob(fetcher, jobId),
      pollUntilTerminal: (jobId: string, options?: jobs.PollJobOptions) => jobs.pollJobUntilTerminal(fetcher, jobId, options),
    },
    licencies: {
      list: (clubId: string) => licencies.listLicencies(fetcher, clubId),
      get: (clubId: string, licencieId: string) => licencies.getLicencieProfile(fetcher, clubId, licencieId),
      updateProfile: (clubId: string, licencieId: string, body: licencies.UpdateLicencieProfileDto) => licencies.updateLicencieProfile(fetcher, clubId, licencieId, body),
    },
    platform: {
      listClubs: () => platform.listPlatformClubs(fetcher),
      createClub: (body: platform.CreateClubDto) => platform.createClub(fetcher, body),
    },
  };
}

export type Api = ReturnType<typeof createApi>;
