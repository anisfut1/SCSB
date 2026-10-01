import { notFound } from "next/navigation";
import { getPublicClub } from "@/lib/api/publicTables";
import { getPublicMatch, listPublicMatchDocuments } from "@/lib/api/publicMatches";
import { ApiError } from "@/lib/api/client";
import { PageContainer, BackButton } from "@/components/ui/PageHeader";
import { MatchDetailView } from "@/features/matches/detail/MatchDetailView";
import { parseMatchTab } from "@/features/matches/detail/labels";
import type { MatchDetailsDto } from "@/lib/api/matches";

/**
 * Fiche match PUBLIQUE (retour du club, 2026-09-29 : "toutes les infos en
 * vue directe... sans les fonctions admin, et sans compte"). Mêmes onglets
 * que la vue authentifiée (MatchDetailView en `mode="public"`) : aucun
 * bouton d'action nulle part — voir club-manager-api/docs/PUBLIC_MATCHES.md.
 */
export default async function PublicMatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug, id } = await params;
  const tab = parseMatchTab((await searchParams).tab);

  let club;
  let match: MatchDetailsDto;
  try {
    // Aucune dérogation en vue publique (retour du club, 2026-10-01) : jamais chargée ici.
    [club, match] = await Promise.all([getPublicClub(clubSlug), getPublicMatch(clubSlug, id)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const documents = tab === "emarque" ? await listPublicMatchDocuments(clubSlug, id) : null;

  return (
    <PageContainer width="wide" className="gap-6">
      <BackButton href={`/public/${clubSlug}/matchs`} label="Retour aux matchs" />
      <MatchDetailView
        match={match}
        derogation={null}
        documents={documents}
        tab={tab}
        basePath={`/public/${clubSlug}/matchs`}
        club={{ name: club.name, logoUrl: club.logoUrl }}
        derogationClubId={club.slug}
        mode="public"
        isAdmin={false}
      />
    </PageContainer>
  );
}
