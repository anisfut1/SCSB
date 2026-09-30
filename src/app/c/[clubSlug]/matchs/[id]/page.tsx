import { notFound } from "next/navigation";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { isClubAdmin } from "@/lib/permissions/roles";
import { PageContainer, BackButton } from "@/components/ui/PageHeader";
import { MatchDetailView } from "@/features/matches/detail/MatchDetailView";
import { parseMatchTab } from "@/features/matches/detail/labels";
import type { DerogationStatusDto, MatchDetailsDto } from "@/lib/api/matches";

/**
 * §15 de la demande : toutes les données viennent de
 * `GET /v1/clubs/:clubId/matches/:matchId` (+ `.../documents` pour la liste
 * e-Marque, dont l'URL de téléchargement est déjà signée côté backend pour
 * un club_admin — voir docs/API.md). Aucun accès Supabase direct, jamais un
 * client service role ici : ce composant ne sait même plus qu'un bucket
 * Storage existe.
 */
export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug, id } = await params;
  const club = await requireClubContext(clubSlug);
  const isAdmin = isClubAdmin(club.roles);
  const tab = parseMatchTab((await searchParams).tab);

  let match: MatchDetailsDto;
  let derogation: DerogationStatusDto | null;
  try {
    [match, derogation] = await Promise.all([api.matches.get(club.id, id), api.matches.derogation(club.id, id)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  // Documents chargés uniquement pour l'onglet e-Marque (comme avant).
  const documents = tab === "emarque" ? await api.matches.documents(club.id, id) : null;

  return (
    <PageContainer width="wide" className="gap-6">
      <BackButton href={`/c/${clubSlug}/matchs`} label="Retour aux matchs" />
      <MatchDetailView
        match={match}
        derogation={derogation}
        documents={documents}
        tab={tab}
        basePath={`/c/${clubSlug}/matchs`}
        club={{ name: club.name, logoUrl: club.logoUrl }}
        derogationClubId={club.id}
        mode="club"
        isAdmin={isAdmin}
        playerBasePath={`/c/${clubSlug}/joueurs`}
      />
    </PageContainer>
  );
}
