import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { hasAnyRole } from "@/lib/permissions/roles";
import { api } from "@/lib/api/server";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ClubPlanningApp } from "@/features/team-life/ClubPlanningApp";
import { teamDisplayName } from "@/features/team-life/labels";
import { TEAM_LIFE_MANAGER_ROLES } from "@/features/team-life/roles";

export const metadata: Metadata = { title: "Planning" };

/** Planning du club (Vie d'équipe, Lot 1) : matchs FFBB + entraînements, toutes les équipes. */
export default async function ClubPlanningPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);
  const teams = (await api.clubs.teams(club.id)).filter((t) => t.active).map((t) => ({ id: t.id, name: teamDisplayName(t) }));
  const canManage = hasAnyRole(club.roles, TEAM_LIFE_MANAGER_ROLES);
  return (
    <PageContainer className="gap-6">
      <PageHeader
        eyebrow={club.name}
        title="Planning"
        description="Matchs et entraînements de toutes les équipes, semaine par semaine."
        actions={
          canManage ? (
            <ButtonLink href={`/c/${clubSlug}/entrainements`} variant="secondary" icon={<Dumbbell />}>
              Planifier les entraînements
            </ButtonLink>
          ) : null
        }
      />
      <ClubPlanningApp clubId={club.id} clubSlug={clubSlug} timezone={club.timezone} teams={teams} canManage={canManage} />
    </PageContainer>
  );
}
