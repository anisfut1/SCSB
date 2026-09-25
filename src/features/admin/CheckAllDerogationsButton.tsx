"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

type Status = { kind: "success" | "error" | "pending"; text: string };

/**
 * "je veux un bouton global qui check toutes les demandes, pas match par
 * match" — empile UN SEUL job `check_all_derogations` (une seule connexion
 * FBI, recherche à numéro de rencontre VIDE) au lieu de vérifier chaque
 * match un par un (voir ProcessFbiJobsButton.tsx pour le risque anti-bot
 * déjà constaté avec des connexions FBI trop fréquentes). Consultation en
 * LECTURE SEULE — jamais de soumission/modification de dérogation vers FBI.
 * Les résultats apparaissent ensuite sur /admin/derogations.
 */
export function CheckAllDerogationsButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status | null>(null);

  function handleClick() {
    startTransition(async () => {
      setStatus({ kind: "pending", text: "Vérification en cours…" });

      try {
        let alreadyQueued = false;
        try {
          await browserApi.integrations.triggerCheckAllDerogations(clubId);
        } catch (error) {
          // Un job check_all_derogations est déjà en attente/en cours pour ce
          // club (contrainte unique fbi_jobs_unique_pending_all_derogations,
          // 409 CHECK_ALL_DEROGATIONS_ALREADY_QUEUED) — au lieu d'échouer
          // sèchement (constaté en production, 2026-09-25 : le club ne
          // savait pas qu'il fallait cliquer "Traiter les jobs FBI en
          // attente" — un bouton libellé pour l'e-Marque, jamais associé
          // aux dérogations dans son esprit), on tente quand même de faire
          // avancer la file : un job PLUS ANCIEN (une vérification match par
          // match restée en attente, par ex.) bloque souvent le nouveau tant
          // qu'il n'a pas été traité — un seul job à la fois par clic (voir
          // ProcessFbiJobsButton.tsx). Toute autre erreur reste bloquante.
          if (!(error instanceof ApiError) || error.status !== 409) throw error;
          alreadyQueued = true;
        }

        const result = await browserApi.integrations.processFbiJobs(clubId);

        if (result.succeeded > 0 && !alreadyQueued) {
          setStatus({ kind: "success", text: "Vérification terminée — voir le détail sur la page Dérogations." });
        } else if (result.succeeded > 0 && alreadyQueued) {
          setStatus({
            kind: "success",
            text: "Un job FBI en attente a été traité. Si le résultat sur la page Dérogations n'est pas encore à jour, reclique — la file avance d'un job à la fois.",
          });
        } else if (result.failed > 0) {
          setStatus({ kind: "error", text: "La vérification a échoué — voir la page Dérogations pour plus de détails." });
        } else if (alreadyQueued) {
          setStatus({ kind: "pending", text: "Rien à traiter dans l'immédiat — la vérification est peut-être déjà terminée, voir la page Dérogations." });
        } else {
          setStatus({ kind: "pending", text: "Vérification empilée — elle démarrera au prochain traitement des jobs FBI." });
        }

        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Vérification impossible." });
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
      >
        {isPending ? "Vérification en cours…" : "Vérifier toutes les dérogations"}
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
  );
}
