import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
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
 * depuis cet outil une fois confirmé. Tout le reste de cette page reste de
 * la consultation (voir docs/FBI.md côté club-manager-api).
 */
export default async function DerogationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const derogations = await api.derogations.list(club.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Dérogations</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Demandes de dérogation FBI connues pour {club.name}. Utilise « Vérifier toutes les dérogations » sur la page
          Intégrations → FBI pour rafraîchir cette liste. Une dérogation marquée « Action requise » peut être acceptée
          ou refusée directement ici — action réelle transmise à la FFBB, jamais annulable depuis cet outil.
        </p>
      </div>

      <DerogationsList clubId={club.id} clubSlug={clubSlug} derogations={derogations} />
    </div>
  );
}
