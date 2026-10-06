"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";

/** Relance la récupération de la feuille e-Marque d'un match : essai au prochain passage (≤ 15 min), puis 7 jours au calendrier fixe. */
export function RelaunchEmarqueButton({ clubId, matchId }: { clubId: string; matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await browserApi.emarqueTracking.relaunch(clubId, matchId);
        setDone(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Relance impossible. Réessaie.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button variant="secondary" size="sm" onClick={handleClick} loading={isPending} disabled={done} icon={<RotateCw />}>
        {done ? "Relancé" : "Relancer"}
      </Button>
      {done ? <FormMessage tone="success">Essai au prochain passage (moins de 15 min).</FormMessage> : null}
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
    </div>
  );
}
