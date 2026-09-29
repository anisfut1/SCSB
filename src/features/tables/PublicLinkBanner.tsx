"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

/**
 * Rappel du lien commun à distribuer (retour du club, 2026-09-29 : "je vais
 * envoyer le lien à tout le monde"). Un seul lien, sans jeton — chacun
 * choisit ensuite son nom dans la liste (`ClaimView`) pour obtenir son
 * propre lien personnel.
 */
export function PublicLinkBanner({ clubSlug }: { clubSlug: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/public/${clubSlug}/tables`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible (permissions navigateur) — le lien reste affiché ci-dessous, copiable à la main.
    }
  }

  return (
    <Card title="Lien commun à distribuer">
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">Un seul lien pour tout le monde — chacun choisit ensuite son nom dans la liste.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-black/5 px-2 py-1 text-xs dark:bg-white/10">{path}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {copied ? "Copié !" : "Copier le lien"}
        </button>
      </div>
    </Card>
  );
}
