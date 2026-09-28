"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

type Status = { kind: "success" | "error" | "pending"; text: string };

// Mêmes garde-fous que ProcessFbiJobsButton.tsx (voir sa doc pour
// l'incident anti-bot du 2026-09-24 qui les a rendus obligatoires) —
// réutilisés ici pour la MÊME raison : constaté en production le
// 2026-09-27/28, "j'ai fait la verif manuelle" / "ca marche tjr pas" —
// un seul appel `process-jobs` ne traite qu'UN job (`CLUB_JOB_BATCH_SIZE`
// côté club-manager-api), qui peut être n'importe quel autre job plus
// ancien du club (un check_derogation resté en attente, etc.), jamais
// forcément le check_all_derogations que CE clic vient d'empiler — le
// club devait alors recliquer à l'aveugle sans savoir combien de fois.
// Boucler ici (comme ProcessFbiJobsButton) vide la file DANS CE MÊME clic
// jusqu'à ce qu'il n'y ait plus rien à traiter, jamais un simple appel
// unique.
const MAX_ROUNDS = 100;
const ROUND_DELAY_MS = 5_000;
const MAX_CONSECUTIVE_FULL_FAILURES = 2;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
          // 409 CHECK_ALL_DEROGATIONS_ALREADY_QUEUED) — pas bloquant, la
          // boucle ci-dessous le traitera de toute façon. Toute autre
          // erreur reste bloquante.
          if (!(error instanceof ApiError) || error.status !== 409) throw error;
          alreadyQueued = true;
        }

        let claimed = 0;
        let succeeded = 0;
        let failed = 0;
        let consecutiveFullFailures = 0;
        let stoppedOnCircuitBreaker = false;

        for (let round = 0; round < MAX_ROUNDS; round += 1) {
          if (round > 0) await delay(ROUND_DELAY_MS);

          setStatus({ kind: "pending", text: claimed > 0 ? `Vérification en cours… (${claimed} job${claimed > 1 ? "s" : ""} traité${claimed > 1 ? "s" : ""} jusqu'ici)` : "Vérification en cours…" });

          const result = await browserApi.integrations.processFbiJobs(clubId);
          claimed += result.claimed;
          succeeded += result.succeeded;
          failed += result.failed;

          if (result.claimed === 0) break;

          consecutiveFullFailures = result.succeeded === 0 ? consecutiveFullFailures + 1 : 0;
          if (consecutiveFullFailures >= MAX_CONSECUTIVE_FULL_FAILURES) {
            stoppedOnCircuitBreaker = true;
            break;
          }
        }

        if (claimed === 0) {
          setStatus({ kind: "success", text: alreadyQueued ? "Rien à traiter dans l'immédiat — la vérification est peut-être déjà terminée, voir la page Dérogations." : "Vérification empilée." });
        } else {
          const parts = [`${claimed} job${claimed > 1 ? "s" : ""} traité${claimed > 1 ? "s" : ""}`];
          if (failed > 0) parts.push(`${failed} en échec`);
          if (stoppedOnCircuitBreaker) parts.push("arrêté après plusieurs échecs consécutifs — vérifie le statut FBI avant de recliquer");
          parts.push("liste mise à jour sur la page Dérogations");
          setStatus({ kind: failed > 0 && succeeded === 0 ? "error" : "success", text: parts.join(", ") + "." });
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
