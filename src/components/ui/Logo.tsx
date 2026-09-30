import { monogram } from "@/lib/ui/accent";
import { cn } from "./cn";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizes: Record<LogoSize, { box: string; text: string }> = {
  xs: { box: "size-6 rounded-[7px]", text: "text-[9px]" },
  sm: { box: "size-8 rounded-[9px]", text: "text-[11px]" },
  md: { box: "size-10 rounded-[11px]", text: "text-[13px]" },
  lg: { box: "size-14 rounded-[14px]", text: "text-base" },
  xl: { box: "size-20 rounded-[18px]", text: "text-xl" },
};

/**
 * Logo d'équipe/club : image réelle en `object-contain` sur un socle neutre
 * (jamais déformée), sinon monogramme typographique. `alt` vide car le nom
 * est toujours affiché à côté.
 */
export function TeamLogo({
  name,
  src,
  size = "md",
  accent = false,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: LogoSize;
  accent?: boolean;
  className?: string;
}) {
  const s = sizes[size];
  if (src) {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-raised p-[12%] shadow-[var(--shadow-inset-highlight),var(--shadow-1)]", s.box, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logos distants hétérogènes (FFBB/Storage) */}
        <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "type-numeric inline-flex shrink-0 select-none items-center justify-center border font-semibold tracking-tight shadow-[var(--shadow-inset-highlight)]",
        accent ? "border-accent-border bg-accent-soft text-accent-text" : "border-border bg-surface-muted text-muted",
        s.box,
        s.text,
        className,
      )}
    >
      {monogram(name ?? "")}
    </span>
  );
}

/** Logo du club courant : monogramme teinté par l'accent si pas d'image. */
export function ClubLogo(props: { name: string; src?: string | null; size?: LogoSize; className?: string }) {
  return <TeamLogo {...props} accent />;
}
