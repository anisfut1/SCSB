"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/**
 * "je ne veux pas avoir à appuyer 200 fois" (§10 de la demande) : chaque
 * appel ne traite qu'un petit lot (`CLUB_JOB_BATCH_SIZE`, côté
 * club-manager-api) — tant que le lot renvoyé est plein (`claimed > 0`),
 * il en reste probablement d'autres, donc on relance automatiquement DANS
 * CE MÊME clic, sans que l'admin ait à recliquer. Un seul clic vide toute
 * la file, tant que l'onglet reste ouvert (le fetch continue même en
 * arrière-plan) — `MAX_ROUNDS` est juste un filet de sécurité pour ne
 * jamais boucler indéfiniment si le backend renvoyait toujours `claimed >
 * 0` sans jamais vider la file (bug, ou file alimentée plus vite qu'elle
 * n'est vidée).
 */
const MAX_ROUNDS = 100;

type Status = { kind: "pending" | "success" | "error"; text: string };

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
  const [status, setStatus] = useState<Status | null>(null);

  function handleClick() {
    startTransition(async () => {
      let claimed = 0;
      let succeeded = 0;
      let failed = 0;

      try {
        for (let round = 0; round < MAX_ROUNDS; round += 1) {
          setStatus({ kind: "pending", text: claimed > 0 ? `Traitement en cours… (${claimed} jobs traités jusqu'ici)` : "Traitement en cours…" });

          const result = await browserApi.integrations.processFbiJobs(clubId);
          claimed += result.claimed;
          succeeded += result.succeeded;
          failed += result.failed;

          if (result.claimed === 0) break;
        }

        if (claimed === 0) {
          setStatus({ kind: "success", text: "Rien en attente pour l'instant." });
        } else {
          const parts = [`${claimed} job${claimed > 1 ? "s" : ""} traité${claimed > 1 ? "s" : ""}`];
          if (succeeded > 0) parts.push(`${succeeded} réussi${succeeded > 1 ? "s" : ""}`);
          if (failed > 0) parts.push(`${failed} en échec`);
          setStatus({ kind: failed > 0 ? "error" : "success", text: parts.join(", ") + "." });
        }

        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: `${claimed} job${claimed > 1 ? "s" : ""} traités avant l'erreur : ${error instanceof ApiError ? error.message : "traitement impossible."}` });
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
        {isPending ? "Traitement en cours…" : "Traiter les jobs FBI en attente"}
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
