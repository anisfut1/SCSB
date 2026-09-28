"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { ImportLicencieRowDto } from "@/lib/api/licencies";

type Status = { kind: "success" | "error"; text: string } | null;

/**
 * En-têtes RÉELS de l'export "rechercherLicence.fbi" (fourni par le club,
 * 2026-09-28, critère "Validation" = "Validé") — plusieurs libellés
 * tolérés par colonne (accents/casse) jamais un intitulé deviné.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  ffbbLicenceId: ["n° national", "no national", "n national", "numero national", "numéro national"],
  licenseNumber: ["numéro", "numero"],
  lastName: ["nom"],
  firstName: ["prénom", "prenom"],
  birthDate: ["né(e) le", "nee le", "né le", "ne le"],
  categoryLabel: ["catégorie", "categorie"],
  sexe: ["sexe"],
};

type ColumnKey = keyof typeof HEADER_ALIASES;

function splitLine(line: string): string[] {
  // Coller depuis Excel produit des colonnes séparées par des TABULATIONS
  // (jamais des virgules, qui peuvent apparaître dans un nom) — repli sur
  // la virgule uniquement si aucune tabulation n'est trouvée (export .csv).
  return line.includes("\t") ? line.split("\t") : line.split(",");
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

/** "DD/MM/YYYY" (format FBI réel, voir "Né(e) le") → "YYYY-MM-DD" (format attendu par l'API, jamais l'inverse). */
function toIsoDate(raw: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function parseRows(text: string): { rows: ImportLicencieRowDto[]; skippedLines: number } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { rows: [], skippedLines: 0 };

  const headerCells = splitLine(lines[0]).map(normalizeHeader);
  const indexFor = (key: ColumnKey): number => headerCells.findIndex((h) => HEADER_ALIASES[key].includes(h));

  const idx: Record<ColumnKey, number> = {
    ffbbLicenceId: indexFor("ffbbLicenceId"),
    licenseNumber: indexFor("licenseNumber"),
    lastName: indexFor("lastName"),
    firstName: indexFor("firstName"),
    birthDate: indexFor("birthDate"),
    categoryLabel: indexFor("categoryLabel"),
    sexe: indexFor("sexe"),
  };

  const rows: ImportLicencieRowDto[] = [];
  let skippedLines = 0;

  for (const line of lines.slice(1)) {
    const cells = splitLine(line);
    const ffbbLicenceId = idx.ffbbLicenceId >= 0 ? (cells[idx.ffbbLicenceId] ?? "").trim() : "";
    const lastName = idx.lastName >= 0 ? (cells[idx.lastName] ?? "").trim() : "";
    const firstName = idx.firstName >= 0 ? (cells[idx.firstName] ?? "").trim() : "";
    // ffbbLicenceId ("N° national") obligatoire — clé de dédoublonnage côté
    // API, une ligne sans lui ne peut jamais être importée proprement.
    if (!ffbbLicenceId || !lastName || !firstName) {
      skippedLines += 1;
      continue;
    }

    const sexeRaw = idx.sexe >= 0 ? (cells[idx.sexe] ?? "").trim().toUpperCase() : "";
    const birthRaw = idx.birthDate >= 0 ? (cells[idx.birthDate] ?? "").trim() : "";

    rows.push({
      ffbbLicenceId,
      lastName,
      firstName,
      licenseNumber: idx.licenseNumber >= 0 ? (cells[idx.licenseNumber] ?? "").trim() || null : null,
      birthDate: birthRaw ? toIsoDate(birthRaw) : null,
      categoryLabel: idx.categoryLabel >= 0 ? (cells[idx.categoryLabel] ?? "").trim() || null : null,
      sexe: sexeRaw === "M" || sexeRaw === "F" ? sexeRaw : null,
    });
  }

  return { rows, skippedLines };
}

/**
 * "Voici la liste des licenciés, ajoute les tous stp, a lavenir yen aura
 * dautres, faudra ignorer les doublons dans les exports" (demande du club,
 * 2026-09-28) — colle le contenu d'un export FBI (rechercherLicence.fbi,
 * critère "Validé") copié depuis Excel (en-têtes compris), jamais un import
 * de fichier binaire .xlsx (pas de parseur XLSX ici, voir docs/LICENCIES.md
 * côté club-manager-api) : Excel copie ses cellules sélectionnées comme du
 * texte séparé par tabulations, lisible tel quel.
 *
 * Le dédoublonnage (jamais de doublon créé, même après plusieurs imports du
 * même export) est appliqué CÔTÉ SERVEUR par `ffbbLicenceId` — ce composant
 * ne fait que parser et envoyer, jamais de logique de dédoublonnage ici.
 */
export function ImportLicenciesPanel({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>(null);

  function submit() {
    const { rows, skippedLines } = parseRows(text);
    if (rows.length === 0) {
      setStatus({
        kind: "error",
        text: "Aucune ligne valide trouvée — vérifie que la première ligne collée contient bien les en-têtes (N° national, Nom, Prénom...).",
      });
      return;
    }

    startTransition(async () => {
      setStatus(null);
      try {
        const result = await browserApi.licencies.import(clubId, { licencies: rows });
        const skippedNote = skippedLines > 0 ? ` (${skippedLines} ligne(s) collée(s) ignorée(s), incomplète(s))` : "";
        setStatus({ kind: "success", text: `${result.inserted} ajouté(s), ${result.skipped} déjà connu(s) sur ${result.total}${skippedNote}.` });
        setText("");
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Import impossible." });
      }
    });
  }

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Importer des licenciés
        </button>
        {status ? (
          <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {status.text}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
      <p className="font-medium">Importer des licenciés depuis un export FBI</p>
      <p className="text-black/60 dark:text-white/60">
        Sur{" "}
        <a className="underline" href="https://extranet.ffbb.com/fbi/rechercherLicence.fbi" target="_blank" rel="noreferrer">
          rechercherLicence.fbi
        </a>
        , mets « Validation » sur « Validé », lance la recherche, sélectionne tout le tableau de résultat (en-têtes compris) dans Excel, copie-le, et
        colle-le ci-dessous. Les licenciés déjà connus sont automatiquement ignorés, jamais dupliqués.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Colle ici les lignes copiées depuis Excel (en-têtes sur la première ligne)."
        className="rounded-md border border-black/15 bg-white px-2 py-1 font-mono text-xs dark:border-white/20 dark:bg-black/20"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending || text.trim().length === 0}
          onClick={submit}
          className="rounded-md bg-black px-3 py-1.5 font-medium text-white hover:bg-black/80 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {isPending ? "Import en cours…" : "Importer"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          Fermer
        </button>
      </div>
      {status ? (
        <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
