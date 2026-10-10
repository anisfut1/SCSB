/**
 * Liens externes : tout ce qui n'est pas l'espace public de Ball Manager
 * s'ouvre hors de l'app (Safari, Mail, Téléphone). Capacitor ouvre dans le
 * système toute navigation vers un hôte qui n'est pas celui de l'app.
 */
const OFFICIAL_HOSTS = new Set(["www.ball-manager.fr", "ball-manager.fr"]);

export function isInternalHref(href: string): boolean {
  if (href.startsWith("#")) return true;
  if (href.startsWith("/")) return href === "/" || href.startsWith("/public/") || href.startsWith("/app/");
  return false;
}

export function webUrl(path: string): string {
  return `https://www.ball-manager.fr${path.startsWith("/") ? path : `/${path}`}`;
}

export function openExternal(href: string): void {
  // `/c/*` (espace club par compte), `/login`… : sur le site, dans Safari.
  const url = href.startsWith("/") ? webUrl(href) : href;
  window.open(url, "_blank", "noopener");
}

export { OFFICIAL_HOSTS };
