"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./cn";
import { Portal } from "./Portal";

/**
 * Modale centrée (alertdialog) pour les confirmations destructives —
 * remplace `window.confirm` avec le même contrat bloquant côté appelant.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={cancelLabel}
          onClick={onCancel}
          className="absolute inset-0 cursor-default bg-[rgb(23_23_26/0.32)] backdrop-blur-[2px] [animation:fade-in_var(--duration-base)_var(--ease-out)]"
        />
        <div className="pb-safe relative w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface-raised p-5 shadow-4 [animation:rise-in_var(--duration-slow)_var(--ease-out)] sm:p-6">
          <div className="flex items-start gap-4">
            {destructive ? (
              <span
                aria-hidden
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-[color-mix(in_oklab,var(--danger)_22%,transparent)] bg-danger-soft text-danger"
              >
                <AlertTriangle className="size-[18px]" />
              </span>
            ) : null}
            <div className="text-reflow flex flex-col gap-1.5">
              <h2 id={titleId} className="type-section text-foreground">
                {title}
              </h2>
              {description ? (
                <div
                  id={descId}
                  className="text-[13.5px] leading-relaxed text-muted"
                >
                  {description}
                </div>
              ) : null}
            </div>
          </div>
          <div
            className={cn(
              "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
            )}
          >
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? "danger" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
}

/**
 * `const [confirm, confirmDialog] = useConfirm();` puis
 * `if (!(await confirm({...}))) return;` et rendre `{confirmDialog}`.
 */
export function useConfirm(): [
  (options: ConfirmOptions) => Promise<boolean>,
  ReactNode,
] {
  const [state, setState] = useState<
    (ConfirmOptions & { resolve: (value: boolean) => void }) | null
  >(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ ...options, resolve });
      }),
    [],
  );

  const close = useCallback((value: boolean) => {
    setState((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const onCancel = useCallback(() => close(false), [close]);
  const onConfirm = useCallback(() => close(true), [close]);

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      title={state?.title ?? ""}
      description={state?.description}
      confirmLabel={state?.confirmLabel}
      destructive={state?.destructive}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return [confirm, dialog];
}
