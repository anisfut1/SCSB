import type { Browser, BrowserContext, Page } from "playwright";
import { FbiError } from "./errors.js";
import * as selectors from "./selectors.js";

/**
 * BrowserFbiClient — automatisation Playwright de FBI, utilisée UNIQUEMENT
 * par ce worker (jamais dans une route Vercel, voir README.md). C'est la
 * stratégie FONCTIONNELLE pour tout ce que `HttpFbiClient` (app/src/lib/fbi)
 * ne peut pas faire en HTTP direct — aujourd'hui : la découverte et le
 * téléchargement des documents e-Marque, dont l'endpoint HTTP n'a jamais pu
 * être confirmé (§58 du brief FBI : ne jamais inventer une route, utiliser
 * le navigateur comme chemin fonctionnel à la place).
 *
 * §13 du brief FBI : CHAQUE session appartient à un seul club_id. Ce client
 * crée un nouveau `BrowserContext` isolé (équivalent d'une fenêtre de
 * navigation privée) à CHAQUE `login()`, jamais partagé entre deux clubs
 * même s'ils utilisaient le même Browser (processus Chromium) sous-jacent —
 * cookies, storage et cache ne traversent jamais un `BrowserContext`.
 *
 * Statut : le login (détection dynamique du formulaire, mêmes heuristiques
 * que HttpFbiClient) est PREPARED — jamais exécuté contre le vrai FBI
 * depuis cet environnement (réseau *.ffbb.com bloqué). Les tests
 * (worker/test/browser-client.test.ts) valident ce client contre des pages
 * HTML locales synthétiques, pas contre le vrai FBI (§54 du brief FBI).
 * La navigation post-login (recherche de rencontre, découverte de
 * documents) est conçue de façon générique/défensive (voir selectors.ts)
 * faute d'avoir pu observer le markup réel — à ajuster dès qu'un rapport
 * sanitisé réel du spike navigateur sera disponible.
 */

export interface BrowserFbiSession {
  context: BrowserContext;
  page: Page;
}

export interface BrowserFbiClientOptions {
  baseUrl: string;
  browser: Browser;
  /** Délai après une action de navigation, avant de considérer la page stabilisée (ms). Les apps Java legacy type FBI n'utilisent pas toujours des transitions détectables par networkidle. */
  navigationSettleMs?: number;
}

export class BrowserFbiClient {
  private readonly baseUrl: string;
  private readonly browser: Browser;
  private readonly navigationSettleMs: number;

  constructor(options: BrowserFbiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.browser = options.browser;
    this.navigationSettleMs = options.navigationSettleMs ?? 500;
  }

  private async settle(page: Page): Promise<void> {
    await page.waitForTimeout(this.navigationSettleMs);
  }

