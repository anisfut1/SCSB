import { getPublicClub } from "@/lib/api/publicTables";
import { listPublicMatches, listPublicStandings } from "@/lib/api/publicMatches";
import { currentSeasonStart } from "@/lib/season";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ResultsView } from "@/features/results/ResultsView";
import { buildResultGroups } from "@/features/results/result-groups";

/**
 * Onglet « Résultats » de l'espace public (retour du club, 2026-10-01 :
 * "mettre du coup les résultats qu'on a déjà, par catégorie, et même le
 * classement... dispo sur FFBB"). Lecture seule, aucune identité requise ;
 * le club est déjà validé par le layout.
 */
export default async function PublicResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const equipe = (await searchParams).equipe;
  const now = new Date();

  const [club, matches, standings] = await Promise.all([
    getPublicClub(clubSlug),
    listPublicMatches(clubSlug, { from: currentSeasonStart(now).toISOString(), to: now.toISOString() }),
    listPublicStandings(clubSlug).catch(() => []),
  ]);

  const groups = buildResultGroups(matches, standings, club.name, now);

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow={club.name} title="Résultats" description="Scores de la saison et classements FFBB, équipe par équipe." />
      <ResultsView
        groups={groups}
        selectedKey={typeof equipe === "string" ? equipe : null}
        basePath={`/public/${clubSlug}/resultats`}
        matchBasePath={`/public/${clubSlug}/matchs`}
        club={{ name: club.name, logoUrl: club.logoUrl }}
      />
    </PageContainer>
  );
}
