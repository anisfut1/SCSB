/**
 * En-têtes de sécurité HTTP (LOT-14, partie CSP). Module PUR : aucune lecture
 * d'environnement ici, importable depuis `next.config.ts` comme depuis les tests.
 *
 * La CSP est volontairement publiée en **`Content-Security-Policy-Report-Only`
 * uniquement** : elle ne bloque rien, elle permet de mesurer ce qu'un blocage
 * casserait avant toute application. Passage en mode bloquant = décision
 * séparée (docs/migration/12-csp-report-only.md).
 *
 * Choix « sans nonce » (docs Next, node_modules/next/dist/docs/01-app/02-guides/
 * content-security-policy.md, § « Without Nonces ») : `'unsafe-inline'` pour les
 * scripts et styles, car Next injecte des scripts inline d'hydratation et que
 * l'application utilise des attributs `style` (VenuePlanning.tsx:91-152,
 * app/page.tsx:68). Un nonce par requête (proxy.ts) serait nécessaire pour une
 * CSP bloquante stricte ; il impose le rendu dynamique, déjà le cas ici.
 */

export interface SecurityHeadersOptions {
  /** `NEXT_PUBLIC_SUPABASE_URL` (authentification navigateur, src/lib/supabase/browser.ts:11). */
  supabaseUrl?: string;
  /** `NEXT_PUBLIC_CLUB_MANAGER_API_URL` (client HTTP, src/lib/api/client.ts:47). */
  apiUrl?: string;
  /** Origines supplémentaires autorisées en `connect-src` (ex. le nouveau back, plus tard). */
  extraConnectOrigins?: readonly string[];
  /** `next dev` exige `'unsafe-eval'` (docs Next, « Development vs Production »). */
  isDev?: boolean;
}

export interface HeaderEntry {
  key: string;
  value: string;
}

/** Origine (`https://hôte[:port]`) d'une URL, ou `null` si absente ou invalide : une variable mal formée ne casse jamais le build. */
export function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

export function buildCspReportOnly(options: SecurityHeadersOptions = {}): string {
  const connect = ["'self'", ...[originOf(options.supabaseUrl), originOf(options.apiUrl), ...(options.extraConnectOrigins ?? []).map(originOf)].filter((o): o is string => o !== null)];
  const unique = (list: string[]) => [...new Set(list)];

  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...(options.isDev ? ["'unsafe-eval'"] : [])]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    // Images : `data:` (logo de club téléversé converti en data URL, ClubAppearanceForm.tsx:19,50) et `blob:`.
    // Logos DISTANTS (<img src> d'hôtes hétérogènes : Logo.tsx:56-57, Avatar.tsx:11) volontairement NON autorisés
    // ici : en Report-Only, chaque hôte réel apparaît dans la console du navigateur comme une violation, ce qui
    // permet d'établir la liste exacte avant d'en décider (docs/migration/12-csp-report-only.md, décision 1).
    ["img-src", ["'self'", "data:", "blob:"]],
    // next/font/google télécharge les polices au build et les sert depuis 'self' (src/app/layout.tsx:3-26).
    ["font-src", ["'self'"]],
    ["connect-src", unique(connect)],
    ["frame-src", ["'none'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];

  return directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");
}

/**
 * Anti-clickjacking APPLIQUÉ (Q-021 décision 2, 2026-10-07). Une directive
 * `frame-ancestors` placée dans un en-tête `Report-Only` n'est pas garantie
 * d'être évaluée : elle est donc posée dans un en-tête `Content-Security-Policy`
 * séparé qui ne contient QUE cette directive (il ne bloque rien d'autre ; le
 * reste de la politique reste en Report-Only). `X-Frame-Options` couvre les
 * navigateurs qui ignoreraient la CSP.
 */
export const FRAME_ANCESTORS_ENFORCED = "frame-ancestors 'none'";

/**
 * En-têtes posés sur toutes les réponses. La CSP complète est en `Report-Only` ;
 * seul `frame-ancestors 'none'` est appliqué (voir ci-dessus).
 * Volontairement ABSENTS (décisions du propriétaire, docs/migration/12-csp-report-only.md) :
 * `Strict-Transport-Security` (laissé à Vercel, Q-021 décision 3), COOP/COEP,
 * et tout `report-uri`/`report-to` (aucun collecteur ; un rapport contiendrait
 * l'URL du document, donc un éventuel `?token=` — R-014).
 */
export function securityHeaders(options: SecurityHeadersOptions = {}): HeaderEntry[] {
  return [
    { key: "Content-Security-Policy-Report-Only", value: buildCspReportOnly(options) },
    { key: "Content-Security-Policy", value: FRAME_ANCESTORS_ENFORCED },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Explicite : limite l'URL envoyée en `Referer` entre origines (R-014). C'est déjà le défaut des navigateurs récents.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Aucune caméra/micro/géolocalisation n'est utilisée (aucun getUserMedia / navigator.geolocation dans src/).
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
}
