"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { PlugZap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionStatus } from "@/components/ui/ActionStatus";

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
            setStatus({ kind: "success", text: "Connexion FBI réussie." });
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
      <Button variant="secondary" onClick={handleClick} loading={isPending} icon={<PlugZap />}>
        {isPending ? "Test en cours…" : "Tester la connexion"}
      </Button>
      <ActionStatus status={status} />
    </div>
  );
}
