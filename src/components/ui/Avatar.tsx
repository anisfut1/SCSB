import { monogram } from "@/lib/ui/accent";
import { cn } from "./cn";

const sizes = { sm: "size-9 text-[12px]", md: "size-11 text-[13px]", lg: "size-16 text-lg", xl: "size-20 text-xl" } as const;

/** Photo de personne (cover, ronde) ou initiales en repli. `alt` vide : le nom est toujours affiché à côté. */
export function PersonAvatar({ name, src, size = "sm", className }: { name: string; src?: string | null; size?: keyof typeof sizes; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL de photo arbitraire fournie par le club, hors domaines Next configurés
      <img src={src} alt="" loading="lazy" className={cn("shrink-0 rounded-full border border-border object-cover shadow-1", sizes[size], className)} />
    );
  }
  return (
    <span aria-hidden className={cn("type-numeric inline-flex shrink-0 select-none items-center justify-center rounded-full border border-border bg-surface-muted font-semibold text-muted shadow-[var(--shadow-inset-highlight)]", sizes[size], className)}>
      {monogram(name)}
    </span>
  );
}
