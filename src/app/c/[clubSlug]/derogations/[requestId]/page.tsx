import { notFound } from "next/navigation";
import { requireAnyClubRoleContext } from "@/lib/tenancy/club-context";
import { DEROGATION_REQUEST_ROLES } from "@/lib/permissions/roles";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { BackButton, PageContainer } from "@/components/ui/PageHeader";
import { RequestThread } from "@/features/derogation-requests/RequestThread";
import type { DerogationContextDto, DerogationRequestDetailDto } from "@/lib/api/derogationRequests";

/** Conversation d'une demande de dérogation interne. */
export default async function DerogationRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; requestId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug, requestId } = await params;
  const club = await requireAnyClubRoleContext(clubSlug, DEROGATION_REQUEST_ROLES);
  let request: DerogationRequestDetailDto;
  let context: DerogationContextDto;
  try {
    [request, context] = await Promise.all([api.derogationRequests.get(club.id, requestId), api.derogationRequests.context(club.id)]);
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) notFound();
    throw error;
  }
  const sent = (await searchParams).sent === "1";

  return (
    <PageContainer className="gap-5">
      <BackButton href={`/c/${clubSlug}/derogations`} label="Dérogations" />
      <RequestThread key={request.id} clubId={club.id} initial={request} timezone={context.timezone} venues={context.venues} justSent={sent} />
    </PageContainer>
  );
}
