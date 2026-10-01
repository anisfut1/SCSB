import { requireClubContext } from "@/lib/tenancy/club-context";
import { isClubAdmin } from "@/lib/permissions/roles";
import { api } from "@/lib/api/server";
import { currentSeasonStart } from "@/lib/season";
import { getShellIdentity } from "@/components/shell/session";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ResultsView } from "@/features/results/ResultsView";
import { buildResultGroups } from "@/features/results/result-groups";

/**
 * Résultats + classements FFBB dans l'espace club (retour du club,
 * 2026-10-01 : « ici aussi quand même dans le menu me faut le classement,
 * c'est pas only public »). Même vue que l'onglet public, données lues via
 * les routes authentifiées (tout membre du club).
 */
export default async function ClubResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const equipe = (await searchParams).equipe;
  const club = await requireClubContext(clubSlug);
  const now = new Date();

  const [identity, matches, standings] = await Promise.all([
    getShellIdentity(),
    api.matches.list(club.id, { from: currentSeasonStart(now).toISOString(), to: now.toISOString() }),
    api.standings.list(club.id).catch(() => []),
  ]);

  const clubName = club.shortName ?? club.name;
  const groups = buildResultGroups(matches, standings, clubName, now);

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow={club.name} title="Résultats" description="Scores de la saison et classements FFBB, équipe par équipe." />
      <ResultsView
        groups={groups}
        selectedKey={typeof equipe === "string" ? equipe : null}
        basePath={`/c/${clubSlug}/resultats`}
        matchBasePath={`/c/${clubSlug}/matchs`}
        club={{ name: clubName, logoUrl: club.logoUrl, showDerogation: isClubAdmin(club.roles) || identity.isPlatformAdmin }}
      />
    </PageContainer>
  );
}
