/**
 * report.ts — agrège spikes/fbi-auth/.local/report.json (brut) en une
 * version résumée et re-vérifiée : spikes/fbi-auth/.local/report-sanitized.json.
 *
 * C'est ce dernier fichier qui est fait pour être transmis (copié-collé ou
 * envoyé) : routes uniques, méthodes, statuts, types de contenu, compteurs.
 * Aucune valeur de formulaire, cookie ou donnée personnelle.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertReportIsClean } from "./sanitize.ts";
import type { DownloadEvent, RecordedEvent } from "./network-recorder.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(HERE, ".local", "report.json");
const SANITIZED_PATH = path.join(HERE, ".local", "report-sanitized.json");

interface RawReport {
  generatedAt: string;
  baseUrl: string;
  sessionReused: boolean;
  totalRequests: number;
  blockedRequestsCount: number;
  events: RecordedEvent[];
  downloads: DownloadEvent[];
}

interface RouteSummary {
  method: string;
  path: string;
  count: number;
  statuses: number[];
  contentTypes: string[];
  blockedAtLeastOnce: boolean;
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function summarizeRoutes(events: RecordedEvent[]): RouteSummary[] {
  const byRoute = new Map<
    string,
    { method: string; path: string; count: number; statuses: Set<number>; contentTypes: Set<string>; blocked: boolean }
  >();

  for (const event of events) {
    const routePath = pathOf(event.url);
    const key = `${event.method} ${routePath}`;
    const entry = byRoute.get(key) ?? {
      method: event.method,
      path: routePath,
      count: 0,
      statuses: new Set<number>(),
      contentTypes: new Set<string>(),
      blocked: false,
    };

    entry.count += 1;
    if (event.status !== undefined) entry.statuses.add(event.status);
    if (event.contentType) entry.contentTypes.add(event.contentType.split(";")[0] ?? event.contentType);
    if (event.blocked) entry.blocked = true;

    byRoute.set(key, entry);
  }

  return [...byRoute.values()]
    .map((r) => ({
      method: r.method,
      path: r.path,
      count: r.count,
      statuses: [...r.statuses].sort((a, b) => a - b),
      contentTypes: [...r.contentTypes],
      blockedAtLeastOnce: r.blocked,
    }))
    .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

async function main(): Promise<void> {
  if (!existsSync(REPORT_PATH)) {
    console.error("Aucun rapport trouvé (.local/report.json absent).");
    console.error("Lance d'abord `npm run probe` pour explorer FBI et générer un rapport.");
    process.exitCode = 1;
    return;
  }

  const raw = JSON.parse(await readFile(REPORT_PATH, "utf-8")) as RawReport;

  // Re-vérification : même si le rapport brut a déjà été validé à l'écriture,
  // on ne fait jamais confiance à un fichier lu depuis le disque sans le
  // repasser au crible.
  assertReportIsClean(raw);

  const sanitized = {
    generatedAt: new Date().toISOString(),
    sourceReportGeneratedAt: raw.generatedAt,
    baseUrl: raw.baseUrl,
    sessionReused: raw.sessionReused,
    totalRequests: raw.totalRequests,
    blockedRequestsCount: raw.blockedRequestsCount,
    uniqueRoutes: summarizeRoutes(raw.events ?? []),
    downloadsCount: raw.downloads?.length ?? 0,
    downloadExtensions: [...new Set((raw.downloads ?? []).map((d) => d.suggestedExtension))],
  };

  assertReportIsClean(sanitized);

  await writeFile(SANITIZED_PATH, JSON.stringify(sanitized, null, 2));

  console.log(`Rapport sanitisé écrit dans ${path.relative(process.cwd(), SANITIZED_PATH)}`);
  console.log(`  - ${sanitized.uniqueRoutes.length} route(s) unique(s)`);
  console.log(`  - ${sanitized.blockedRequestsCount} requête(s) bloquée(s) au total`);
  console.log(`  - ${sanitized.downloadsCount} téléchargement(s)`);
  console.log("\nCe fichier ne contient que des routes/méthodes/statuts/types de contenu/compteurs.");
  console.log("C'est celui à transmettre pour la suite du travail (voir docs/FBI_AUTHENTICATED_SPIKE.md).");
}

main().catch((error: unknown) => {
  console.error("Erreur inattendue :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
