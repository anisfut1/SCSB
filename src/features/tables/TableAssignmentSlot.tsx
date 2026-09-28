"use client";

import { TriangleAlert, UserRound } from "lucide-react";
import type { TableAssignmentRole, TableAssignmentSlotDto } from "@/lib/api/tables";
import { TABLE_ROLE_LABELS } from "./role-labels";

/**
 * Un des 3 postes d'un match (§65/§66 de la demande) : affecté (avec
 * éventuel conflit détecté, jamais corrigé automatiquement — §45/§79) ou
 * "À attribuer". Purement présentationnel ; l'ouverture du panneau de
 * suggestions et le retrait sont pilotés par `TableMatchCard`.
 */
export function TableAssignmentSlot({
  role,
  slot,
  onChoose,
  onRemove,
  removing,
}: {
  role: TableAssignmentRole;
  slot: TableAssignmentSlotDto | null;
  onChoose: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-lg border p-3 ${slot?.hasConflict ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30" : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{TABLE_ROLE_LABELS[role]}</span>
        {slot?.hasConflict ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
            Conflit détecté
          </span>
        ) : null}
      </div>

      {slot ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-black/90 dark:text-white/90">
                {slot.licencie.firstName} {slot.licencie.lastName}
              </span>
              {slot.hasConflict && slot.conflictReason ? <span className="text-xs text-red-700 dark:text-red-400">{slot.conflictReason}</span> : null}
              {!slot.hasConflict && slot.teams.length > 0 ? <span className="text-xs text-black/50 dark:text-white/50">{slot.teams.map((t) => t.name).join(", ")}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onChoose} className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
              {slot.hasConflict ? "Choisir un remplaçant" : "Modifier"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={removing}
              className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium text-black/60 hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:bg-white/10"
            >
              {removing ? "…" : "Retirer"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-black/40 dark:text-white/40">À attribuer</span>
          <button type="button" onClick={onChoose} className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
            Choisir
          </button>
        </div>
      )}
    </div>
  );
}
