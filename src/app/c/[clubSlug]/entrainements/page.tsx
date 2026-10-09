import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { requireAnyClubRoleContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ClubTrainingsApp } from "@/features/team-life/ClubTrainingsApp";
import { teamDisplayName } from "@/features/team-life/labels";
import { TEAM_LIFE_MANAGER_ROLES } from "@/features/team-life/roles";

export const metadata: Metadata = { title: "Entraînements" };

/** Entraînements (Vie d'équipe, Lot 1) : planifier les créneaux, suivre les réponses, annuler / modifier une séance. */
export default async function ClubTrainingsPage({ params, searchParams }: { params: Promise<{ clubSlug: string }>; searchParams: Promise<{ equipe?: string; seance?: string }> }) {
  const [{ clubSlug }, query] = await Promise.all([params, searchParams]);
  const club = await requireAnyClubRoleContext(clubSlug, TEAM_LIFE_MANAGER_ROLES);
  const teams = (await api.clubs.teams(club.id)).filter((t) => t.active).map((t) => ({ id: t.id, name: teamDisplayName(t) }));
  return (
    <PageContainer className="gap-6">
      <PageHeader
        eyebrow={club.name}
        title="Entraînements"
        description="Les créneaux de chaque équipe et les réponses des joueurs."
        actions={
          <ButtonLink href={`/c/${clubSlug}/planning`} variant="ghost" icon={<CalendarRange />}>
            Planning
          </ButtonLink>
        }
      />
      <ClubTrainingsApp clubId={club.id} timezone={club.timezone} teams={teams} initialTeamId={query.equipe ?? null} initialOccurrenceId={query.seance ?? null} />
    </PageContainer>
  );
}
