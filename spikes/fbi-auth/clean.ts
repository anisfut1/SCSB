/**
 * clean.ts — supprime tout l'état local sensible du spike (session,
 * rapports, téléchargements). C'est LA procédure de suppression documentée
 * dans docs/FBI_AUTHENTICATED_SPIKE.md.
 */
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = path.join(HERE, ".local");

async function main(): Promise<void> {
  if (!existsSync(LOCAL_DIR)) {
    console.log("Rien à nettoyer : spikes/fbi-auth/.local/ n'existe pas.");
    return;
  }

  await rm(LOCAL_DIR, { recursive: true, force: true });
  console.log("Supprimé : spikes/fbi-auth/.local/ (session, rapports, téléchargements).");
}

main().catch((error: unknown) => {
  console.error("Erreur inattendue :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
