"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";

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
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" size="sm" onClick={handleClick} loading={isPending} icon={<CheckCheck />}>
        Marquer comme vérifié
      </Button>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
    </div>
  );
}
