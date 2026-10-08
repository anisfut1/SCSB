import { getTableLeaderboard } from "@/lib/api/publicTables";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { TableLeaderboard } from "@/features/tables/TableLeaderboard";

/** Classement des tables de marque, visible de tous sans identification (retour du club, 2026-10-08). */
export default async function PublicTableLeaderboardPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const leaderboard = await getTableLeaderboard(clubSlug);

  return (
    <PageContainer width="default">
      <PageHeader back={{ href: `/public/${clubSlug}/tables`, label: "Tables de marque" }} eyebrow="Tables de marque" title="Classement" description="Tables tenues cette saison (matchs passés). Merci à toutes et tous !" />
      <TableLeaderboard leaderboard={leaderboard} playerBasePath={`/public/${clubSlug}/joueurs`} />
    </PageContainer>
  );
}
