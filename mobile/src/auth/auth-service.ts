import { deviceAuth, type DeviceSessionDto } from "@/lib/api/deviceAuth";
import { getPublicClub } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/errors";
import { BMNative, isNativeApp } from "../native/bm-native";
import { webUrl } from "../links/external";
import { sessionStore, withClub, withoutClub, type ClubSession } from "./session-store";
import { APP_CALLBACK, APP_CALLBACK_SCHEME, parseCallback } from "./callback";

/**
 * Connexion de l'app (docs/IOS_SECURITY.md). Trois entrées, une seule sortie :
 * une session d'appareil rangée dans le Keychain.
 *  1. lien personnel reçu (Universal Link) → `bootstrapFromToken` ;
 *  2. lien de connexion à usage unique → `loginWithCode` ;
 *  3. « Continuer avec Ball Manager » (Safari, ASWebAuthenticationSession + PKCE) → `ssoLogin`.
 * Le jeton personnel n'est JAMAIS conservé par l'app.
 */
const meta = () => ({ appVersion: (import.meta.env.BM_APP_VERSION as string | undefined) ?? "1.0.0", deviceLabel: "iPhone" });

async function store(clubSlug: string, dto: DeviceSessionDto, clubName?: string): Promise<ClubSession> {
  const name = clubName ?? (await getPublicClub(clubSlug).then((c) => c.name).catch(() => clubSlug));
  const session: ClubSession = { clubSlug, clubName: name, secret: dto.sessionSecret, people: dto.people, activeLicencieId: dto.people[0]?.licencieId ?? null };
  await sessionStore.save(withClub(await sessionStore.load(), session));
  return session;
}

export async function bootstrapFromToken(clubSlug: string, token: string): Promise<void> {
  const state = await sessionStore.load();
  const existing = state.clubs[clubSlug];
  if (existing) {
    // Déjà connecté à ce club : le lien ajoute la personne (ex. un autre enfant) à l'appareil.
    const info = await deviceAuth.addPeople(clubSlug, existing.secret, [token]);
    await sessionStore.save(withClub(state, { ...existing, people: info.people }));
    return;
  }
  await store(clubSlug, await deviceAuth.createSession(clubSlug, [token], meta()));
}

export async function loginWithCode(clubSlug: string, code: string): Promise<string | null> {
  const dto = await deviceAuth.exchangeForApp(clubSlug, code, undefined, meta());
  await store(clubSlug, dto);
  return dto.redirectPath;
}

/** PKCE hors iOS (développement navigateur) : Web Crypto. */
async function browserPkce(): Promise<{ verifier: string; challenge: string; state: string }> {
  const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const verifier = b64(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  return { verifier, challenge, state: b64(crypto.getRandomValues(new Uint8Array(16))) };
}

export async function ssoLogin(clubSlug: string, redirectPath?: string): Promise<string | null> {
  if (!isNativeApp()) throw new Error("La connexion depuis Safari n'est disponible que dans l'app iOS.");
  const pkce = await BMNative.createPkce();
  const query = new URLSearchParams({ code_challenge: pkce.challenge, code_challenge_method: "S256", state: pkce.state, redirect_uri: APP_CALLBACK, ...(redirectPath ? { redirect_path: redirectPath } : {}) });
  const { url } = await BMNative.webAuth({ url: webUrl(`/public/${clubSlug}/auth/app?${query.toString()}`), callbackScheme: APP_CALLBACK_SCHEME });
  const { code } = parseCallback(url, pkce.state);
  const dto = await deviceAuth.exchangeForApp(clubSlug, code, pkce.verifier, meta());
  await store(clubSlug, dto);
  return dto.redirectPath;
}

export { browserPkce };

/** Personnes de la session (au démarrage). Session révoquée / expirée : oubliée sur l'appareil. */
export async function refreshClub(clubSlug: string): Promise<ClubSession | null> {
  const state = await sessionStore.load();
  const session = state.clubs[clubSlug];
  if (!session) return null;
  try {
    const info = await deviceAuth.session(clubSlug, session.secret);
    const next = { ...session, people: info.people };
    await sessionStore.save(withClub(state, next, state.active === clubSlug));
    return next;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await sessionStore.save(withoutClub(state, clubSlug));
      return null;
    }
    return session; // Hors ligne : on garde la session, l'écran affichera l'état réseau.
  }
}

export async function logout(clubSlug: string, onBeforeRevoke?: (session: ClubSession) => Promise<void>): Promise<void> {
  const state = await sessionStore.load();
  const session = state.clubs[clubSlug];
  if (session) {
    await onBeforeRevoke?.(session).catch(() => undefined);
    await deviceAuth.logout(clubSlug, session.secret).catch(() => undefined);
  }
  await sessionStore.save(withoutClub(state, clubSlug));
}

export async function removePerson(clubSlug: string, licencieId: string): Promise<void> {
  const state = await sessionStore.load();
  const session = state.clubs[clubSlug];
  if (!session) return;
  await deviceAuth.removePerson(clubSlug, session.secret, licencieId);
  const people = session.people.filter((p) => p.licencieId !== licencieId);
  if (people.length === 0) return logout(clubSlug);
  await sessionStore.save(withClub(state, { ...session, people, activeLicencieId: session.activeLicencieId === licencieId ? people[0]!.licencieId : session.activeLicencieId }, state.active === clubSlug));
}

export async function setActivePerson(clubSlug: string, licencieId: string): Promise<void> {
  const state = await sessionStore.load();
  const session = state.clubs[clubSlug];
  if (session) await sessionStore.save(withClub(state, { ...session, activeLicencieId: licencieId }, state.active === clubSlug));
}

export async function setActiveClub(clubSlug: string): Promise<void> {
  const state = await sessionStore.load();
  if (state.clubs[clubSlug]) await sessionStore.save({ ...state, active: clubSlug });
}
