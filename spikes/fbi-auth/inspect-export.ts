/**
 * inspect-export.ts — affiche UNIQUEMENT la ligne d'en-tête d'un export CSV
 * téléchargé, jamais les lignes de données.
 *
 * Pour un export Excel (.xlsx/.xls) : volontairement PAS de parsing ici.
 * Un correctif de sécurité n'existe pas sur npm pour la bibliothèque
 * habituelle (`xlsx`/SheetJS, vulnérabilités connues sans fix publié sur le
 * registre npm) ; plutôt que d'introduire une dépendance vulnérable pour un
 * outil de diagnostic, ouvre le fichier toi-même (Excel/Numbers/Google
 * Sheets) et note les en-têtes de colonnes à la main dans le rapport.
 *
 * Usage :
 *   npm run inspect-export -- .local/downloads/download-1.csv
 *
 * Les en-têtes de colonnes ("Nom", "N° licence"...) ne sont pas des données
 * personnelles ; les LIGNES le sont potentiellement (mineurs inclus) — c'est
 * pourquoi ce script s'arrête volontairement à la première ligne.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

function main(): void {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage : npm run inspect-export -- <chemin-vers-fichier-telecharge>");
    console.error("Exemple : npm run inspect-export -- .local/downloads/download-1.csv");
    process.exitCode = 1;
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  if (ext !== ".csv") {
    console.error(`Extension "${ext}" non gérée par cet outil (voir le commentaire en tête de fichier).`);
    console.error("Ouvre le fichier toi-même (Excel/Numbers/Google Sheets) et note les en-têtes de");
    console.error("colonnes à la main dans docs/FBI_AUTHENTICATED_SPIKE.md — ne commite jamais le fichier.");
    process.exitCode = 1;
    return;
  }

  const content = readFileSync(filePath, "utf-8");
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const separator = firstLine.includes(";") ? ";" : ",";
  const columns = firstLine.split(separator).map((c) => c.trim());

  console.log(`Fichier CSV — ${columns.length} colonne(s) détectée(s) :`);
  columns.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));

  console.log(
    "\nRappel : ne commite jamais ce fichier. Seuls les NOMS de colonnes ci-dessus " +
      "peuvent être copiés dans docs/FBI_AUTHENTICATED_SPIKE.md.",
  );
}

main();
