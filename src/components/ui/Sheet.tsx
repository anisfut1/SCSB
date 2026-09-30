"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { Portal } from "./Portal";

/**
 * Sheet/Drawer générique : feuille remontant du bas en mobile (poignée,
 * safe-area), panneau latéral droit sur desktop. Focus déplacé à l'ouverture
 * et restauré à la fermeture, Échap ferme, défilement du fond bloqué.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "bottom";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const desktopSide = side === "right";

  return (
    <Portal>
      <div
        className={cn(
          "fixed inset-0 z-[60] flex items-end justify-center",
          desktopSide && "sm:items-stretch sm:justify-end",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fermer"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-[rgb(23_23_26/0.28)] backdrop-blur-[2px] [animation:fade-in_var(--duration-base)_var(--ease-out)]"
        />

        <div
          ref={panelRef}
          tabIndex={-1}
          className={cn(
            "relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] border border-b-0 border-border bg-surface shadow-4 outline-none [animation:sheet-up_var(--duration-slow)_var(--ease-out)]",
            desktopSide
              ? "sm:h-[calc(100dvh-16px)] sm:max-h-none sm:w-[460px] sm:self-center sm:rounded-[var(--radius-xl)] sm:border-b sm:mr-2 sm:[animation:sheet-left_var(--duration-slow)_var(--ease-out)]"
              : "sm:mb-4 sm:max-w-lg sm:rounded-[var(--radius-xl)] sm:border-b",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong",
              desktopSide && "sm:hidden",
            )}
          />
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 pb-3 pt-3 sm:pt-4">
            <div className="text-reflow">
              <h2 id={titleId} className="type-section text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="type-meta mt-0.5">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground sm:size-9"
            >
              <X className="size-[18px]" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {children}
          </div>
          {footer ? (
            <div className="pb-safe shrink-0 border-t border-border bg-surface-raised px-5 py-3">
              {footer}
            </div>
          ) : (
            <div className="pb-safe shrink-0" />
          )}
        </div>
      </div>
    </Portal>
  );
}
