"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";

/** Erreur d'une page de l'espace club : affichée DANS le shell (navigation conservée). */
export default function ClubError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-[var(--content-default)] flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <ErrorState
        title="Cette page n'a pas pu être chargée"
        description="Quelque chose s'est mal passé. Réessaie, et préviens le club si le problème persiste."
        action={
          <Button variant="primary" onClick={reset} icon={<RotateCcw />}>
            Réessayer
          </Button>
        }
      />
    </div>
  );
}
