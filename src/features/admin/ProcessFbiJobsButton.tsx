"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/**
 * "FBI connecté" ne récupère rien tout seul : la connexion réussie prouve
 * juste que les identifiants sont valides, la récupération réelle des
 * documents e-Marque tourne comme des jobs `discover_emarque` en arrière-plan
 * (voir docs/FBI.md côté club-manager-api). Ces jobs dépendaient jusqu'ici
 * uniquement de `/internal/cron/fbi-jobs` (une fois par jour) — ce bouton
 * appelle `POST .../fbi/process-jobs`, qui traite un petit lot des jobs de
 * CE club DANS LA REQUÊTE, sans dépendre du cron ni du dashboard Vercel.
 */
export function ProcessFbiJobsButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await browserApi.integrations.processFbiJobs(clubId);

        if (result.claimed === 0) {
          setStatus({ kind: "success", text: "Rien en attente pour l'instant." });
        } else {
          const parts = [`${result.claimed} job${result.claimed > 1 ? "s" : ""} traité${result.claimed > 1 ? "s" : ""}`];
          if (result.succeeded > 0) parts.push(`${result.succeeded} réussi${result.succeeded > 1 ? "s" : ""}`);
          if (result.failed > 0) parts.push(`${result.failed} en échec`);
          setStatus({ kind: result.failed > 0 ? "error" : "success", text: parts.join(", ") + "." });
        }

        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Traitement impossible. Réessaie." });
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
        {isPending ? "Traitement en cours…" : "Traiter les jobs FBI en attente"}
      </button>

      {status ? (
        <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
