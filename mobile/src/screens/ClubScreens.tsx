import { useLocation, useParams, useSearchParams } from "react-router";
import { BackButton, PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { PublicHomeApp } from "@/features/public-home/PublicHomeApp";
import { PublicPlanningApp } from "@/features/team-life/PublicPlanningApp";
import { PublicTeamsApp } from "@/features/team-life/PublicTeamsApp";
import { PublicTeamPageApp } from "@/features/team-life/PublicTeamPageApp";
import { teamTabOf } from "@/features/team-life/team-tab";
import { PublicTrainingsApp } from "@/features/team-life/PublicTrainingsApp";
import { PublicMatchFamilyBlock, PublicMatchTeamLifeBlock } from "@/features/team-life/MatchTeamLifeBlocks";
import { PublicDerogationsApp } from "@/features/public-derogations/PublicDerogationsApp";
import { PublicNewRequestPage, PublicRequestThreadPage } from "@/features/public-derogations/PublicRequestPages";
import { PublicMatchRequestBlock } from "@/features/public-derogations/PublicMatchRequestBlock";
import { PublicOfficialDerogationBlock } from "@/features/public-derogations/PublicOfficialDerogationBlock";
import { PublicTablesApp } from "@/features/public-tables/PublicTablesApp";
import { TableLeaderboard } from "@/features/tables/TableLeaderboard";
import { MatchDetailView } from "@/features/matches/detail/MatchDetailView";
import { parseMatchTab } from "@/features/matches/detail/labels";
import { MatchesView } from "@/features/matches/MatchesView";
import { parseMatchFilters } from "@/features/matches/match-filters";
import { loadMatchesForView } from "@/features/matches/load-matches";
import { ResultsView } from "@/features/results/ResultsView";
import { buildResultGroups } from "@/features/results/result-groups";
import { PublicPlayerProfile } from "@/features/public-players/PublicPlayerProfile";
import { getPublicMatch, getPublicPlayer, listPublicMatchDocuments, listPublicMatches, listPublicStandings, listPublicTeams } from "@/lib/api/publicMatches";
import { getTableLeaderboard } from "@/lib/api/publicTables";
import { currentSeasonStart } from "@/lib/season";
import { loadClub, useLoad } from "./use-load";
import { NetworkError } from "../shell/NetworkState";

/**
 * Écrans de l'espace club dans l'app : les MÊMES composants que le site
 * (src/features/*), chargés côté client. Chemins identiques au web
 * (`/public/{slug}/…`) : un lien email, un Universal Link ou une notification
 * ouvrent directement le bon écran.
 */
function useSlug(): string {
  return useParams<{ clubSlug: string }>().clubSlug ?? "";
}

function Loading() {
  return (
    <PageContainer>
      <ListSkeleton rows={5} />
    </PageContainer>
  );
}

function Failure({ error, offline }: { error: Error; offline: boolean }) {
  return <PageContainer>{offline ? <NetworkError /> : <ErrorState title="Indisponible" description={error.message} />}</PageContainer>;
}

function searchObject(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(params.entries());
}

export function HomeScreen() {
  const slug = useSlug();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer width="wide">
      <PublicHomeApp clubSlug={slug} club={{ name: club.data.name, logoUrl: club.data.logoUrl, timezone: club.data.timezone }} />
    </PageContainer>
  );
}

export function PlanningScreen() {
  const slug = useSlug();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer>
      <PublicPlanningApp clubSlug={slug} club={{ name: club.data.name, timezone: club.data.timezone }} />
    </PageContainer>
  );
}

export function TeamsScreen() {
  const slug = useSlug();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer className="gap-6">
      <PublicTeamsApp clubSlug={slug} clubName={club.data.name} />
    </PageContainer>
  );
}

export function TeamScreen() {
  const slug = useSlug();
  const { teamId = "" } = useParams<{ teamId: string }>();
  const [params] = useSearchParams();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer className="gap-6">
      <PublicTeamPageApp clubSlug={slug} teamId={teamId} timezone={club.data.timezone} tab={teamTabOf(params.get("vue") ?? undefined)} />
    </PageContainer>
  );
}

export function TrainingsScreen() {
  const slug = useSlug();
  const [params] = useSearchParams();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer>
      <PublicTrainingsApp clubSlug={slug} club={{ name: club.data.name, timezone: club.data.timezone }} initialTeamId={params.get("equipe")} initialOccurrenceId={params.get("seance")} />
    </PageContainer>
  );
}

export function MatchesScreen() {
  const slug = useSlug();
  const [params] = useSearchParams();
  const filters = parseMatchFilters(searchObject(params));
  const load = useLoad(async () => {
    const [club, view] = await Promise.all([
      loadClub(slug),
      loadMatchesForView({ serverFilters: false, filters, seasonStart: currentSeasonStart(), now: new Date(), fetchTeams: () => listPublicTeams(slug), fetchMatches: (p) => listPublicMatches(slug, p) }),
    ]);
    return { club, ...view };
  }, [slug]);
  if (load.error) return <Failure error={load.error} offline={load.offline} />;
  if (!load.data) return <Loading />;
  const { club, teams, matches } = load.data;
  return (
    <PageContainer width="wide">
      <PageHeader eyebrow={club.name} title="Matchs de la saison" description="Horaires, salles et résultats, mis à jour automatiquement." />
      <MatchesView all={matches} teams={teams} filters={filters} basePath={`/public/${slug}/matchs`} club={{ name: club.name, logoUrl: club.logoUrl }} />
    </PageContainer>
  );
}

