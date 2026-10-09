import type { Metadata } from "next";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { hasAnyRole } from "@/lib/permissions/roles";
import { PageContainer } from "@/components/ui/PageHeader";
import { ClubTeamPageApp } from "@/features/team-life/ClubTeamPageApp";
import { teamTabOf } from "@/features/team-life/team-tab";
import { TEAM_LIFE_MANAGER_ROLES } from "@/features/team-life/roles";

export const metadata: Metadata = { title: "Équipe" };

/** Page Équipe (Vie d'équipe, Lot 4) : Vue d'ensemble / Planning / Effectif. */
export default async function ClubTeamPage({ params, searchParams }: { params: Promise<{ clubSlug: string; teamId: string }>; searchParams: Promise<{ vue?: string }> }) {
  const [{ clubSlug, teamId }, query] = await Promise.all([params, searchParams]);
  const club = await requireClubContext(clubSlug);
  return (
    <PageContainer className="gap-6">
      <ClubTeamPageApp clubId={club.id} clubSlug={clubSlug} teamId={teamId} timezone={club.timezone} tab={teamTabOf(query.vue)} canManageTrainings={hasAnyRole(club.roles, TEAM_LIFE_MANAGER_ROLES)} />
    </PageContainer>
  );
}
