/**
 * UniversalLinkRouter — décision PURE (testée) pour toute URL qui entre dans
 * l'app : Universal Link (email, WhatsApp, SMS, Safari), lien collé à la main,
 * destination d'une notification push (chemin relatif). UNE seule logique pour
 * tous ces canaux (docs/IOS_AUDIT.md §7-8).
 *
 * Une URL n'est JAMAIS une preuve d'autorisation : la décision dit seulement
 * où aller ; la session et les droits sont vérifiés ensuite (et par l'API, qui
 * reste la source de vérité).
 */

export const LINK_HOSTS = new Set(["www.ball-manager.fr", "ball-manager.fr", "open.ball-manager.fr"]);
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Sections de l'espace public que l'app sait afficher (même chemin que le web). */
const SECTIONS = new Set(["accueil", "planning", "equipes", "matchs", "resultats", "entrainements", "derogations", "tables", "joueurs", "compte"]);

export type LinkDecision =
  /** Ouvrir un écran de l'app (session requise pour ce club). */
  | { kind: "navigate"; clubSlug: string; path: string }
  /** Lien personnel (jeton) : l'échanger contre une session d'appareil, puis ouvrir `path` (sans le jeton). */
  | { kind: "bootstrap"; clubSlug: string; token: string; path: string }
  /** Lien de connexion à usage unique : l'échanger, puis ouvrir la destination renvoyée par l'API. */
  | { kind: "login-code"; clubSlug: string; code: string }
  /** Hors de l'espace public (ex. espace club par compte) : ouvrir dans Safari. */
  | { kind: "external"; url: string }
  /** Inconnu mais sur notre domaine : accueil de l'app (repli propre). */
  | { kind: "home" }
  /** Domaine étranger ou URL invalide : ignoré. */
  | { kind: "reject"; reason: "invalid-domain" | "malformed" };

function parse(input: string): URL | null {
  try {
    return input.startsWith("/") ? new URL(input, "https://www.ball-manager.fr") : new URL(input);
  } catch {
    return null;
  }
}

/** Chemin normalisé : décodé, sans doublons de `/`, sans `/` final ; `null` si `..` (tentative de sortie). */
export function normalizePath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const segments = decoded.split("/").filter(Boolean);
  if (segments.some((s) => s === ".." || s === ".")) return null;
  return `/${segments.join("/")}`;
}

function withoutToken(url: URL): { search: string; hash: string; token: string | null } {
  const query = new URLSearchParams(url.search);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const token = fragment.get("token") || query.get("token");
  query.delete("token");
  const hasTokenFragment = fragment.has("token");
  fragment.delete("token");
  const search = query.toString();
  const rest = fragment.toString();
  // Un fragment qui n'était qu'un jeton disparaît ; une ancre (#convocation) est conservée.
  const hash = hasTokenFragment ? (rest ? `#${rest}` : "") : url.hash;
  return { search: search ? `?${search}` : "", hash, token };
}

export function resolveLink(input: string): LinkDecision {
  const url = parse(input.trim());
  if (!url) return { kind: "reject", reason: "malformed" };
  if (!input.startsWith("/")) {
    if (url.protocol !== "https:" || !LINK_HOSTS.has(url.hostname)) return { kind: "reject", reason: "invalid-domain" };
  }
  const path = normalizePath(url.pathname);
  if (path === null) return { kind: "reject", reason: "malformed" };
  const segments = path.split("/").filter(Boolean);

  // Espace club (compte), plateforme, connexion par compte : sur le site, dans Safari.
  if (segments[0] === "c" || segments[0] === "platform" || segments[0] === "login" || segments[0] === "bienvenue") {
    return { kind: "external", url: `https://www.ball-manager.fr${path}${url.search}` };
  }
  if (segments[0] !== "public") return { kind: "home" };

  const slug = segments[1];
  if (!slug || !SLUG.test(slug)) return { kind: "home" };
  const section = segments[2];

  if (section === "connexion" && segments[3] === "code" && segments[4] && /^[A-Za-z0-9_-]{20,128}$/.test(segments[4])) {
    return { kind: "login-code", clubSlug: slug, code: segments[4] };
  }
  // Routes techniques du site (exclues de l'AASA aussi) : jamais ouvertes comme écran.
  if (section === "session" || section === "auth" || section === "manifest.webmanifest") return { kind: "navigate", clubSlug: slug, path: `/public/${slug}/accueil` };

  const { search, hash, token } = withoutToken(url);
  const target = !section || section === "connexion" || !SECTIONS.has(section) ? `/public/${slug}/accueil` : `${path}${search}${hash}`;
  if (token) return { kind: "bootstrap", clubSlug: slug, token, path: target };
  return { kind: "navigate", clubSlug: slug, path: target };
}

/**
 * Anti-doublon : au démarrage à froid, iOS peut livrer la même URL deux fois
 * (`getLaunchUrl` puis `appUrlOpen`). Une URL identique dans la fenêtre est ignorée.
 */
export function createDeduper(windowMs = 3000, now: () => number = Date.now) {
  let last: { url: string; at: number } | null = null;
  return (url: string): boolean => {
    const t = now();
    if (last && last.url === url && t - last.at < windowMs) return false;
    last = { url, at: t };
    return true;
  };
}
