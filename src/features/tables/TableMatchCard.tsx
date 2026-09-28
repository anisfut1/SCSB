"use client";

import { useState } from "react";
import { House, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { TableAssignmentRole, TableAssignmentResultDto, TableAssignmentsForMatchDto } from "@/lib/api/tables";
import { formatMatchDateTime } from "@/features/matches/match-display";
import { TableAssignmentSlot } from "./TableAssignmentSlot";
import { TableSuggestionsSheet } from "./TableSuggestionsSheet";
import { TABLE_ROLES } from "./role-labels";

/**
 * Card d'un match à domicile avec ses 3 postes (§64-§66 de la demande).
 * Le rafraîchissement après affectation/retrait passe par `onChanged`
 * (fourni par `TablesBoard`, qui appelle `router.refresh()` + affiche un
 * toast) — jamais de ré-affectation locale silencieuse qui divergerait de
 * l'état réel côté serveur.
 */
export function TableMatchCard({ clubId, match, onChanged }: { clubId: string; match: TableAssignmentsForMatchDto; onChanged: (message: string) => void }) {
  const [openRole, setOpenRole] = useState<TableAssignmentRole | null>(null);
  const [removingRole, setRemovingRole] = useState<TableAssignmentRole | null>(null);

  const slotByRole = { SCORER: match.assignments.scorer, TIMEKEEPER: match.assignments.timekeeper, CLUB_DELEGATE: match.assignments.clubDelegate } as const;

  async function handleAssigned(role: TableAssignmentRole, result: TableAssignmentResultDto) {
    onChanged(`${result.assignment.licencie.firstName} ${result.assignment.licencie.lastName} affecté·e comme ${role === "SCORER" ? "marqueur" : role === "TIMEKEEPER" ? "chronométreur" : "délégué de club"}.`);
  }

  async function handleRemove(role: TableAssignmentRole) {
    const slot = slotByRole[role];
    if (!slot) return;
    if (!window.confirm(`Retirer l'affectation de ${slot.licencie.firstName} ${slot.licencie.lastName} ?`)) return;

    setRemovingRole(role);
    try {
      await browserApi.tables.unassign(clubId, match.match.id, role);
      onChanged("Affectation retirée — poste remis à « À attribuer ».");
    } catch (error) {
      onChanged(error instanceof ApiError ? error.message : "Retrait impossible.");
    } finally {
      setRemovingRole(null);
    }
  }

  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2">
          <House className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
          {match.match.teamName ?? "Équipe"} vs {match.match.opponentName ?? "?"}
          {match.hasConflict ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">Conflit</span> : null}
        </span>
      }
    >
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-black/60 dark:text-white/60">
        <span>{formatMatchDateTime(match.match.matchDatetime)}</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {match.match.venueLabel ?? "Lieu à confirmer"}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {TABLE_ROLES.map((role) => (
          <TableAssignmentSlot
            key={role}
            role={role}
            slot={slotByRole[role]}
            onChoose={() => setOpenRole(role)}
            onRemove={() => handleRemove(role)}
            removing={removingRole === role}
          />
        ))}
      </div>

      {openRole ? (
        <TableSuggestionsSheet
          clubId={clubId}
          matchId={match.match.id}
          role={openRole}
          open={openRole !== null}
          onClose={() => setOpenRole(null)}
          onAssigned={(result) => handleAssigned(openRole, result)}
        />
      ) : null}
    </Card>
  );
}
