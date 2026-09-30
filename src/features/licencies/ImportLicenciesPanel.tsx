"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { ImportLicencieRowDto } from "@/lib/api/licencies";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, FormMessage, Textarea } from "@/components/ui/Field";

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

  const feedback = status ? <FormMessage tone={status.kind === "success" ? "success" : "danger"}>{status.text}</FormMessage> : null;

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)} icon={<Upload />}>
          Importer des licenciés
        </Button>
        {feedback}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader icon={<FileSpreadsheet />} title="Importer des licenciés depuis un export FBI" />
      <ol className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <li className="flex gap-3">
          <span className="type-numeric inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-text">1</span>
          <span>
            Sur{" "}
            <a className="font-medium text-accent-text underline underline-offset-4" href="https://extranet.ffbb.com/fbi/rechercherLicence.fbi" target="_blank" rel="noreferrer">
              rechercherLicence.fbi
            </a>
            , mets « Validation » sur « Validé » et lance la recherche.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="type-numeric inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-text">2</span>
          <span>Sélectionne tout le tableau de résultat (en-têtes compris) dans Excel et copie-le.</span>
        </li>
        <li className="flex gap-3">
          <span className="type-numeric inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-text">3</span>
          <span>Colle-le ci-dessous. Les licenciés déjà connus sont automatiquement ignorés, jamais dupliqués.</span>
        </li>
      </ol>
      <Field label="Lignes copiées depuis Excel" className="mt-4">
        {(props) => (
          <Textarea
            {...props}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Colle ici les lignes copiées depuis Excel (en-têtes sur la première ligne)."
            className="font-mono text-xs sm:text-xs"
          />
        )}
      </Field>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" loading={isPending} disabled={text.trim().length === 0} onClick={submit} icon={<Upload />}>
          {isPending ? "Import en cours…" : "Importer"}
        </Button>
        <Button variant="ghost" disabled={isPending} onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </div>
      {feedback ? <div className="mt-3">{feedback}</div> : null}
    </Card>
  );
}
