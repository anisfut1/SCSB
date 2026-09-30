import { cn } from "@/components/ui/cn";

/**
 * Marque de la plateforme : tracé abstrait de terrain (cercle central +
 * raquette) — géométrique, sans emoji ni ballon illustratif.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-foreground text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.18),var(--shadow-1)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="size-[62%]">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M3.5 12h17" />
        <path d="M3.5 6.5a5.5 5.5 0 0 1 0 11" />
        <path d="M20.5 6.5a5.5 5.5 0 0 0 0 11" />
      </svg>
    </span>
  );
}
