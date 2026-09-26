import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { DerogationsList } from "@/features/admin/DerogationsList";

/**
 * "je veux un bouton global qui check toutes les demandes, pas match par
 * match" — liste toutes les dérogations FBI connues du club (dernier état
 * enregistré par le job `check_all_derogations`, déclenché depuis
 * Intégrations → FBI), chacune liée à son match FFBB correspondant. FFBB
 * reste la seule source des matchs — cette page ne fait qu'AFFICHER un état
 * déjà connu de FBI, jamais de soumission/modification de dérogation
 * (lecture seule, voir docs/FBI.md côté club-manager-api).
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
          Demandes de dérogation FBI connues pour {club.name} — lecture seule, jamais de soumission ni de modification
          depuis cet outil. Utilise « Vérifier toutes les dérogations » sur la page Intégrations → FBI pour rafraîchir
          cette liste.
        </p>
      </div>

      <DerogationsList clubSlug={clubSlug} derogations={derogations} />
    </div>
  );
}
