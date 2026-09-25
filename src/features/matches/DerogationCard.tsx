"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import type { DerogationStatusDto } from "@/lib/api/matches";

type Status = { kind: "success" | "error" | "pending"; text: string };

/**
 * Consultation en LECTURE SEULE de l'état d'une dérogation FBI pour ce
 * match (demande du club, voir docs/FBI.md côté club-manager-api : "faut
 * qu'on gere les derog depuis l'outil", phase 1). Jamais de soumission de
 * dérogation ici — uniquement une vérification de l'état déjà connu par
 * FBI, `isAdmin` uniquement (même verrou que POST .../derogation/check
 * côté API).
 */
export function DerogationCard({ clubId, matchId, derogation, isAdmin }: { clubId: string; matchId: string; derogation: DerogationStatusDto | null; isAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status | null>(null);

  function handleCheck() {
    startTransition(async () => {
      setStatus({ kind: "pending", text: "Vérification en cours…" });

      try {
        await browserApi.matches.checkDerogation(clubId, matchId);
        await browserApi.integrations.processFbiJobs(clubId);
        setStatus({ kind: "success", text: "Vérification terminée." });
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Vérification impossible." });
      }
    });
  }

  return (
    <Card title="Dérogation">
      {derogation ? (
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
      ) : (
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Aucune dérogation connue pour ce match pour l&apos;instant.
        </p>
      )}

      {isAdmin ? (
        <div className="mt-3 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={isPending}
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
          >
            {isPending ? "Vérification en cours…" : "Vérifier sur FBI"}
          </button>
          {status ? (
            <p
              role="status"
              className={`text-sm ${
                status.kind === "success" ? "text-green-700 dark:text-green-400" : status.kind === "error" ? "text-red-600 dark:text-red-400" : "text-black/60 dark:text-white/60"
              }`}
            >
              {status.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
