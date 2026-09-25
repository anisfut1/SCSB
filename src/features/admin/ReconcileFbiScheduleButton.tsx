"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

type Status = { kind: "success" | "error" | "pending"; text: string };

/**
 * Rapprochement calendrier FFBB/FBI (demande du club, voir docs/FBI.md
 * côté club-manager-api) — FFBB reste la SEULE source du calendrier,
 * cette vérification ne fait que DÉTECTER des anomalies (écarts de date/
 * heure, rencontres visibles d'un seul côté), jamais un remplacement.
 * Empile un job `reconcile_schedule` (file `fbi_jobs` existante) puis
 * appelle immédiatement `processFbiJobs` pour le faire avancer sans
 * attendre le cron quotidien — mêmes deux étapes que "Télécharger" plus
 * haut sur cette page. Les anomalies détectées apparaissent ensuite sur
 * /admin/issues.
 */
export function ReconcileFbiScheduleButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status | null>(null);

  function handleClick() {
    startTransition(async () => {
      setStatus({ kind: "pending", text: "Vérification en cours…" });

      try {
        await browserApi.integrations.triggerFbiScheduleReconciliation(clubId);
        const result = await browserApi.integrations.processFbiJobs(clubId);

        if (result.succeeded > 0) {
          setStatus({ kind: "success", text: "Vérification terminée — voir les anomalies éventuelles sur la page Anomalies." });
        } else if (result.failed > 0) {
          setStatus({ kind: "error", text: "La vérification a échoué — voir la page Anomalies e-Marque/FBI pour plus de détails." });
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
        {isPending ? "Vérification en cours…" : "Vérifier le calendrier (FFBB vs FBI)"}
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
