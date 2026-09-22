"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/**
 * §9/§22 de la demande : Client Component → club-manager-api directement
 * (JWT Supabase), jamais un Server Action qui reproduirait un mini-backend
 * Next.js. `router.refresh()` recharge les Server Components de la page
 * (dernière synchro affichée) après l'appel, sans navigation complète.
 */
export function TriggerFfbbSyncButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await browserApi.integrations.triggerFfbbSync(clubId);
        setMessage({ success: true, text: `Synchronisation terminée (${result.status}).` });
        router.refresh();
      } catch (error) {
        setMessage({
          success: false,
          text: error instanceof ApiError ? error.message : "Synchronisation impossible. Réessaie.",
        });
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
        {isPending ? "Synchronisation…" : "Relancer maintenant"}
      </button>
      {message ? (
        <p role="status" className={`text-sm ${message.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
