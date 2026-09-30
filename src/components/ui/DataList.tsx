import type { ReactNode } from "react";
import { cn } from "./cn";

export interface DataItem {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  span?: 2;
}

/**
 * Liste de définitions (métadonnées) : libellé discret au-dessus, valeur
 * lisible dessous. Une valeur absente est affichée explicitement (« — »),
 * jamais remplacée par une valeur supposée.
 */
export function DataList({ items, columns = 2, className }: { items: DataItem[]; columns?: 1 | 2 | 3; className?: string }) {
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" } as const;
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4", cols[columns], className)}>
      {items.map((item, index) => (
        <div key={index} className={cn("flex min-w-0 flex-col gap-1", item.span === 2 && "sm:col-span-2")}>
          <dt className="flex items-center gap-1.5 text-[12.5px] text-muted [&_svg]:size-3.5 [&_svg]:text-subtle">
            {item.icon ? <span aria-hidden className="inline-flex">{item.icon}</span> : null}
            {item.label}
          </dt>
          <dd className="text-reflow text-sm text-foreground">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
