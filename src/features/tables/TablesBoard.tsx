"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TableAssignmentsForMatchDto } from "@/lib/api/tables";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { Toast } from "@/components/ui/Toast";
import { TableMatchCard } from "./TableMatchCard";
import { clubTablesClient } from "./tables-client";

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
  const client = useMemo(() => clubTablesClient(clubId), [clubId]);

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
    return <EmptyState icon={<ClipboardList />} title="Aucun match à domicile cette journée" description="Changez de journée pour préparer les tables d'un autre week-end." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {toast ? <Toast message={toast} /> : null}
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        {matches.map((match) => (
          <TableMatchCard key={match.match.id} client={client} match={match} onChanged={handleChanged} />
        ))}
      </div>
    </div>
  );
}
