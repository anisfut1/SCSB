import { PushNotifications, type PushNotificationSchema } from "@capacitor/push-notifications";
import { deviceAuth } from "@/lib/api/deviceAuth";
import { BMNative, isNativeApp } from "../native/bm-native";
import type { ClubSession } from "../auth/session-store";

/**
 * Notifications APNs (docs/IOS_PUSH.md). La permission n'est JAMAIS demandée
 * au lancement : seulement après connexion, depuis un écran qui explique
 * pourquoi (« Recevez vos convocations et changements de match »).
 *
 * Environnement APNs : `development` pour les builds Debug (sandbox),
 * `production` pour TestFlight / App Store — fixé au build (BM_APNS_ENV).
 */
const APNS_ENV = ((import.meta.env.BM_APNS_ENV as string | undefined) === "development" ? "development" : "production") as "development" | "production";

export type PushPermission = "granted" | "denied" | "prompt" | "unavailable";

export async function pushPermission(): Promise<PushPermission> {
  if (!isNativeApp()) return "unavailable";
  const { receive } = await PushNotifications.checkPermissions();
  return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
}

/** Jeton APNs de cet iPhone (une seule inscription en attente à la fois). */
function nextToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const subs: Promise<{ remove: () => Promise<void> }>[] = [];
    const done = () => subs.forEach((s) => void s.then((x) => x.remove()));
    subs.push(PushNotifications.addListener("registration", (t) => (done(), resolve(t.value))));
    subs.push(PushNotifications.addListener("registrationError", (e) => (done(), reject(new Error(e.error)))));
  });
}

/** Demande la permission (geste de l'utilisateur) puis rattache le jeton à chaque session de l'appareil. */
export async function enablePush(sessions: ClubSession[]): Promise<PushPermission> {
  if (!isNativeApp()) return "unavailable";
  let status = await pushPermission();
  if (status === "prompt") status = (await PushNotifications.requestPermissions()).receive === "granted" ? "granted" : "denied";
  if (status !== "granted") return status;
  const pending = nextToken();
  await PushNotifications.register();
  const token = await pending;
  const appVersion = (import.meta.env.BM_APP_VERSION as string | undefined) ?? "1.0.0";
  await Promise.all(sessions.map((s) => deviceAuth.registerPushToken(s.clubSlug, s.secret, { token, environment: APNS_ENV, appVersion }).catch(() => undefined)));
  return "granted";
}

/** Au démarrage, si la permission est déjà accordée : le jeton peut avoir changé (réinstallation, restauration). */
export async function refreshPushRegistration(sessions: ClubSession[]): Promise<void> {
  if ((await pushPermission()) === "granted" && sessions.length) await enablePush(sessions).catch(() => undefined);
}

export async function disablePushFor(session: ClubSession): Promise<void> {
  await deviceAuth.removePushToken(session.clubSlug, session.secret).catch(() => undefined);
}

/** Notification touchée (app fermée, en arrière-plan ou au premier plan) → destination logique, même routeur que les liens. */
export function onPushTap(handler: (path: string) => void): () => void {
  if (!isNativeApp()) return () => undefined;
  const sub = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const path = (action.notification.data as { path?: unknown } | undefined)?.path;
    if (typeof path === "string" && path.startsWith("/public/")) handler(path);
  });
  return () => void sub.then((s) => s.remove());
}

/** Notification reçue app ouverte : affichée par iOS (presentationOptions) ; l'écran se rafraîchit. */
export function onPushReceived(handler: (notification: PushNotificationSchema) => void): () => void {
  if (!isNativeApp()) return () => undefined;
  const sub = PushNotifications.addListener("pushNotificationReceived", handler);
  return () => void sub.then((s) => s.remove());
}

export async function clearBadge(): Promise<void> {
  if (!isNativeApp()) return;
  await BMNative.clearBadge().catch(() => undefined);
  await PushNotifications.removeAllDeliveredNotifications().catch(() => undefined);
}
