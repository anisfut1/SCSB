"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Primitive Sheet/Drawer générique, RÉUTILISABLE (§68 de la demande : "ne
 * pas créer un second design system") — pas de librairie externe, même
 * langage de tokens Tailwind que le reste de SCSB (border-black/10,
 * rounded-2xl, dark:, hover:bg-black/5). Panneau latéral sur desktop,
 * feuille remontant du bas sur mobile (§69/§73).
 *
 * Aucune primitive Sheet/Dialog n'existait avant ce module (le plus proche,
 * `CreateDerogationAction`, n'est qu'un formulaire déplié en place, jamais
 * un vrai overlay) — celle-ci est la première, pensée pour être réutilisée
 * par de futurs modules plutôt que redéveloppée à chaque fois.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900 sm:h-full sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold text-black/90 dark:text-white/90">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-md p-1.5 text-black/50 hover:bg-black/5 hover:text-black/90 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/90">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
