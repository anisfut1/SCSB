import { RefreshCw } from "lucide-react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { DerogationsList } from "@/features/admin/DerogationsList";

/**
 * "je veux un bouton global qui check toutes les demandes, pas match par
 * match" — liste toutes les dérogations FBI connues du club (dernier état
 * enregistré par le job `check_all_derogations`, déclenché depuis
 * Intégrations → FBI), chacune liée à son match FFBB correspondant. FFBB
 * reste la seule source des matchs.
 *
 * Depuis 2026-09-27 ("je veux le faire via loutil"), une dérogation "En
 * Cours" attendant une décision DU CLUB (badge "Action requise") peut être
 * acceptée/refusée RÉELLEMENT depuis cette page (voir
 * `RespondToDerogationAction`) — ÉCRIT sur FBI/FFBB, jamais annulable
 * depuis cet outil une fois confirmé.
 */
export default async function DerogationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const derogations = await api.derogations.list(club.id);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Administration"
        title="Dérogations"
        description={`Demandes de dérogation FBI connues pour ${club.name}. Une dérogation marquée « Action requise » peut être acceptée ou refusée directement ici — action réelle transmise à la FFBB, jamais annulable depuis cet outil.`}
        actions={
          <ButtonLink href={`/c/${clubSlug}/admin/integrations/fbi`} variant="secondary" icon={<RefreshCw />}>
            Vérifier sur FBI
          </ButtonLink>
        }
      />
      <DerogationsList clubId={club.id} clubSlug={clubSlug} derogations={derogations} />
    </PageContainer>
  );
}
