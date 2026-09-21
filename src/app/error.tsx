"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
      <p className="max-w-sm text-sm text-black/60 dark:text-white/60">
        Quelque chose s&apos;est mal passé. Réessaie, et préviens le club si le problème persiste.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Réessayer
      </button>
    </div>
  );
}