  async login(credentials: { username: string; password: string }): Promise<BrowserFbiSession> {
    // Contexte isolé PAR APPEL : jamais de cookie/session partagée entre deux
    // clubs, même s'ils réutilisent ce même Browser (§13 du brief FBI).
    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${this.baseUrl}/connexion.fbi`, { waitUntil: "domcontentloaded" });
    } catch (error) {
      await context.close();
      throw new FbiError("Page de connexion FBI injoignable", "LOGIN_PAGE_UNREACHABLE", error);
    }

    if (!(await selectors.looksLikeLoginPage(page))) {
      await context.close();
      throw new FbiError("Formulaire de connexion FBI non reconnu (aucun champ mot de passe trouvé)", "LOGIN_FORM_NOT_RECOGNIZED");
    }

    try {
      await selectors.usernameInput(page).fill(credentials.username);
      await selectors.passwordInput(page).fill(credentials.password);

      const submit = selectors.submitControl(page);
      if ((await submit.count()) > 0) {
        await submit.first().click();
      } else {
        await selectors.submitButtonByText(page).click();
      }

      await this.settle(page);
    } catch (error) {
      await context.close();
      throw new FbiError("Échec de la soumission du formulaire de connexion FBI", "NAVIGATION_FAILED", error);
    }

    if (await selectors.looksLikeLoginPage(page)) {
      await context.close();
      throw new FbiError("Connexion FBI refusée (identifiants incorrects, ou formulaire modifié)", "LOGIN_FAILED");
    }

    return { context, page };
  }

  async isSessionValid(session: BrowserFbiSession): Promise<boolean> {
    try {
      await session.page.goto(`${this.baseUrl}/accueil.fbi`, { waitUntil: "domcontentloaded" });
    } catch {
      return false;
    }
    return !(await selectors.looksLikeLoginPage(session.page));
  }

  /**
   * Recherche générique et défensive (voir la note de statut en tête de
   * fichier) : tente de rejoindre un écran de recherche de rencontre, y
   * saisit le numéro, puis scanne la page de résultat pour des liens de
   * documents connus. Chaque étape échoue silencieusement (best effort)
   * plutôt que de planter — le retour `[]` déclenche un retry planifié
   * (§27 du brief FBI : "document pas encore trouvé" n'est pas une erreur).
   */
  async findEmarqueDocuments(session: BrowserFbiSession, matchNumber: string): Promise<{ url: string; fileName: string }[]> {
    const { page } = session;

    await this.tryNavigateToSearchScreen(page);
    await this.trySearchByMatchNumber(page, matchNumber);
    await this.tryOpenMatchResult(page, matchNumber);

    const links = await selectors.findDocumentLinks(page);
    return links.map((link) => ({
      url: new URL(link.href, page.url()).toString(),
      fileName: this.fileNameFromLabelOrUrl(link),
    }));
  }

  private fileNameFromLabelOrUrl(link: { href: string; label: string }): string {
    const fromUrl = link.href.split("/").pop();
    if (fromUrl && /\.(zip|pdf)$/i.test(fromUrl)) return fromUrl;
    return `${link.label.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "document"}.pdf`;
  }

  private async tryNavigateToSearchScreen(page: Page): Promise<void> {
    const entry = page.getByRole("link", { name: /rencontre|compétition|calendrier/i }).first();
    if ((await entry.count()) > 0) {
      try {
        await entry.click();
        await this.settle(page);
      } catch {
        // Best effort — voir la note de statut en tête de fichier.
      }
    }
  }

  private async trySearchByMatchNumber(page: Page, matchNumber: string): Promise<void> {
    const input = selectors.matchNumberSearchInput(page).first();
    if ((await input.count()) === 0) return;

    try {
      await input.fill(matchNumber);
      await input.press("Enter");
      await this.settle(page);
    } catch {
      // Best effort — voir la note de statut en tête de fichier.
    }
  }

  private async tryOpenMatchResult(page: Page, matchNumber: string): Promise<void> {
    const resultLink = page.getByText(matchNumber, { exact: false }).first();
    if ((await resultLink.count()) === 0) return;

    try {
      await resultLink.click();
      await this.settle(page);
    } catch {
      // Best effort — voir la note de statut en tête de fichier.
    }
  }

  /**
   * §20 du brief FBI : "utiliser correctement `page.waitForEvent('download')`
   * OU ÉQUIVALENT". Un `BrowserContext` Playwright expose un
   * `APIRequestContext` (`context.request`) qui réutilise AUTOMATIQUEMENT
   * les cookies de la session authentifiée pour une requête vers la même
   * origine — équivalent robuste et plus simple qu'un clic + interception
   * d'événement pour un lien de téléchargement direct, sans jamais passer
   * par le système de fichiers de l'utilisateur ni du worker (§21).
   */
  async downloadDocument(session: BrowserFbiSession, url: string): Promise<Buffer> {
    const response = await session.context.request.get(url);

    if (!response.ok()) {
      throw new FbiError(`Téléchargement FBI : réponse HTTP ${response.status()} (${url})`, "REQUEST_FAILED");
    }

    return response.body();
  }

  async closeSession(session: BrowserFbiSession): Promise<void> {
    await session.context.close();
  }
}
