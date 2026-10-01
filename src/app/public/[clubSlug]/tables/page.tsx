import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicTablesApp } from "@/features/public-tables/PublicTablesApp";

/**
 * Onglet Tables de l'espace public sans compte (retour du club,
 * 2026-09-29) — le club est déjà validé par le layout (404 sinon). Toute
 * la logique (identification, tableau) vit côté client.
 */
export default async function PublicTablesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);

  return (
    <PageContainer width="wide">
      <PublicTablesApp clubSlug={clubSlug} clubTimezone={club.timezone} />
    </PageContainer>
  );
}
