"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { DerogationListItemDto } from "@/lib/api/derogations";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

/**
 * "sur la page dérogation met moi un filtre avec des boutons pour choisir
 * par état" — les boutons sont générés DYNAMIQUEMENT à partir des `etat`
 * réellement présents dans la liste reçue de club-manager-api (jamais un
 * libellé FBI deviné/codé en dur : voir docs/FBI.md côté club-manager-api,
 * les vraies valeurs — "En Cours", "Acceptée par...", "Refusée" — ne sont
 * connues qu'à l'exécution). Filtre 100% client (la liste complète est déjà
 * chargée), aucun aller-retour serveur par clic.
 */
export function DerogationsList({ clubSlug, derogations }: { clubSlug: string; derogations: DerogationListItemDto[] }) {
  const [selectedEtat, setSelectedEtat] = useState<string | null>(null);

  const etatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const derogation of derogations) {
      if (!derogation.etat) continue;
      counts.set(derogation.etat, (counts.get(derogation.etat) ?? 0) + 1);
    }
    // Tri alphabétique — pas d'ordre de priorité FBI connu/confirmé, jamais deviné.
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [derogations]);

  const filtered = selectedEtat === null ? derogations : derogations.filter((d) => d.etat === selectedEtat);

  if (derogations.length === 0) {
    return (
      <Card title="Aucune dérogation connue">
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Lance une vérification globale depuis Intégrations → FBI pour récupérer les demandes de dérogation connues
          de FBI.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <FilterButton active={selectedEtat === null} onClick={() => setSelectedEtat(null)}>
          Toutes ({derogations.length})
        </FilterButton>
        {etatCounts.map(([etat, count]) => (
          <FilterButton key={etat} active={selectedEtat === etat} onClick={() => setSelectedEtat(etat)}>
            {etat} ({count})
          </FilterButton>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {filtered.length === 0 ? (
          <Card title="Aucune dérogation pour cet état">
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">Choisis un autre filtre ci-dessus.</p>
          </Card>
        ) : (
          filtered.map((derogation) => (
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
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
                      Réponse de l&apos;adversaire
                    </p>
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
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-black/15 text-black/70 hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
