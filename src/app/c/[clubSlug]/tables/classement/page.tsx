import { requireClubContext } from "@/lib/tenancy/club-context";
import { getTableLeaderboard } from "@/lib/api/publicTables";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { TableLeaderboard } from "@/features/tables/TableLeaderboard";

/** Classement des tables de marque, espace club — même données que l'espace public (visible de tous, retour du club 2026-10-08). */
export default async function TableLeaderboardPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  await requireClubContext(clubSlug);
  const leaderboard = await getTableLeaderboard(clubSlug);

  return (
    <PageContainer width="default">
      <PageHeader back={{ href: `/c/${clubSlug}/tables`, label: "Tables de marque" }} eyebrow="Tables de marque" title="Classement" description="Tables tenues cette saison (matchs passés). Merci à toutes et tous !" />
      <TableLeaderboard leaderboard={leaderboard} playerBasePath={`/c/${clubSlug}/joueurs`} />
    </PageContainer>
  );
}
