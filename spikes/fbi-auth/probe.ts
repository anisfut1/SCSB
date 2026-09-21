/**
 * probe.ts — outil de diagnostic FBI authentifié, à exécuter LOCALEMENT.
 *
 * Ne fait rien d'automatique de risqué : ouvre un vrai navigateur Chromium
 * visible, te laisse te connecter et naviguer toi-même dans FBI avec ton
 * propre compte club, et se contente d'enregistrer les métadonnées réseau
 * structurelles pendant ce temps (voir network-recorder.ts et sanitize.ts).
 *
 * Usage :
 *   npm run probe                  # mode normal (voir README.md)
 *   npm run probe -- --headed      # identique : ce spike est TOUJOURS visible
 *   npm run probe -- --reset-session
 *   npm run check-session          # vérifie si la session sauvegardée est encore valide
 */
import { chromium, type Page } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { NetworkRecorder } from "./network-recorder.ts";
import { assertReportIsClean } from "./sanitize.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = path.join(HERE, ".local");
const DOWNLOADS_DIR = path.join(LOCAL_DIR, "downloads");
const AUTH_STATE_PATH = path.join(LOCAL_DIR, "auth-state.json");
const REPORT_PATH = path.join(LOCAL_DIR, "report.json");
const SESSION_CHECK_PATH = path.join(LOCAL_DIR, "session-check.json");
const ENV_FILE_PATH = path.join(HERE, ".env.fbi.local");

const DEFAULT_BASE_URL = "https://extranet.ffbb.com/fbi";

async function loadEnvFbiLocal(): Promise<Record<string, string>> {
  if (!existsSync(ENV_FILE_PATH)) return {};
  const content = await readFile(ENV_FILE_PATH, "utf-8");
  const result: Record<string, string> = {};
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (value) result[key] = value;
  }
  return result;
}

interface CliOptions {
  checkSession: boolean;
  resetSession: boolean;
  baseUrl: string;
}

function parseArgs(argv: string[], envBaseUrl: string | undefined): CliOptions {
  const baseUrlArg = argv.find((a) => a.startsWith("--base-url="));
  return {
    checkSession: argv.includes("--check-session"),
    resetSession: argv.includes("--reset-session"),
    baseUrl: baseUrlArg?.split("=")[1] ?? envBaseUrl ?? DEFAULT_BASE_URL,
  };
}

async function isLikelyLoginPage(page: Page): Promise<boolean> {
  try {
    return (await page.locator('input[type="password"]').count()) > 0;
  } catch {
    return true;
  }
}

/**
 * Tentative "best effort" de connexion automatique, UNIQUEMENT si des
 * identifiants sont fournis dans .env.fbi.local. Non garantie de
 * fonctionner (le formulaire réel de FBI n'a pas pu être inspecté à
 * l'avance, voir docs/FBI_AUTHENTICATED_SPIKE.md — statut PREPARED, NOT
 * TESTED). En cas d'échec, elle ne bloque jamais : le mode manuel prend le
 * relais automatiquement.
 */
async function attemptAutoLogin(page: Page, username: string, password: string): Promise<boolean> {
  try {
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: "visible", timeout: 5000 });

    const form = page.locator("form", { has: passwordInput });
    const usernameInput = form.locator('input[type="text"], input[type="email"], input:not([type])').first();
    await usernameInput.fill(username);
    await passwordInput.fill(password);

    const submitButton = form
      .locator(
        [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("connexion")',
          'button:has-text("connecter")',
          'button:has-text("valider")',
        ].join(", "),
      )
      .first();
    await submitButton.click();

    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);

    return !(await isLikelyLoginPage(page));
  } catch (error) {
    console.warn(
      "Connexion automatique 'best effort' non concluante, bascule en mode manuel :",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

async function runSessionCheck(baseUrl: string): Promise<void> {
  if (!existsSync(AUTH_STATE_PATH)) {
    console.error("Aucune session sauvegardée trouvée (.local/auth-state.json absent).");
    console.error("Lance d'abord `npm run probe` pour te connecter une première fois.");
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" }).catch((error: unknown) => {
    console.error("Impossible de charger l'URL de base :", error instanceof Error ? error.message : error);
  });

  const stillLoggedIn = !(await isLikelyLoginPage(page));

  await browser.close();

  const result = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    sessionValid: stillLoggedIn,
  };

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(SESSION_CHECK_PATH, JSON.stringify(result, null, 2));

  console.log(stillLoggedIn ? "Session VALIDE (page authentifiée détectée)." : "Session EXPIRÉE ou invalide (page de connexion détectée).");
  console.log(`Détail écrit dans ${path.relative(process.cwd(), SESSION_CHECK_PATH)}`);
}