export function MatchScreen() {
  const slug = useSlug();
  const { matchId = "" } = useParams<{ matchId: string }>();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const tab = parseMatchTab(params.get("tab") ?? undefined);
  const load = useLoad(async () => {
    const [club, match] = await Promise.all([loadClub(slug), getPublicMatch(slug, matchId)]);
    const documents = tab === "emarque" ? await listPublicMatchDocuments(slug, matchId) : null;
    return { club, match, documents };
  }, [slug, matchId, tab]);
  if (load.error) return <Failure error={load.error} offline={load.offline} />;
  if (!load.data) return <Loading />;
  const { club, match, documents } = load.data;
  return (
    <PageContainer width="wide" className="gap-6">
      <BackButton href={`/public/${slug}/matchs`} label="Retour aux matchs" />
      {/* Lien de convocation (#convocation) : la réponse de la famille AVANT le détail du match. */}
      {tab === "informations" && hash === "#convocation" ? <PublicMatchFamilyBlock clubSlug={slug} matchId={matchId} timezone={club.timezone} /> : null}
      <MatchDetailView
        match={match}
        derogation={null}
        documents={documents}
        tab={tab}
        basePath={`/public/${slug}/matchs`}
        club={{ name: club.name, logoUrl: club.logoUrl }}
        derogationClubId={club.slug}
        mode="public"
        isAdmin={false}
        playerBasePath={`/public/${slug}/joueurs`}
      />
      {tab === "informations" && hash !== "#convocation" ? <PublicMatchFamilyBlock clubSlug={slug} matchId={matchId} timezone={club.timezone} /> : null}
      {tab === "informations" ? <PublicMatchTeamLifeBlock clubSlug={slug} matchId={matchId} timezone={club.timezone} /> : null}
      {tab === "informations" ? <PublicMatchRequestBlock clubSlug={slug} matchId={matchId} /> : null}
      {tab === "informations" ? <PublicOfficialDerogationBlock clubSlug={slug} matchId={matchId} /> : null}
    </PageContainer>
  );
}

export function ResultsScreen() {
  const slug = useSlug();
  const [params] = useSearchParams();
  const load = useLoad(async () => {
    const now = new Date();
    const [club, matches, standings] = await Promise.all([loadClub(slug), listPublicMatches(slug, { from: currentSeasonStart(now).toISOString(), to: now.toISOString() }), listPublicStandings(slug).catch(() => [])]);
    return { club, groups: buildResultGroups(matches, standings, club.name, now) };
  }, [slug]);
  if (load.error) return <Failure error={load.error} offline={load.offline} />;
  if (!load.data) return <Loading />;
  const { club, groups } = load.data;
  return (
    <PageContainer width="wide">
      <PageHeader eyebrow={club.name} title="Résultats" description="Scores de la saison et classements FFBB, équipe par équipe." />
      <ResultsView groups={groups} selectedKey={params.get("equipe")} basePath={`/public/${slug}/resultats`} matchBasePath={`/public/${slug}/matchs`} club={{ name: club.name, logoUrl: club.logoUrl }} />
    </PageContainer>
  );
}

export function DerogationsScreen() {
  const slug = useSlug();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer>
      <PublicDerogationsApp clubSlug={slug} clubName={club.data.name} />
    </PageContainer>
  );
}

export function NewDerogationScreen() {
  const slug = useSlug();
  const [params] = useSearchParams();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer width="wide">
      <PublicNewRequestPage clubSlug={slug} clubName={club.data.name} initialMatchId={params.get("match")} />
    </PageContainer>
  );
}

export function DerogationScreen() {
  const slug = useSlug();
  const { requestId = "" } = useParams<{ requestId: string }>();
  const [params] = useSearchParams();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer>
      <PublicRequestThreadPage clubSlug={slug} clubName={club.data.name} requestId={requestId} justSent={params.get("sent") === "1"} />
    </PageContainer>
  );
}

export function TablesScreen() {
  const slug = useSlug();
  const club = useLoad(() => loadClub(slug), [slug]);
  if (club.error) return <Failure error={club.error} offline={club.offline} />;
  if (!club.data) return <Loading />;
  return (
    <PageContainer width="wide">
      <PublicTablesApp clubSlug={slug} clubTimezone={club.data.timezone} />
    </PageContainer>
  );
}

export function TableLeaderboardScreen() {
  const slug = useSlug();
  const load = useLoad(() => getTableLeaderboard(slug), [slug]);
  if (load.error) return <Failure error={load.error} offline={load.offline} />;
  if (!load.data) return <Loading />;
  return (
    <PageContainer>
      <PageHeader back={{ href: `/public/${slug}/tables`, label: "Tables de marque" }} eyebrow="Tables de marque" title="Classement" description="Tables tenues cette saison (matchs passés). Merci à toutes et tous !" />
      <TableLeaderboard leaderboard={load.data} playerBasePath={`/public/${slug}/joueurs`} />
    </PageContainer>
  );
}

export function PlayerScreen() {
  const slug = useSlug();
  const { licencieId = "" } = useParams<{ licencieId: string }>();
  const load = useLoad(async () => ({ club: await loadClub(slug), profile: await getPublicPlayer(slug, licencieId) }), [slug, licencieId]);
  if (load.error) return <Failure error={load.error} offline={load.offline} />;
  if (!load.data) return <Loading />;
  return (
    <PageContainer className="gap-6">
      <BackButton href={`/public/${slug}/matchs`} label="Retour aux matchs" />
      <PublicPlayerProfile profile={load.data.profile} clubName={load.data.club.name} matchBasePath={`/public/${slug}/matchs`} />
    </PageContainer>
  );
}
