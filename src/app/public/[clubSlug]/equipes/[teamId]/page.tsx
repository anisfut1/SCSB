import type { Metadata } from "next";
import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicTeamPageApp } from "@/features/team-life/PublicTeamPageApp";
import { teamTabOf } from "@/features/team-life/team-tab";

export const metadata: Metadata = { title: "Équipe" };

/** Page Équipe (Vie d'équipe, Lot 4) — joueurs de l'équipe et ceux qui la gèrent (lien personnel). */
export default async function PublicTeamPage({ params, searchParams }: { params: Promise<{ clubSlug: string; teamId: string }>; searchParams: Promise<{ vue?: string }> }) {
  const [{ clubSlug, teamId }, query] = await Promise.all([params, searchParams]);
  const club = await getPublicClub(clubSlug);
  return (
    <PageContainer className="gap-6">
      <PublicTeamPageApp clubSlug={clubSlug} teamId={teamId} timezone={club.timezone} tab={teamTabOf(query.vue)} />
    </PageContainer>
  );
}
