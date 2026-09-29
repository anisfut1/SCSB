"use client";

import { useState } from "react";
import { House, MapPin, TriangleAlert, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { deletePublicTableAssignment, putPublicTableAssignment, type PublicTableAssignmentsForMatchDto, type TableAssignmentRole } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";
import { formatMatchDateTime } from "@/features/matches/match-display";
import { TABLE_ROLES, TABLE_ROLE_LABELS } from "@/features/tables/role-labels";

/**
 * Card d'un match public (retour du club, 2026-09-29) : pas de panneau de
 * suggestions (le flux public n'est QUE de l'auto-affectation, jamais une
 * suggestion pour quelqu'un d'autre) — un poste vide se prend directement
 * ("Se positionner"), le sien se libère directement ("Se retirer"), et
 * celui de quelqu'un d'autre n'a AUCUNE action (ni "Modifier" ni
 * "Retirer") : c'est tout le sens de la demande.
 */
export function PublicMatchCard({
  clubSlug,
  token,
  meId,
  match,
  onChanged,
}: {
  clubSlug: string;
  token: string;
  meId: string;
  match: PublicTableAssignmentsForMatchDto;
  onChanged: (message: string) => void;
}) {
  const [pendingRole, setPendingRole] = useState<TableAssignmentRole | null>(null);
  const [roleError, setRoleError] = useState<{ role: TableAssignmentRole; message: string } | null>(null);

  const slotByRole = {
    SCORER: match.assignments.scorer,
    TIMEKEEPER: match.assignments.timekeeper,
    CLUB_DELEGATE: match.assignments.clubDelegate,
    REFEREE: match.assignments.referee,
  } as const;

  async function choose(role: TableAssignmentRole) {
    setPendingRole(role);
    setRoleError(null);
    try {
      await putPublicTableAssignment(clubSlug, token, match.match.id, role);
      onChanged(`Tu es positionné·e comme ${TABLE_ROLE_LABELS[role].toLowerCase()}.`);
    } catch (err) {
      setRoleError({ role, message: err instanceof ApiError ? err.message : "Impossible de te positionner." });
    } finally {
      setPendingRole(null);
    }
  }

  async function remove(role: TableAssignmentRole) {
    if (!window.confirm(`Te retirer de ce poste (${TABLE_ROLE_LABELS[role]}) ?`)) return;
    setPendingRole(role);
    setRoleError(null);
    try {
      await deletePublicTableAssignment(clubSlug, token, match.match.id, role);
      onChanged("Tu as été retiré·e de ce poste.");
    } catch (err) {
      setRoleError({ role, message: err instanceof ApiError ? err.message : "Retrait impossible." });
    } finally {
      setPendingRole(null);
    }
  }

  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2">
          <House className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
          {match.match.teamName ?? "Équipe"} vs {match.match.opponentName ?? "?"}
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
        {TABLE_ROLES.map((role) => {
          const slot = slotByRole[role];
          const isMe = slot?.licencie.id === meId;
          const refereeSkipped = role === "REFEREE" && match.refereeNotNeeded;
          const busy = pendingRole === role;

          return (
            <div
              key={role}
              className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
                slot?.hasConflict ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30" : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{TABLE_ROLE_LABELS[role]}</span>
                {slot?.hasConflict ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
                    Conflit détecté
                  </span>
                ) : null}
              </div>

              {refereeSkipped && !slot ? (
                <p className="text-sm text-black/40 dark:text-white/40">Arbitre officiel FFBB déjà désigné — aucune affectation nécessaire.</p>
              ) : slot ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium text-black/90 dark:text-white/90">
                        {slot.licencie.firstName} {slot.licencie.lastName}
                        {isMe ? " (toi)" : ""}
                      </span>
                      {slot.hasConflict && slot.conflictReason ? <span className="text-xs text-red-700 dark:text-red-400">{slot.conflictReason}</span> : null}
                    </div>
                  </div>
                  {isMe ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(role)}
                      className="shrink-0 rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium text-black/60 hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:bg-white/10"
                    >
                      {busy ? "…" : "Se retirer"}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-black/40 dark:text-white/40">À attribuer</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => choose(role)}
                    className="shrink-0 rounded-md bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
                  >
                    {busy ? "…" : "Se positionner"}
                  </button>
                </div>
              )}

              {roleError?.role === role ? <p className="text-xs text-red-600 dark:text-red-400">{roleError.message}</p> : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
