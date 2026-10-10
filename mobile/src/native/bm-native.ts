import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Plugin natif de l'app (Swift, mobile/ios/App/App/BMNativePlugin.swift) :
 *  - Keychain : secret de session (kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly) ;
 *  - ASWebAuthenticationSession : « Continuer avec Ball Manager » depuis Safari ;
 *  - PKCE : verifier / challenge / state générés en natif (CryptoKit) ;
 *  - badge de l'icône.
 */
export interface BMNativePlugin {
  secureGet(options: { key: string }): Promise<{ value: string | null }>;
  secureSet(options: { key: string; value: string }): Promise<void>;
  secureRemove(options: { key: string }): Promise<void>;
  createPkce(): Promise<{ verifier: string; challenge: string; state: string }>;
  webAuth(options: { url: string; callbackScheme: string }): Promise<{ url: string }>;
  clearBadge(): Promise<void>;
}

export const BMNative = registerPlugin<BMNativePlugin>("BMNative");

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Hors iOS (développement dans un navigateur, `npm run dev`) : stockage de
 * SESSION du navigateur uniquement, jamais en production — l'app iOS passe
 * toujours par le Keychain.
 */
export const secureStore = {
  async get(key: string): Promise<string | null> {
    if (isNativeApp()) return (await BMNative.secureGet({ key })).value;
    try {
      return window.sessionStorage.getItem(`dev:${key}`);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (isNativeApp()) return BMNative.secureSet({ key, value });
    try {
      window.sessionStorage.setItem(`dev:${key}`, value);
    } catch {
      // Navigation privée : session non mémorisée en développement.
    }
  },
  async remove(key: string): Promise<void> {
    if (isNativeApp()) return BMNative.secureRemove({ key });
    try {
      window.sessionStorage.removeItem(`dev:${key}`);
    } catch {
      // Rien à faire.
    }
  },
};
