import { notFound } from "next/navigation";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { DEROGATION_REQUEST_ROLES, hasAnyRole, isClubAdmin } from "@/lib/permissions/roles";
import { getShellIdentity } from "@/components/shell/session";
import { PageContainer, BackButton } from "@/components/ui/PageHeader";
import { MatchDetailView } from "@/features/matches/detail/MatchDetailView";
import { parseMatchTab } from "@/features/matches/detail/labels";
import { MatchRequestCard } from "@/features/derogation-requests/MatchRequestCard";
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
  // Dérogations : club_admin ou platform_admin uniquement (jamais chargées sinon).
  const canSeeDerogation = isAdmin || (await getShellIdentity()).isPlatformAdmin;
  const tab = parseMatchTab((await searchParams).tab);

  let match: MatchDetailsDto;
  let derogation: DerogationStatusDto | null;
  try {
    [match, derogation] = await Promise.all([api.matches.get(club.id, id), canSeeDerogation ? api.matches.derogation(club.id, id) : Promise.resolve(null)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  // Demande de dérogation INTERNE (coach → coordinateur) : coachs, coordinateur, admin.
  // Bloc secondaire : une panne de ce module ne doit jamais casser la fiche match.
  const internal =
    tab === "informations" && hasAnyRole(club.roles, DEROGATION_REQUEST_ROLES)
      ? await Promise.all([api.derogationRequests.list(club.id, { matchId: id, limit: 5 }), api.derogationRequests.context(club.id)]).catch(() => null)
      : null;

  const internalCanCreate = internal ? internal[1].canCreate && internal[1].eligibleMatches.some((m) => m.id === id) : false;

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
        showDerogation={canSeeDerogation}
        derogationRequest={
          internal && (internal[0].requests.length > 0 || internalCanCreate) ? (
            <MatchRequestCard
              requests={internal[0].requests}
              canCreate={internalCanCreate}
              timezone={internal[1].timezone}
              basePath={`/c/${clubSlug}/derogations`}
              matchId={id}
            />
          ) : null
        }
      />
    </PageContainer>
  );
}
