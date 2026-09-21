/**
 * network-recorder.ts — capture STRUCTURELLE du trafic réseau pendant
 * l'exploration FBI, avec blocage par défaut des requêtes qui ressemblent à
 * une action d'écriture (voir §21 du brief : "réduire au maximum le risque
 * de modifier FBI pendant l'exploration").
 *
 * Ce module ne connaît jamais de secret : les en-têtes sensibles
 * (Authorization, Cookie, Set-Cookie, tokens CSRF) ne sont jamais lus ici,
 * et les corps de requête ne sont réduits qu'à la liste de leurs noms de
 * champs (voir sanitize.ts).
 */
import type { BrowserContext, Download, Page, Route, Request as PwRequest, Response as PwResponse } from "playwright";
import { extractPostParamNames, redactUrlQueryValues } from "./sanitize.ts";

export interface RecordedEvent {
  timestamp: string;
  method: string;
  url: string;
  resourceType: string;
  postParamNames?: string[];
  status?: number;
  contentType?: string;
  approxSizeBytes?: number;
  redirectedFromUrl?: string;
  blocked: boolean;
  blockReason?: string;
}

export interface DownloadEvent {
  timestamp: string;
  suggestedExtension: string;
  savedAs: string;
  approxSizeBytes?: number;
}

/**
 * Requêtes de lecture toujours autorisées (méthode seule, quelle que soit
 * l'URL) : consulter ne modifie rien côté serveur.
 */
const ALWAYS_ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Pour les méthodes potentiellement mutantes (POST/PUT/PATCH/DELETE) :
 * si l'URL contient un de ces mots, c'est bloqué QUOI QU'IL ARRIVE, même si
 * elle contient aussi un mot de la liste d'autorisation ci-dessous.
 * Liste volontairement large — un faux positif (blocage d'une action en
 * réalité inoffensive) est sans danger ; un faux négatif ne l'est pas.
 */
const DENY_KEYWORDS =
  /save|update|delete|remove|supprim|valid|enregistr|creer|create|modifi|submit|envoi|send|write|ecriture|inscri|desinscri|annul|cancel|confirm/i;

/**
 * Si la méthode est mutante ET que l'URL ne matche pas DENY_KEYWORDS, elle
 * n'est autorisée que si elle correspond à un usage de lecture identifié
 * (login, recherche, export/téléchargement). Sinon : bloquée par défaut.
 */
const ALLOW_KEYWORDS = /connexion|identification|login|authent|recherche|search|export|telecharg|download|consult/i;

export type AllowDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

export function decideAllow(method: string, url: string): AllowDecision {
  if (ALWAYS_ALLOWED_METHODS.has(method.toUpperCase())) {
    return { allowed: true };
  }

  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    // garde l'URL brute si elle n'est pas parseable
  }

  if (DENY_KEYWORDS.test(path)) {
    return { allowed: false, reason: `méthode ${method} vers une URL évoquant une action d'écriture (${path})` };
  }

  if (ALLOW_KEYWORDS.test(path)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `méthode ${method} vers une URL non reconnue comme lecture (${path}) — bloquée par défaut, voir README`,
  };
}

export class NetworkRecorder {
  private readonly events: RecordedEvent[] = [];
  private readonly downloads: DownloadEvent[] = [];
  private readonly pending = new Map<PwRequest, RecordedEvent>();
  private downloadCounter = 0;
  constructor(private readonly downloadsDir: string) {}

  attachToContext(context: BrowserContext): void {
    void context.route("**/*", (route) => this.handleRoute(route));
    context.on("response", (response) => this.handleResponse(response));
  }

  attachToPage(page: Page): void {
    page.on("download", (download) => {
      void this.handleDownload(download);
    });
  }

  private handleRoute(route: Route): void {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const decision = decideAllow(method, url);

    const event: RecordedEvent = {
      timestamp: new Date().toISOString(),
      method,
      url: redactUrlQueryValues(url),
      resourceType: request.resourceType(),
      blocked: !decision.allowed,
      blockReason: decision.allowed ? undefined : decision.reason,
    };

    if (method !== "GET" && method !== "HEAD") {
      const contentType = request.headers()["content-type"];
      event.postParamNames = extractPostParamNames(request.postData(), contentType);
    }

    if (!decision.allowed) {
      this.events.push(event);
      console.warn(`[BLOQUÉ] ${method} ${event.url} — ${decision.reason}`);
      void route.abort("blockedbyclient");
      return;
    }

    this.pending.set(request, event);
    void route.continue();
  }

  private handleResponse(response: PwResponse): void {
    const request = response.request();
    const event = this.pending.get(request);
    if (!event) return;

    this.pending.delete(request);
    event.status = response.status();
    event.contentType = response.headers()["content-type"];

    const contentLength = response.headers()["content-length"];
    if (contentLength) {
      const parsed = Number.parseInt(contentLength, 10);
      if (!Number.isNaN(parsed)) event.approxSizeBytes = parsed;
    }

    const redirectedFrom = request.redirectedFrom();
    if (redirectedFrom) {
      event.redirectedFromUrl = redactUrlQueryValues(redirectedFrom.url());
    }

    this.events.push(event);
  }

  private async handleDownload(download: Download): Promise<void> {
    this.downloadCounter += 1;
    const suggested = download.suggestedFilename();
    const extMatch = /\.[a-zA-Z0-9]+$/.exec(suggested);
    const extension = extMatch ? extMatch[0] : "";
    // Nom générique volontaire : on ne conserve JAMAIS le nom suggéré par le
    // serveur tel quel (il pourrait, en théorie, être dérivé d'une donnée
    // personnelle — ex: nom de licencié dans un export).
    const savedAs = `${this.downloadsDir}/download-${this.downloadCounter}${extension}`;

    await download.saveAs(savedAs);

    this.downloads.push({
      timestamp: new Date().toISOString(),
      suggestedExtension: extension || "(sans extension)",
      savedAs,
    });

    console.log(`[TÉLÉCHARGEMENT] fichier sauvegardé localement (gitignored) : ${savedAs}`);
  }

  getEvents(): RecordedEvent[] {
    return [...this.events];
  }

  getDownloads(): DownloadEvent[] {
    return [...this.downloads];
  }

  getBlockedCount(): number {
    return this.events.filter((e) => e.blocked).length;
  }
}
