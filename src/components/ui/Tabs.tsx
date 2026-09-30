import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface TabItem {
  href: string;
  label: string;
  icon?: ReactNode;
  active: boolean;
  count?: number;
}

/**
 * Onglets de navigation (URL = état, donc partageable et compatible
 * retour arrière). Onglet actif : texte fort, soulignement accent avec
 * micro-glow, `aria-current="page"`.
 */
export function TabsNav({ items, label, className }: { items: TabItem[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("-mx-4 border-b border-border px-4 sm:mx-0 sm:px-0", className)}>
      <ul className="scrollbar-none flex gap-1 overflow-x-auto">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "group relative flex h-11 items-center gap-2 rounded-t-md px-3 text-sm transition-colors duration-150 [&_svg]:size-4",
                item.active ? "font-medium text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {item.icon ? <span aria-hidden className={cn("inline-flex", item.active ? "text-accent-text" : "text-subtle group-hover:text-muted")}>{item.icon}</span> : null}
              {item.label}
              {item.count !== undefined ? (
                <span className={cn("type-numeric rounded-full px-1.5 text-[11px] leading-5", item.active ? "bg-accent-soft text-accent-text" : "bg-surface-muted text-muted")}>{item.count}</span>
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-opacity duration-150",
                  item.active ? "bg-accent opacity-100 shadow-[0_0_10px_var(--club-accent-glow)]" : "opacity-0",
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
