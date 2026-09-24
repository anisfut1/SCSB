"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/** Même filet de sécurité que ProcessFbiJobsButton — voir son commentaire pour le détail du raisonnement. */
const MAX_ROUNDS = 100;

type Status = { kind: "pending" | "success" | "error"; text: string };

/**
 * Deuxième étape, séparée de `ProcessFbiJobsButton` : télécharger un
 * document e-Marque ne le transforme pas en composition/stats/officiels
 * affichables — il faut le parser (OCR/PDF). Sans ce bouton, un document
 * reste "Téléchargé" indéfiniment, en attendant le cron quotidien
 * `/internal/cron/emarque-parse` (voir docs/FBI.md côté club-manager-api).
 *
 * Relance automatiquement tant que le lot renvoyé est plein (§10 de la
 * demande : "je ne veux pas avoir à appuyer 200 fois") — un seul clic
 * traite toute la file tant que l'onglet reste ouvert.
 */
export function ParseFbiDocumentsButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status | null>(null);

  function handleClick() {
    startTransition(async () => {
      let candidatesExamined = 0;
      let imported = 0;
      let errors = 0;

      try {
        for (let round = 0; round < MAX_ROUNDS; round += 1) {
          setStatus({ kind: "pending", text: candidatesExamined > 0 ? `Traitement en cours… (${candidatesExamined} documents traités jusqu'ici)` : "Traitement en cours…" });

          const result = await browserApi.integrations.parseFbiDocuments(clubId);
          candidatesExamined += result.candidatesExamined;
          imported += result.imported;
          errors += result.errors;

          if (result.candidatesExamined === 0) break;
        }

        if (candidatesExamined === 0) {
          setStatus({ kind: "success", text: "Rien à parser pour l'instant." });
        } else {
          const parts = [`${candidatesExamined} document${candidatesExamined > 1 ? "s" : ""} traité${candidatesExamined > 1 ? "s" : ""}`];
          if (imported > 0) parts.push(`${imported} importé${imported > 1 ? "s" : ""}`);
          if (errors > 0) parts.push(`${errors} en échec`);
          setStatus({ kind: errors > 0 ? "error" : "success", text: parts.join(", ") + "." });
        }

        router.refresh();
      } catch (error) {
        setStatus({
          kind: "error",
          text: `${candidatesExamined} document${candidatesExamined > 1 ? "s" : ""} traités avant l'erreur : ${error instanceof ApiError ? error.message : "traitement impossible."}`,
        });
        router.refresh();
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
