"use client";

import type { ReactNode } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { MatchAvailabilityValue, TrainingResponseValue } from "@/lib/api/teamLife";
import { RESPONSE_ORDER, responseLabel } from "./labels";

type Tone = "success" | "danger" | "warning";

const ACTIVE: Record<Tone, string> = {
  success: "border-success/40 bg-success-soft text-success",
  danger: "border-danger/40 bg-danger-soft text-danger",
  warning: "border-warning/40 bg-warning-soft text-warning",
};

export interface Choice<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  tone: Tone;
}

/**
 * Réponse en un geste (cible ≥ 44 px, mobile d'abord). La réponse choisie
 * reste visible et peut être changée. `aria-pressed` annonce l'état.
 */
export function ChoiceButtons<T extends string>({ choices, value, onChange, disabled, label }: { choices: Choice<T>[]; value: T | null; onChange: (value: T) => void; disabled?: boolean; label: string }) {
  return (
    <div role="group" aria-label={label} className={cn("grid gap-2 sm:max-w-lg", choices.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(choice.value)}
            className={cn(
              "inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-[12px] border px-2 text-[14px] font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
              // 3 choix : icônes masquées et texte un peu plus petit sur petit écran (« Indisponible » entier) ;
              // 2 choix : le libellé peut passer sur deux lignes (« Lina ne pourra pas venir »).
              choices.length === 3 ? "max-[399px]:px-1 max-[399px]:text-[13px] max-[399px]:[&_svg]:hidden" : "h-auto min-h-11 py-2 leading-tight",
              selected ? cn(ACTIVE[choice.tone], "shadow-1") : "border-border bg-surface-raised text-foreground hover:bg-surface-muted active:bg-surface-muted",
            )}
          >
            <span aria-hidden className="inline-flex">
              {choice.icon}
            </span>
            <span className={choices.length === 3 ? "truncate" : "text-center"}>{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const TRAINING_CHOICES: Choice<TrainingResponseValue>[] = RESPONSE_ORDER.map((v) => ({
  value: v,
  label: responseLabel(v),
  icon: v === "PRESENT" ? <Check /> : v === "ABSENT" ? <X /> : <HelpCircle />,
  tone: v === "PRESENT" ? "success" : v === "ABSENT" ? "danger" : "warning",
}));

/** Entraînement : Présent·e / Absent·e / Incertain·e. */
export function ResponseButtons({ value, onChange, disabled, label }: { value: TrainingResponseValue | null; onChange: (value: TrainingResponseValue) => void; disabled?: boolean; label: string }) {
  return <ChoiceButtons choices={TRAINING_CHOICES} value={value} onChange={onChange} disabled={disabled} label={label} />;
}

const AVAILABILITY_CHOICES: Choice<MatchAvailabilityValue>[] = [
  { value: "AVAILABLE", label: "Disponible", icon: <Check />, tone: "success" },
  { value: "UNAVAILABLE", label: "Indisponible", icon: <X />, tone: "danger" },
  { value: "UNCERTAIN", label: "Incertain·e", icon: <HelpCircle />, tone: "warning" },
];

/** Match : Disponible / Indisponible / Incertain·e (≠ convocation). */
export function AvailabilityButtons({ value, onChange, disabled, label }: { value: MatchAvailabilityValue | null; onChange: (value: MatchAvailabilityValue) => void; disabled?: boolean; label: string }) {
  return <ChoiceButtons choices={AVAILABILITY_CHOICES} value={value} onChange={onChange} disabled={disabled} label={label} />;
}
