import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicDerogationsApp } from "@/features/public-derogations/PublicDerogationsApp";

/**
 * Onglet Dérogations de l'espace public sans compte (retour du club,
 * 2026-10-01) — réservé aux licenciés administrateurs du club, reconnus par
 * leur lien personnel. Le club est déjà validé par le layout.
 */
export default async function PublicDerogationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);

  return (
    <PageContainer width="default">
      <PublicDerogationsApp clubSlug={clubSlug} clubName={club.name} />
    </PageContainer>
  );
}
