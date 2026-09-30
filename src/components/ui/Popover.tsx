"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/**
 * Menu déroulant minimal (bouton + panneau) : Échap et clic extérieur
 * ferment, `aria-expanded` sur le déclencheur. Utilisé par le switcher
 * d'espace et le menu utilisateur.
 */
export function Popover({
  trigger,
  children,
  label,
  align = "start",
  side = "bottom",
  className,
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => ReactNode;
  children: (close: () => void) => ReactNode;
  label: string;
  align?: "start" | "end";
  side?: "bottom" | "top";
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v), "aria-expanded": open, "aria-haspopup": "menu" })}
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-50 min-w-full rounded-[14px] border border-border bg-surface-raised p-1.5 shadow-3 [animation:rise-in_var(--duration-base)_var(--ease-out)]",
            side === "bottom" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]",
            align === "start" ? "left-0" : "right-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export const menuItemClass =
  "flex min-h-10 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-sm text-foreground transition-colors duration-150 hover:bg-surface-muted focus-visible:bg-surface-muted [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted";
