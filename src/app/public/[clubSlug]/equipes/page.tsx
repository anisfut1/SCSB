import type { Metadata } from "next";
import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicTeamsApp } from "@/features/team-life/PublicTeamsApp";

export const metadata: Metadata = { title: "Équipe" };

/** Onglet « Équipe » : page de l'équipe (ou choix s'il y en a plusieurs sur l'appareil). */
export default async function PublicTeamsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);
  return (
    <PageContainer className="gap-6">
      <PublicTeamsApp clubSlug={clubSlug} clubName={club.name} />
    </PageContainer>
  );
}