async function runProbe(baseUrl: string, resetSession: boolean): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await mkdir(DOWNLOADS_DIR, { recursive: true });

  if (resetSession && existsSync(AUTH_STATE_PATH)) {
    await rm(AUTH_STATE_PATH);
    console.log("Session précédente supprimée (--reset-session) : connexion manuelle requise.");
  }

  const env = await loadEnvFbiLocal();
  const hasCredentials = Boolean(env.FBI_USERNAME && env.FBI_PASSWORD);

  console.log("Lancement de Chromium en mode visible (ce spike est toujours \"headed\")...");
  const browser = await chromium.launch({ headless: false });

  const hasSavedSession = existsSync(AUTH_STATE_PATH);
  const context = hasSavedSession
    ? await browser.newContext({ storageState: AUTH_STATE_PATH })
    : await browser.newContext();

  const recorder = new NetworkRecorder(DOWNLOADS_DIR);
  recorder.attachToContext(context);

  const page = await context.newPage();
  recorder.attachToPage(page);

  console.log(`Navigation vers ${baseUrl} ...`);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  const rl = readline.createInterface({ input, output });
  let sessionReused = false;

  if (hasSavedSession && !(await isLikelyLoginPage(page))) {
    sessionReused = true;
    console.log("Session précédente réutilisée avec succès (pas de page de connexion détectée).");
  } else {
    let loggedIn = false;

    if (hasCredentials) {
      console.log("Identifiants trouvés dans .env.fbi.local : tentative de connexion automatique 'best effort'...");
      loggedIn = await attemptAutoLogin(page, env.FBI_USERNAME, env.FBI_PASSWORD);
    }

    if (!loggedIn) {
      await rl.question(
        "\nConnecte-toi à FBI toi-même dans la fenêtre Chromium qui vient de s'ouvrir.\n" +
          "Une fois connecté (page d'accueil FBI visible), reviens ici et appuie sur Entrée...\n",
      );
    }
  }

  await context.storageState({ path: AUTH_STATE_PATH });
  console.log(`Session sauvegardée localement dans ${path.relative(process.cwd(), AUTH_STATE_PATH)} (gitignored).`);

  await rl.question(
    "\nExplore maintenant les écrans FBI qui t'intéressent (Licences, Compétitions,\n" +
      "Engagements, Rencontres, Feuilles de marque, Dérogations, Exports...).\n" +
      "Le script enregistre les métadonnées réseau en continu (jamais de valeurs de\n" +
      "formulaire, cookies ou mots de passe). Les téléchargements sont sauvegardés\n" +
      "localement dans spikes/fbi-auth/.local/downloads/ (gitignored).\n\n" +
      "Quand tu as terminé, reviens ici et appuie sur Entrée pour générer le rapport...\n",
  );

  rl.close();

  const events = recorder.getEvents();
  const downloads = recorder.getDownloads();
  const blockedCount = recorder.getBlockedCount();

  await context.close();
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    sessionReused,
    totalRequests: events.length,
    blockedRequestsCount: blockedCount,
    events,
    downloads,
  };

  try {
    assertReportIsClean(report);
  } catch (error) {
    console.error("\n/!\\ ", error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`\nRapport écrit dans ${path.relative(process.cwd(), REPORT_PATH)} (gitignored, reste local).`);
  console.log(`  - ${events.length} requêtes enregistrées`);
  console.log(`  - ${blockedCount} requête(s) bloquée(s) par précaution (voir le rapport si une action légitime semble manquante)`);
  console.log(`  - ${downloads.length} téléchargement(s) sauvegardé(s) localement`);
  console.log("\nProchaine étape : `npm run report` pour générer une version sanitisée partageable.");
}

async function main(): Promise<void> {
  const env = await loadEnvFbiLocal();
  const options = parseArgs(process.argv.slice(2), env.FBI_BASE_URL);

  if (options.checkSession) {
    await runSessionCheck(options.baseUrl);
    return;
  }

  await runProbe(options.baseUrl, options.resetSession);
}

main().catch((error: unknown) => {
  console.error("Erreur inattendue :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
