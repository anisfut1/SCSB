"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/**
 * Deuxième étape, séparée de `ProcessFbiJobsButton` : télécharger un
 * document e-Marque ne le transforme pas en composition/stats/officiels
 * affichables — il faut le parser (OCR/PDF). Sans ce bouton, un document
 * reste "Téléchargé" indéfiniment, en attendant le cron quotidien
 * `/internal/cron/emarque-parse` (voir docs/FBI.md côté club-manager-api).
 */
export function ParseFbiDocumentsButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await browserApi.integrations.parseFbiDocuments(clubId);

        if (result.candidatesExamined === 0) {
          setStatus({ kind: "success", text: "Rien à parser pour l'instant." });
        } else {
          const parts = [`${result.candidatesExamined} document${result.candidatesExamined > 1 ? "s" : ""} traité${result.candidatesExamined > 1 ? "s" : ""}`];
          if (result.imported > 0) parts.push(`${result.imported} importé${result.imported > 1 ? "s" : ""}`);
          if (result.errors > 0) parts.push(`${result.errors} en échec`);
          setStatus({ kind: result.errors > 0 ? "error" : "success", text: parts.join(", ") + "." });
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
        {isPending ? "Traitement en cours…" : "Parser les documents téléchargés"}
      </button>

      {status ? (
        <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
