import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicHomeApp } from "@/features/public-home/PublicHomeApp";

/**
 * Accueil personnel de l'espace public (retour du club, 2026-10-01) : le
 * coach voit l'agenda de ses équipes, le joueur son équipe, chacun ses
 * tables de marque — via son lien personnel, sans compte.
 */
export default async function PublicHomePage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);
  return (
    <PageContainer width="wide">
      <PublicHomeApp clubSlug={clubSlug} club={{ name: club.name, logoUrl: club.logoUrl, timezone: club.timezone }} />
    </PageContainer>
  );
}
