import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicRequestThreadPage } from "@/features/public-derogations/PublicRequestPages";

/** Conversation d'une demande de dérogation depuis l'espace public (lien personnel). */
export default async function PublicDerogationRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; requestId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug, requestId } = await params;
  const club = await getPublicClub(clubSlug);
  const sent = (await searchParams).sent === "1";
  return (
    <PageContainer width="default">
      <PublicRequestThreadPage clubSlug={clubSlug} clubName={club.name} requestId={requestId} justSent={sent} />
    </PageContainer>
  );
}
