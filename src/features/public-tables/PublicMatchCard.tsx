"use client";

import { useState } from "react";
import { Hand, House, MapPin, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { FormMessage } from "@/components/ui/Field";
import { PersonAvatar } from "@/components/ui/Avatar";
import { useConfirm } from "@/components/ui/Dialog";
import { cn } from "@/components/ui/cn";
import { Card } from "@/components/ui/Card";
import { deletePublicTableAssignment, putPublicTableAssignment, type PublicTableAssignmentsForMatchDto, type TableAssignmentRole } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";
import { formatMatchDateTime, matchDateParts } from "@/features/matches/match-display";
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
  const [confirm, confirmDialog] = useConfirm();

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
    const ok = await confirm({ title: "Te retirer de ce poste ?", description: `Te retirer de ce poste (${TABLE_ROLE_LABELS[role]}) ?`, confirmLabel: "Me retirer", destructive: true });
    if (!ok) return;
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

  const parts = matchDateParts(match.match.matchDatetime);

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-[12px] border border-border bg-surface py-2">
          <span className="type-eyebrow">{parts?.weekday ?? "—"}</span>
          <span className="type-numeric text-xl font-medium leading-tight text-foreground">{parts?.time ?? "--:--"}</span>
        </div>
        <div className="text-reflow flex-1">
          <h2 className="type-card text-foreground">
            {match.match.teamName ?? "Équipe"} <span className="font-normal text-muted">vs</span> {match.match.opponentName ?? "?"}
          </h2>
          <div className="type-meta mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatMatchDateTime(match.match.matchDatetime)}</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0 text-subtle" aria-hidden />
              {match.match.venueLabel ?? "Lieu à confirmer"}
            </span>
          </div>
        </div>
        <StatusBadge tone="accent" icon={<House />} size="sm" className="hidden sm:inline-flex">
          Domicile
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TABLE_ROLES.map((role) => {
          const slot = slotByRole[role];
          const isMe = slot?.licencie.id === meId;
          const refereeSkipped = role === "REFEREE" && match.refereeNotNeeded;
          const busy = pendingRole === role;

          return (
            <div
              key={role}
              className={cn(
                "flex flex-col gap-2 rounded-[var(--radius-md)] border p-3",
                slot?.hasConflict
                  ? "border-[color-mix(in_oklab,var(--danger)_28%,transparent)] bg-danger-soft"
                  : isMe
                    ? "border-accent-border bg-accent-softer shadow-glow-xs"
                    : slot
                      ? "border-border bg-surface-raised"
                      : "border-dashed border-border-strong bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="type-eyebrow">{TABLE_ROLE_LABELS[role]}</span>
                {slot?.hasConflict ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-danger">
                    <TriangleAlert className="size-3.5" aria-hidden />
                    Conflit détecté
                  </span>
                ) : null}
              </div>

              {refereeSkipped && !slot ? (
                <p className="type-meta flex items-center gap-2">
                  <ShieldCheck aria-hidden className="size-4 shrink-0 text-success" />
                  Arbitre officiel FFBB déjà désigné — aucune affectation nécessaire.
                </p>
              ) : slot ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PersonAvatar name={`${slot.licencie.firstName} ${slot.licencie.lastName}`} size="sm" />
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-medium text-foreground">
                        {slot.licencie.firstName} {slot.licencie.lastName}
                        {isMe ? <span className="text-accent-text"> (toi)</span> : ""}
                      </span>
                      {slot.hasConflict && slot.conflictReason ? <span className="text-xs text-danger">{slot.conflictReason}</span> : null}
                    </div>
                  </div>
                  {isMe ? (
                    <Button variant="secondary" size="sm" loading={busy} onClick={() => remove(role)}>
                      Se retirer
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <UserRound className="size-4 text-subtle" aria-hidden />À attribuer
                  </span>
                  <Button variant="primary" size="sm" loading={busy} onClick={() => choose(role)} icon={<Hand />}>
                    Se positionner
                  </Button>
                </div>
              )}

              {roleError?.role === role ? <FormMessage tone="danger">{roleError.message}</FormMessage> : null}
            </div>
          );
        })}
      </div>
      {confirmDialog}
    </Card>
  );
}
