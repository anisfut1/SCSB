"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * Rend les calques (sheet, modale) hors de l'arbre local : une carte
 * (`.surface-card`, `isolation: isolate` + `transform` au survol) crée un
 * contexte d'empilement qui piégerait un `position: fixed`. Cible
 * `#overlay-root` (posé par l'AppShell, hérite donc de `--club-accent*`),
 * sinon `document.body`. Utilisé uniquement quand le calque est ouvert
 * (jamais au rendu serveur).
 */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.getElementById("overlay-root") ?? document.body);
}
