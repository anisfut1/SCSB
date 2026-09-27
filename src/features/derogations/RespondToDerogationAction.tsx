"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

type Step = { kind: "idle" } | { kind: "confirm-accept" } | { kind: "confirm-refuse"; motif: string };
type Status = { kind: "success" | "error" | "warning"; text: string } | null;

/**
 * "je veux le faire via loutil... voici les boutons a utiliser pour
 * accetper ou refuser. Si jamais on refuse, laisser un champ pour remplir
 * le motif" (demande du club, 2026-09-27) — ÉCRIT réellement sur FBI/FFBB,
 * jamais annulable depuis cet outil une fois confirmé : une confirmation
 * explicite est TOUJOURS intercalée entre le clic initial et l'envoi
 * réel, contrairement aux autres actions (lecture seule) de l'app.
 * Partagé entre la liste des dérogations et la fiche d'un match — les
 * deux exposent le même `derogation.id`.
 */
export function RespondToDerogationAction({ clubId, derogationId }: { clubId: string; derogationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [status, setStatus] = useState<Status>(null);

  function submit(decision: "accepted" | "refused", motifRefus: string | null) {
    startTransition(async () => {
      setStatus(null);
      try {
        const result = await browserApi.derogations.respond(clubId, derogationId, { decision, motifRefus });
        if (result.outcome === "success") {
          setStatus({ kind: "success", text: decision === "accepted" ? "Dérogation acceptée sur FBI." : "Dérogation refusée sur FBI." });
          setStep({ kind: "idle" });
          router.refresh();
        } else if (result.outcome === "error") {
          setStatus({ kind: "error", text: result.message ?? "FBI a rejeté l'envoi." });
        } else {
          // "unknown" — jamais traité comme un succès (voir club-manager-api/docs/FBI.md) : ni confirmation ni erreur détectée, vérification manuelle nécessaire.
          setStatus({ kind: "warning", text: result.message ?? "Résultat incertain — vérifie manuellement sur FBI avant de réessayer." });
        }
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Envoi impossible." });
      }
    });
  }

  const statusClassName = status
    ? status.kind === "success"
      ? "text-green-700 dark:text-green-400"
      : status.kind === "warning"
        ? "text-amber-700 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"
    : "";

  if (step.kind === "confirm-accept") {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-500/40 dark:bg-emerald-950/30">
        <p>Confirmer l&apos;acceptation ? Cette action sera transmise à la FFBB et ne pourra pas être annulée depuis cet outil.</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => submit("accepted", null)}
            className="rounded-md bg-emerald-700 px-3 py-1.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {isPending ? "Envoi en cours…" : "Confirmer l'acceptation"}
          </button>
          <button type="button" disabled={isPending} onClick={() => setStep({ kind: "idle" })} className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">
            Annuler
          </button>
        </div>
      </div>
    );
  }

  if (step.kind === "confirm-refuse") {
    const motifValide = step.motif.trim().length > 0;
    return (
      <div className="flex flex-col gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm dark:border-red-500/40 dark:bg-red-950/30">
        <label className="flex flex-col gap-1">
          <span>Motif de refus (obligatoire, transmis à l&apos;adversaire sur FBI)</span>
          <textarea
            value={step.motif}
            onChange={(e) => setStep({ kind: "confirm-refuse", motif: e.target.value })}
            rows={3}
            className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-black/20"
          />
        </label>
        <p>Confirmer le refus ? Cette action sera transmise à la FFBB et ne pourra pas être annulée depuis cet outil.</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending || !motifValide}
            onClick={() => submit("refused", step.motif.trim())}
            className="rounded-md bg-red-700 px-3 py-1.5 font-medium text-white hover:bg-red-800 disabled:opacity-60"
          >
            {isPending ? "Envoi en cours…" : "Confirmer le refus"}
          </button>
          <button type="button" disabled={isPending} onClick={() => setStep({ kind: "idle" })} className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep({ kind: "confirm-accept" })}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Accepter
        </button>
        <button type="button" onClick={() => setStep({ kind: "confirm-refuse", motif: "" })} className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">
          Refuser
        </button>
      </div>
      {status ? (
        <p role="status" className={`text-sm ${statusClassName}`}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
