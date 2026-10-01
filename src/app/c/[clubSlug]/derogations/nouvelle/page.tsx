import { requireAnyClubRoleContext } from "@/lib/tenancy/club-context";
import { DEROGATION_REQUEST_ROLES } from "@/lib/permissions/roles";
import { api } from "@/lib/api/server";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { RequestWizard } from "@/features/derogation-requests/RequestWizard";

/** Nouvelle demande de dérogation (coach) — `?match=<id>` pré-sélectionne le match (lien depuis le détail du match). */
export default async function NewDerogationRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const club = await requireAnyClubRoleContext(clubSlug, DEROGATION_REQUEST_ROLES);
  const context = await api.derogationRequests.context(club.id);
  const match = (await searchParams).match;

  return (
    <PageContainer width="wide" className="gap-6">
      <PageHeader back={{ href: `/c/${clubSlug}/derogations`, label: "Dérogations" }} eyebrow={club.name} title="Demander une dérogation" description="Choisis le match, la nouvelle date et un créneau libre : le coordinateur du club reçoit ta demande." />
      <RequestWizard clubId={club.id} clubSlug={clubSlug} context={context} initialMatchId={typeof match === "string" ? match : null} />
    </PageContainer>
  );
}
