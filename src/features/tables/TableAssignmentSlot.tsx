"use client";

import type { ReactNode } from "react";
import { ShieldCheck, TriangleAlert, UserPlus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PersonAvatar } from "@/components/ui/Avatar";
import { cn } from "@/components/ui/cn";
import type { TableAssignmentRole, TableAssignmentSlotDto } from "@/lib/api/tables";
import { TABLE_ROLE_LABELS } from "./role-labels";

/**
 * Un des postes d'un match (§65/§66 de la demande) : affecté (avec
 * éventuel conflit détecté, jamais corrigé automatiquement — §45/§79) ou
 * "À attribuer". Purement présentationnel ; l'ouverture du panneau de
 * suggestions et le retrait sont pilotés par `TableMatchCard`.
 *
 * `headerExtra`/`notice` : réservés au poste Arbitre (§ retour du club,
 * 2026-09-28 : "possibilité de cocher pas besoin d'arbitre") — `headerExtra`
 * porte la case à cocher, `notice` remplace le contenu habituel (affecté/à
 * attribuer) quand elle est cochée. `undefined` pour les 3 autres rôles :
 * ce composant reste sinon identique à avant leur ajout.
 */
export function TableAssignmentSlot({
  role,
  slot,
  onChoose,
  onRemove,
  removing,
  headerExtra,
  notice,
}: {
  role: TableAssignmentRole;
  slot: TableAssignmentSlotDto | null;
  onChoose: () => void;
  onRemove: () => void;
  removing: boolean;
  headerExtra?: ReactNode;
  notice?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-md)] border p-3 transition-colors duration-150",
        slot?.hasConflict ? "border-[color-mix(in_oklab,var(--danger)_28%,transparent)] bg-danger-soft" : slot ? "border-border bg-surface-raised" : "border-dashed border-border-strong bg-surface",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="type-eyebrow">{TABLE_ROLE_LABELS[role]}</span>
        <div className="flex items-center gap-3">
          {slot?.hasConflict ? (
            <span className="flex items-center gap-1 text-xs font-medium text-danger">
              <TriangleAlert className="size-3.5" aria-hidden />
              Conflit détecté
            </span>
          ) : null}
          {headerExtra}
        </div>
      </div>

      {notice ? (
        <p className="type-meta flex items-center gap-2">
          <ShieldCheck aria-hidden className="size-4 shrink-0 text-success" />
          {notice}
        </p>
      ) : slot ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <PersonAvatar name={`${slot.licencie.firstName} ${slot.licencie.lastName}`} src={slot.licencie.photoUrl} size="sm" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-foreground">
                {slot.licencie.firstName} {slot.licencie.lastName}
              </span>
              {slot.hasConflict && slot.conflictReason ? <span className="text-xs text-danger">{slot.conflictReason}</span> : null}
              {!slot.hasConflict && slot.teams.length > 0 ? <span className="type-meta truncate text-xs">{slot.teams.map((t) => t.name).join(", ")}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="secondary" size="sm" onClick={onChoose}>
              {slot.hasConflict ? "Choisir un remplaçant" : "Modifier"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove} loading={removing}>
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-muted">
            <UserRound className="size-4 text-subtle" aria-hidden />À attribuer
          </span>
          <Button variant="primary" size="sm" onClick={onChoose} icon={<UserPlus />}>
            Choisir
          </Button>
        </div>
      )}
    </div>
  );
}
