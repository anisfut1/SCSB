"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <ErrorState
        className="w-full max-w-lg"
        title="Une erreur est survenue"
        description="Quelque chose s'est mal passé. Réessaie, et préviens le club si le problème persiste."
        action={
          <Button variant="primary" onClick={reset} icon={<RotateCcw />}>
            Réessayer
          </Button>
        }
      />
    </main>
  );
}
