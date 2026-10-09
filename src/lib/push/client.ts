/**
 * Infrastructure Web Push côté navigateur — PRÉPARÉE, NON ACTIVE.
 *
 * Rien n'est branché dans l'interface et aucune notification n'est envoyée :
 * il n'y a ni clé VAPID, ni endpoint d'enregistrement, ni service d'envoi.
 * Activation prévue = `NEXT_PUBLIC_PUSH_ENABLED=1` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
 * + les endpoints décrits dans docs/PWA_PUSH.md. Web Push est gratuit (aucun
 * service tiers payant : l'envoi passe par les serveurs push d'Apple/Google/Mozilla).
 *
 * Contraintes plateforme : sur iPhone, Web Push n'existe qu'à partir d'iOS 16.4
 * ET uniquement pour une PWA INSTALLÉE ; la permission doit être demandée sur un
 * geste de l'utilisateur, jamais au chargement.
 */

export type PushSupport = "supported" | "needs-install" | "unsupported";

export function pushEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PUSH_ENABLED === "1" && Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

export function getPushSupport(env: { standalone: boolean; os: "ios" | "android" | "other" }): PushSupport {
  const capable = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!capable) return env.os === "ios" && !env.standalone ? "needs-install" : "unsupported";
  if (env.os === "ios" && !env.standalone) return "needs-install";
  return "supported";
}

/** Clé VAPID publique (base64url) → octets attendus par `pushManager.subscribe`. */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=");
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Abonnement sérialisable envoyé au serveur (jamais contenu personnel). */
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** Libellé d'appareil lisible pour la liste « Mes appareils » (ex. « iPhone · PWA »). */
  deviceLabel: string;
}

/** Demande la permission (à appeler depuis un clic) puis crée l'abonnement. `null` si refusé ou désactivé. */
export async function subscribeToPush(deviceLabel: string): Promise<PushSubscriptionPayload | null> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!pushEnabled() || !key) return null;
  if ((await Notification.requestPermission()) !== "granted") return null;
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }, deviceLabel };
}

/** Désabonne CET appareil ; renvoie l'endpoint à supprimer côté serveur, ou `null`. */
export async function unsubscribeFromPush(): Promise<string | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}
