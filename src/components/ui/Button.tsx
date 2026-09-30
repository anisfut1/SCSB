import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-ghost" | "success";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex max-w-full shrink-0 select-none items-center justify-center gap-2 text-center font-medium transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 active:scale-[0.98] [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(23_23_26/0.12),0_6px_16px_-8px_var(--club-accent-glow)] hover:bg-accent-hover hover:shadow-glow-sm",
  secondary: "border border-border bg-surface-raised text-foreground shadow-1 hover:border-border-strong hover:bg-surface",
  outline: "border border-border-strong bg-transparent text-foreground hover:bg-surface-raised hover:shadow-1",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  danger: "bg-danger text-white shadow-1 hover:bg-[color-mix(in_oklab,var(--danger)_88%,#000)]",
  "danger-ghost": "text-danger hover:bg-danger-soft",
  success: "bg-success text-white shadow-1 hover:bg-[color-mix(in_oklab,var(--success)_88%,#000)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 whitespace-nowrap rounded-[10px] px-3 text-[13px] [&_svg]:size-4",
  // hauteur minimale (et non fixe) : un libellé long passe à la ligne au lieu de déborder en mobile
  md: "min-h-11 rounded-md px-4 py-2 text-sm leading-snug sm:min-h-10 [&_svg]:size-[18px]",
  lg: "min-h-12 rounded-md px-5 py-2.5 text-[15px] leading-snug [&_svg]:size-5",
};

export function buttonClasses({ variant = "secondary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

export function Button({ variant, size, icon, iconRight, loading, className, children, disabled, type = "button", ...props }: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses({ variant, size, className })} {...props}>
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

export function ButtonLink({ variant, size, icon, iconRight, className, children, ...props }: Omit<CommonProps, "loading"> & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

const iconSizes: Record<ButtonSize, string> = {
  sm: "size-9 rounded-[10px] [&_svg]:size-4",
  md: "size-11 rounded-md sm:size-10 [&_svg]:size-[18px]",
  lg: "size-12 rounded-md [&_svg]:size-5",
};

/** Bouton icône seul : `label` est obligatoire (nom accessible). */
export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: { label: string; variant?: ButtonVariant; size?: ButtonSize } & Omit<ComponentProps<"button">, "aria-label">) {
  return (
    <button type={type} aria-label={label} title={label} className={cn(base, variants[variant], iconSizes[size], "px-0", className)} {...props}>
      {children}
    </button>
  );
}
