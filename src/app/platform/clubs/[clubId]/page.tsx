import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ClubAdminsManager } from "@/features/platform/ClubAdminsManager";

/** Un club vu par l'opérateur de la plateforme : ses administrateurs (retour du club, 2026-10-08). Accès platform_admin vérifié par le layout /platform et par l'API. */
export default async function PlatformClubPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  let data;
  try {
    data = await api.platform.clubMembers(clubId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  return (
    <PageContainer width="default">
      <PageHeader
        back={{ href: "/platform/clubs", label: "Clubs" }}
        eyebrow="Plateforme · Club"
        title={data.club.name}
        description="Qui administre ce club. Un administrateur a accès à toute la gestion du club dans son espace."
        actions={
          <ButtonLink href={`/c/${data.club.slug}/dashboard`} variant="secondary" iconRight={<ArrowUpRight />}>
            Ouvrir l&apos;espace du club
          </ButtonLink>
        }
      />
      <ClubAdminsManager initial={data} />
    </PageContainer>
  );
}
