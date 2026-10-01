import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicNewRequestPage } from "@/features/public-derogations/PublicRequestPages";

/** Nouvelle demande de dérogation depuis l'espace public (coach désigné depuis /joueurs). */
export default async function PublicNewDerogationRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);
  const match = (await searchParams).match;
  return (
    <PageContainer width="wide">
      <PublicNewRequestPage clubSlug={clubSlug} clubName={club.name} initialMatchId={typeof match === "string" ? match : null} />
    </PageContainer>
  );
}
