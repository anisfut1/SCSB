"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TableAssignmentsForMatchDto } from "@/lib/api/tables";
import { TableMatchCard } from "./TableMatchCard";

/**
 * Wrapper client de la vue "par journée" (§64 de la demande — une journée
 * de championnat = tout le week-end, samedi + dimanche) : centralise le
 * toast de confirmation ("Thomas Martin affecté comme marqueur.", §76) et
 * le `router.refresh()` après affectation/retrait, pour que le résumé de
 * la journée (calculé côté serveur dans page.tsx) reste toujours exact —
 * jamais de compteur mis à jour localement en divergence avec le serveur.
 */
export function TablesBoard({ clubId, matches }: { clubId: string; matches: TableAssignmentsForMatchDto[] }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  function handleChanged(message: string) {
    setToast(message);
    router.refresh();
  }

  if (matches.length === 0) {
    return <p className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">Aucun match à domicile cette journée.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {toast ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {toast}
        </p>
      ) : null}

      {matches.map((match) => (
        <TableMatchCard key={match.match.id} clubId={clubId} match={match} onChanged={handleChanged} />
      ))}
    </div>
  );
}
