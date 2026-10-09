import type { Metadata } from "next";
import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicPlanningApp } from "@/features/team-life/PublicPlanningApp";

export const metadata: Metadata = { title: "Planning" };

/** Planning personnel (Vie d'équipe, Lot 1) : matchs + entraînements des équipes de l'appareil. */
export default async function PublicPlanningPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);
  return (
    <PageContainer>
      <PublicPlanningApp clubSlug={clubSlug} club={{ name: club.name, timezone: club.timezone }} />
    </PageContainer>
  );
}
