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
        await browserApi.integrations.triggerCheckAllDerogations(clubId);
        const result = await browserApi.integrations.processFbiJobs(clubId);

        if (result.succeeded > 0) {
          setStatus({ kind: "success", text: "Vérification terminée — voir le détail sur la page Dérogations." });
        } else if (result.failed > 0) {
          setStatus({ kind: "error", text: "La vérification a échoué — voir la page Dérogations pour plus de détails." });
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
