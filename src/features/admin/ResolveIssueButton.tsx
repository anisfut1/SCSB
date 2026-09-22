"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/** §23 de la demande : `POST /v1/clubs/:clubId/issues/:matchId/resolve`, jamais un `UPDATE` Supabase direct. */
export function ResolveIssueButton({ clubId, matchId }: { clubId: string; matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        await browserApi.issues.resolve(clubId, matchId);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Action impossible. Réessaie.");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
      >
        {isPending ? "…" : "Marquer comme vérifié"}
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
