"use client";

import { Check, HelpCircle, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { TrainingResponseValue } from "@/lib/api/teamLife";
import { RESPONSE_ORDER, responseLabel } from "./labels";

const ICONS: Record<TrainingResponseValue, typeof Check> = { PRESENT: Check, ABSENT: X, UNCERTAIN: HelpCircle };

const ACTIVE: Record<TrainingResponseValue, string> = {
  PRESENT: "border-success/40 bg-success-soft text-success",
  ABSENT: "border-danger/40 bg-danger-soft text-danger",
  UNCERTAIN: "border-warning/40 bg-warning-soft text-warning",
};

/**
 * Présent / Absent / Incertain en un geste (cible ≥ 44 px, mobile d'abord).
 * La réponse choisie reste visible et peut être changée tant que la séance
 * n'a pas commencé. `aria-pressed` annonce l'état.
 */
export function ResponseButtons({ value, onChange, disabled, label }: { value: TrainingResponseValue | null; onChange: (value: TrainingResponseValue) => void; disabled?: boolean; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-2 sm:max-w-lg">
      {RESPONSE_ORDER.map((option) => {
        const Icon = ICONS[option];
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-[12px] border px-2 text-[14px] font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0 max-[399px]:[&_svg]:hidden",
              selected ? cn(ACTIVE[option], "shadow-1") : "border-border bg-surface-raised text-foreground hover:bg-surface-muted active:bg-surface-muted",
            )}
          >
            <Icon aria-hidden />
            <span className="truncate">{responseLabel(option)}</span>
          </button>
        );
      })}
    </div>
  );
}
