import type { Metadata } from "next";
import { getPublicClub } from "@/lib/api/publicTables";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicTrainingsApp } from "@/features/team-life/PublicTrainingsApp";

export const metadata: Metadata = { title: "Entraînements" };

/** Entraînements des équipes coachées (lien personnel) — mêmes écrans que l'espace club. */
export default async function PublicTrainingsPage({ params, searchParams }: { params: Promise<{ clubSlug: string }>; searchParams: Promise<{ equipe?: string; seance?: string }> }) {
  const [{ clubSlug }, query] = await Promise.all([params, searchParams]);
  const club = await getPublicClub(clubSlug);
  return (
    <PageContainer>
      <PublicTrainingsApp clubSlug={clubSlug} club={{ name: club.name, timezone: club.timezone }} initialTeamId={query.equipe ?? null} initialOccurrenceId={query.seance ?? null} />
    </PageContainer>
  );
}
