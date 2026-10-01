import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface SegmentItem {
  href: string;
  label: string;
  icon?: ReactNode;
  active: boolean;
}

/**
 * Contrôle segmenté piloté par l'URL (filtres partageables, retour arrière
 * préservé). Piste en creux, pastille active en relief.
 */
export function SegmentedControl({ items, label, className, size = "md" }: { items: SegmentItem[]; label: string; className?: string; size?: "sm" | "md" }) {
  return (
    <nav aria-label={label} className={cn("inline-flex min-w-0 max-w-full", className)}>
      <ul className="scrollbar-none flex w-full gap-0.5 overflow-x-auto rounded-[12px] border border-border bg-surface-muted p-0.5 shadow-[inset_0_1px_2px_rgb(23_23_26/0.05)]">
        {items.map((item) => (
          <li key={item.href} className="flex-1 shrink-0">
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-medium transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-4",
                size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-10 px-3.5 text-sm sm:h-9",
                item.active ? "bg-surface-raised text-foreground shadow-[var(--shadow-inset-highlight),var(--shadow-1),0_0_0_1px_var(--border)]" : "text-muted hover:text-foreground",
              )}
            >
              {item.icon ? <span aria-hidden className={cn("inline-flex", item.active ? "text-accent-text" : "")}>{item.icon}</span> : null}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
