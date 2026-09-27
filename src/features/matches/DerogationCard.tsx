"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import type { DerogationStatusDto } from "@/lib/api/matches";
import { RespondToDerogationAction } from "@/features/derogations/RespondToDerogationAction";

type Status = { kind: "success" | "error" | "pending"; text: string };

/**
 * `demandeur` ("Domicile"/"Visiteur") est un jargon FBI relatif à CETTE
 * rencontre précise, jamais toujours "notre équipe" — demande du club,
 * 2026-09-27 : "c ecrit demandeur domicile mais je sais pas cest qui qui
 * joue à domicile". Résolu vers le nom réel via `domicile`/`visiteur`
 * (mêmes champs bruts FBI), jamais deviné.
 */
function resolveDemandeurTeam(derogation: { demandeur: string | null; domicile: string | null; visiteur: string | null }): string | null {
  if (derogation.demandeur === "Domicile") return derogation.domicile;
  if (derogation.demandeur === "Visiteur") return derogation.visiteur;
  return null;
}

/**
 * Consultation de l'état d'une dérogation FBI pour ce match (demande du
 * club, voir docs/FBI.md côté club-manager-api : "faut qu'on gere les
 * derog depuis l'outil"). `isAdmin` uniquement (même verrou que POST
 * .../derogation/check côté API).
 *
 * Depuis 2026-09-27 ("je veux le faire via loutil"), une dérogation "En
 * Cours" attendant une décision DU CLUB (`derogation.actionRequired`)
 * affiche aussi le bouton Accepter/Refuser (`RespondToDerogationAction`)
 * — ÉCRIT réellement sur FBI/FFBB, jamais annulable depuis cet outil.
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
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2">
          Dérogation
          {derogation?.actionRequired ? (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">Action requise</span>
          ) : null}
        </span>
      }
    >
      {derogation ? (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-black/60 dark:text-white/60">État</dt>
              <dd>{derogation.etat ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Demandeur</dt>
              <dd>
                {derogation.demandeur ?? "—"}
                {resolveDemandeurTeam(derogation) ? ` (${resolveDemandeurTeam(derogation)})` : ""}
              </dd>
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
              <dd>{new Date(derogation.checkedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</dd>
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

          {isAdmin && derogation.actionRequired && derogation.id ? <RespondToDerogationAction clubId={clubId} derogationId={derogation.id} /> : null}
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
