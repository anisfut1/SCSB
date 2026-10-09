/**
 * Détection d'appareil / navigateur pour le parcours d'installation (fonctions
 * PURES sur des chaînes, testables sans DOM). L'user-agent n'est qu'un
 * indice : chaque cas incertain retombe sur le tutoriel générique.
 */

export type InstallOs = "ios" | "android" | "other";
export type InstallBrowser = "safari" | "chrome" | "firefox" | "edge" | "samsung" | "other";

export interface InstallEnvironment {
  os: InstallOs;
  browser: InstallBrowser;
  /** Navigateur intégré d'une autre application (Instagram, Facebook, TikTok…) : l'installation y est impossible. */
  inAppBrowser: string | null;
  /** Déjà lancée comme application installée. */
  standalone: boolean;
}

/** Applications dont le navigateur intégré s'annonce dans l'user-agent. WhatsApp est traité à part (voir `mayBeWhatsAppView`). */
const IN_APP: Array<[RegExp, string]> = [
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB/i, "Facebook"],
  [/Messenger/i, "Messenger"],
  [/TikTok|musical_ly|BytedanceWebview/i, "TikTok"],
  [/Snapchat/i, "Snapchat"],
  [/LinkedInApp/i, "LinkedIn"],
  [/Line\//i, "LINE"],
  [/Twitter|TwitterAndroid/i, "X"],
  [/WhatsApp/i, "WhatsApp"],
];

export function detectInstallEnvironment(input: { userAgent: string; platform?: string; maxTouchPoints?: number; standalone?: boolean }): InstallEnvironment {
  const ua = input.userAgent;
  // iPadOS 13+ se présente comme un Mac : seul le tactile le distingue.
  const isIpadOs = /Macintosh/i.test(ua) && (input.maxTouchPoints ?? 0) > 1;
  const os: InstallOs = /iPhone|iPad|iPod/i.test(ua) || isIpadOs ? "ios" : /Android/i.test(ua) ? "android" : "other";

  const inApp = IN_APP.find(([re]) => re.test(ua));
  let browser: InstallBrowser = "other";
  if (/SamsungBrowser/i.test(ua)) browser = "samsung";
  else if (/EdgA|EdgiOS|Edg\//i.test(ua)) browser = "edge";
  else if (/FxiOS|Firefox/i.test(ua)) browser = "firefox";
  else if (/CriOS|Chrome\//i.test(ua)) browser = "chrome";
  else if (/Safari\//i.test(ua) && os === "ios") browser = "safari";

  // Vue web intégrée sans marqueur (WKWebView / WebView Android « wv ») : pas de « Safari/ » sur iOS, « ; wv) » sur Android.
  const bareWebView = os === "ios" ? /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua) : os === "android" && /; wv\)/i.test(ua);

  return { os, browser, inAppBrowser: inApp ? inApp[1] : bareWebView ? "une autre application" : null, standalone: input.standalone === true };
}

/** Lit l'environnement réel du navigateur (client uniquement). */
export function readInstallEnvironment(): InstallEnvironment {
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches;
  return detectInstallEnvironment({ userAgent: nav.userAgent, platform: nav.platform, maxTouchPoints: nav.maxTouchPoints, standalone });
}

/**
 * iOS : seul Safari peut ajouter à l'écran d'accueil de façon fiable avec
 * cookies copiés ; Chrome/Firefox/Edge iOS le permettent aussi depuis iOS 16.4
 * mais sans garantie de transfert de session — on recommande Safari.
 */
export function iosNeedsSafari(env: InstallEnvironment): boolean {
  return env.os === "ios" && (env.inAppBrowser !== null || env.browser !== "safari");
}
