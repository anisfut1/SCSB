import { useId, type ComponentProps, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

const control =
  "w-full min-w-0 rounded-md border border-border-strong bg-surface-raised text-[16px] text-foreground shadow-[inset_0_1px_1px_rgb(23_23_26/0.04)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle hover:border-[color-mix(in_oklab,var(--foreground)_24%,transparent)] focus-visible:border-accent focus-visible:shadow-glow-xs focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted aria-invalid:border-danger aria-invalid:focus-visible:shadow-[0_0_0_3px_var(--danger-soft)] sm:text-sm";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11 px-3.5 sm:h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 px-3.5 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative flex w-full min-w-0">
      <select className={cn(control, "h-11 appearance-none pl-3.5 pr-10 sm:h-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </span>
  );
}

/**
 * Champ complet : libellé visible (jamais un placeholder seul), aide
 * persistante sous le champ, erreur reliée par `aria-describedby`.
 * `children` reçoit les props d'accessibilité à poser sur le contrôle.
 */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: true; required?: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-[13px] font-medium text-foreground">
        {label}
        {required ? <span className="text-danger" aria-hidden>*</span> : null}
        {optional ? <span className="text-xs font-normal text-muted">Optionnel</span> : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {hint && !error ? (
        <p id={hintId} className="type-meta">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Retour d'action inline (succès/erreur) — `role=status`, jamais un `alert()` navigateur. */
export function FormMessage({ tone, children, className }: { tone: "success" | "danger" | "info"; children: ReactNode; className?: string }) {
  const tones = { success: "text-success", danger: "text-danger", info: "text-info" };
  return (
    <p role={tone === "danger" ? "alert" : "status"} aria-live="polite" className={cn("text-[13px] font-medium leading-snug", tones[tone], className)}>
      {children}
    </p>
  );
}

/** Case à cocher native (accessible, cible 44 px) teintée par l'accent. */
export function Checkbox({ label, description, className, ...props }: { label: ReactNode; description?: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-start gap-3 py-2.5", props.disabled && "cursor-not-allowed opacity-60", className)}>
      <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-[5px] accent-[var(--club-accent)]" {...props} />
      <span className="text-reflow flex flex-col gap-0.5">
        <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
        {description ? <span className="type-meta">{description}</span> : null}
      </span>
    </label>
  );
}
