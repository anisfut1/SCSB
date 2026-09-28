"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

type FormState = {
  modifierDate: boolean;
  dateDerogation: string; // <input type="date"> → "YYYY-MM-DD"
  modifierHoraire: boolean;
  horaire: string; // <input type="time"> → "HH:MM", même format que FBI
  inverserRencontre: boolean;
  inverserEquipe: boolean;
  motif: string;
};

const INITIAL_FORM: FormState = {
  modifierDate: false,
  dateDerogation: "",
  modifierHoraire: false,
  horaire: "",
  inverserRencontre: false,
  inverserEquipe: false,
  motif: "",
};

type Status = { kind: "success" | "error" | "warning"; text: string } | null;

/**
 * "on a vu comment accepter ou refuser une dérog, mtn faut en créer une.
 * (sur chaque rencontre faut un bouton "Créer une dérogation") On va dans
 * dérog > état : à créer > on cherche la rencontre concernée > on remplit
 * et choisi le motif, et on envoie de la meme facon que pour accpter ou
 * refuser" (demande du club, 2026-09-28). ÉCRIT réellement sur FBI/FFBB,
 * jamais annulable depuis cet outil une fois envoyée — "on cherche la
 * rencontre concernée" est fait côté SERVEUR (à partir du `matchId` déjà
 * connu), jamais une recherche manuelle ici.
 *
 * Champs REELS confirmés par le formulaire de création FBI (voir
 * club-manager-api/docs/FBI.md) : modifier date/horaire (chacun affiche son
 * propre champ, comme sur FBI), inverser la rencontre / inverser seulement
 * les équipes (mutuellement exclusives, même règle que le JS réel de la
 * page), motif obligatoire. La modification de SALLE n'est volontairement
 * PAS proposée ici (mécanique de la modale FBI jamais observée sur du HTML
 * réel — voir la doc de `BrowserFbiClient.createDerogation`).
 */
export function CreateDerogationAction({ clubId, matchId }: { clubId: string; matchId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<Status>(null);

  function reset() {
    setForm(INITIAL_FORM);
    setStatus(null);
    setOpen(false);
  }

  const motifValide = form.motif.trim().length > 0;
  const dateValide = !form.modifierDate || form.dateDerogation.length > 0;
  const horaireValide = !form.modifierHoraire || form.horaire.length > 0;
  const inversionValide = !(form.inverserRencontre && form.inverserEquipe);
  const auMoinsUneModification = form.modifierDate || form.modifierHoraire || form.inverserRencontre || form.inverserEquipe;
  const formValide = motifValide && dateValide && horaireValide && inversionValide && auMoinsUneModification;

  function submit() {
    startTransition(async () => {
      setStatus(null);
      try {
        // "DD/MM/YYYY" — format FBI réel (voir rencontreDateRencontre sur la
        // page de création), jamais celui de <input type="date"> ("YYYY-MM-DD").
        const [year, month, day] = form.dateDerogation.split("-");
        const dateDerogation = form.modifierDate && year && month && day ? `${day}/${month}/${year}` : null;

        const result = await browserApi.matches.createDerogation(clubId, matchId, {
          motif: form.motif.trim(),
          modifierDate: form.modifierDate,
          dateDerogation,
          modifierHoraire: form.modifierHoraire,
          horaire: form.modifierHoraire ? form.horaire : null,
          inverserRencontre: form.inverserRencontre,
          inverserEquipe: form.inverserEquipe,
        });

        if (result.outcome === "success") {
          setStatus({ kind: "success", text: "Dérogation créée sur FBI." });
          setForm(INITIAL_FORM);
          setOpen(false);
          router.refresh();
        } else if (result.outcome === "error") {
          setStatus({ kind: "error", text: result.message ?? "FBI a rejeté la création." });
        } else {
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

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          Créer une dérogation
        </button>
        {status ? (
          <p role="status" className={`text-sm ${statusClassName}`}>
            {status.text}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-black/15 bg-black/[0.02] p-3 text-sm dark:border-white/20 dark:bg-white/5">
      <p className="font-medium">Nouvelle demande de dérogation</p>

      <label className="flex items-start gap-2">
        <input type="checkbox" checked={form.modifierDate} onChange={(e) => setForm((f) => ({ ...f, modifierDate: e.target.checked }))} className="mt-0.5" />
        <span className="flex flex-1 flex-col gap-1">
          Modifier la date
          {form.modifierDate ? (
            <input
              type="date"
              value={form.dateDerogation}
              onChange={(e) => setForm((f) => ({ ...f, dateDerogation: e.target.value }))}
              className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-black/20"
            />
          ) : null}
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input type="checkbox" checked={form.modifierHoraire} onChange={(e) => setForm((f) => ({ ...f, modifierHoraire: e.target.checked }))} className="mt-0.5" />
        <span className="flex flex-1 flex-col gap-1">
          Modifier l&apos;horaire
          {form.modifierHoraire ? (
            <input
              type="time"
              value={form.horaire}
              onChange={(e) => setForm((f) => ({ ...f, horaire: e.target.value }))}
              className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-black/20"
            />
          ) : null}
        </span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.inverserRencontre}
          onChange={(e) => setForm((f) => ({ ...f, inverserRencontre: e.target.checked, inverserEquipe: e.target.checked ? false : f.inverserEquipe }))}
        />
        Inverser la rencontre
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.inverserEquipe}
          onChange={(e) => setForm((f) => ({ ...f, inverserEquipe: e.target.checked, inverserRencontre: e.target.checked ? false : f.inverserRencontre }))}
        />
        Inverser seulement les équipes
      </label>

      <label className="flex flex-col gap-1">
        <span>Motif de la demande (obligatoire)</span>
        <textarea
          value={form.motif}
          onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
          rows={3}
          className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-black/20"
        />
      </label>

      {!inversionValide ? <p className="text-sm text-red-600 dark:text-red-400">« Inverser la rencontre » et « Inverser seulement les équipes » sont mutuellement exclusives.</p> : null}
      {inversionValide && !auMoinsUneModification ? <p className="text-sm text-black/60 dark:text-white/60">Coche au moins une modification (date, horaire, ou inversion).</p> : null}

      <p className="text-black/60 dark:text-white/60">Cette demande sera transmise à la FFBB et ne pourra pas être annulée depuis cet outil.</p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending || !formValide}
          onClick={submit}
          className="rounded-md bg-black px-3 py-1.5 font-medium text-white hover:bg-black/80 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {isPending ? "Envoi en cours…" : "Envoyer à la FFBB"}
        </button>
        <button type="button" disabled={isPending} onClick={reset} className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">
          Annuler
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
