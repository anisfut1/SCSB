"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

/** Interrupteur accessible (`role=switch`), cible tactile 44 px. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  name,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <label className={cn("flex min-h-11 items-center justify-between gap-4", disabled && "opacity-60")}>
      <span className="text-reflow">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? <span className="type-meta block">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-150",
          checked ? "border-accent-border bg-accent shadow-glow-xs" : "border-border-strong bg-surface-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full bg-surface-raised shadow-2 transition-transform duration-150 ease-out",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </label>
  );
}
