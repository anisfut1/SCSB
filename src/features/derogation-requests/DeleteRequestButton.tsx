"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { derogationClient, type DerogationSource } from "./client";

/**
 * Suppression DÉFINITIVE d'une demande interne terminée ou annulée (retour du
 * club, 2026-10-08 : "les demandes terminées, faut les archiver voire
 * supprimer avec bouton supprimer"). Coordinateur / admin ; le serveur
 * revérifie. Ne touche jamais la dérogation officielle FBI.
 */
export function DeleteRequestButton({ source, requestId, onDeleted }: { source: DerogationSource; requestId: string; onDeleted?: (id: string) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Supprimer définitivement cette demande et sa conversation ? La dérogation officielle FBI n'est pas concernée.")) return;
    setBusy(true);
    setError(null);
    try {
      await derogationClient(source).remove(requestId);
      if (onDeleted) onDeleted(requestId);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <Button variant="ghost" size="sm" icon={<Trash2 />} loading={busy} onClick={remove}>
        Supprimer
      </Button>
      {error ? <span className="type-meta text-danger">{error}</span> : null}
    </span>
  );
}
