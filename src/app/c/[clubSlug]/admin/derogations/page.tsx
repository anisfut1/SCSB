import Link from "next/link";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

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

      {derogations.length === 0 ? (
        <Card title="Aucune dérogation connue">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Lance une vérification globale depuis Intégrations → FBI pour récupérer les demandes de dérogation
            connues de FBI.
          </p>
        </Card>
      ) : (
        derogations.map((derogation) => (
          <Card
            key={derogation.matchId}
            title={
              <Link href={`/c/${clubSlug}/matchs/${derogation.matchId}`} className="hover:underline">
                Rencontre {derogation.numero ?? "?"} — vs {derogation.opponentName ?? "?"}
              </Link>
            }
          >
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-black/60 dark:text-white/60">État</dt>
                <dd>{derogation.etat ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Date de dérogation</dt>
                <dd>{derogation.dateDerogation ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Rencontre concernée</dt>
                <dd>
                  {derogation.dateRencontre ?? "—"} {derogation.heure ?? ""}
                </dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Match FFBB</dt>
                <dd>{formatDateTime(derogation.matchDatetime)}</dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Dernière vérification</dt>
                <dd>{new Date(derogation.checkedAt).toLocaleString("fr-FR")}</dd>
              </div>
            </dl>
          </Card>
        ))
      )}
    </div>
  );
}
