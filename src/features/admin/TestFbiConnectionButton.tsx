"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

type Status = { kind: "success"; text: string } | { kind: "error"; text: string } | { kind: "pending"; text: string };

/**
 * §21 de la demande : le chemin synchrone (`HttpFbiClient`) répond
 * directement. En secours (structure de page FBI changée), l'API répond
 * `202 { jobId }` : on interroge alors `GET /v1/jobs/:jobId` via
 * `pollJobUntilTerminal` (src/lib/api/jobs.ts) — intervalle raisonnable,
 * jamais un polling infini.
 */
export function TestFbiConnectionButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status | null>(null);

  function handleClick() {
    startTransition(async () => {
      setStatus({ kind: "pending", text: "Test de connexion en cours…" });

      try {
        const result = await browserApi.integrations.testFbi(clubId);

        if (result.jobId) {
          setStatus({ kind: "pending", text: "Test de connexion en cours (vérification approfondie)…" });
          const job = await browserApi.jobs.pollUntilTerminal(result.jobId);

          if (job.status === "succeeded") {
            setStatus({ kind: "success", text: "Connexion FBI réussie ✅" });
          } else if (job.status === "failed") {
            setStatus({ kind: "error", text: job.lastError ?? "Connexion FBI impossible." });
          } else {
            setStatus({ kind: "pending", text: "Toujours en cours — réessaie dans quelques instants." });
          }
        } else if (result.success) {
          setStatus({ kind: "success", text: result.message });
        } else {
          setStatus({ kind: "error", text: result.message });
        }

        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Connexion FBI impossible." });
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
        {isPending ? "Test en cours…" : "Tester la connexion"}
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
