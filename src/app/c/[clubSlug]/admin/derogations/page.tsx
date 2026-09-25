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
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-black/60 dark:text-white/60">État</dt>
                  <dd>{derogation.etat ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-black/60 dark:text-white/60">Demandeur</dt>
                  <dd>{derogation.demandeur ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-black/60 dark:text-white/60">Rencontre initiale</dt>
                  <dd>
                    {derogation.dateRencontre ?? "—"} {derogation.heure ?? ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-black/60 dark:text-white/60">Rencontre demandée</dt>
                  <dd>
                    {derogation.dateRencontreDemandee ?? "—"} {derogation.heureDemandee ?? ""}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-black/60 dark:text-white/60">Motif de la demande</dt>
                  <dd>{derogation.motif ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-black/60 dark:text-white/60">Date de dérogation</dt>
                  <dd>{derogation.dateDerogation ?? "—"}</dd>
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

              {derogation.adversaire || derogation.dateReponse || derogation.acceptation || derogation.motifRefus ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">Réponse de l&apos;adversaire</p>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-black/60 dark:text-white/60">Adversaire</dt>
                      <dd>{derogation.adversaire ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-black/60 dark:text-white/60">Date de réponse</dt>
                      <dd>{derogation.dateReponse ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-black/60 dark:text-white/60">Acceptation</dt>
                      <dd>{derogation.acceptation ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-black/60 dark:text-white/60">Motif de refus</dt>
                      <dd>{derogation.motifRefus ?? "—"}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
