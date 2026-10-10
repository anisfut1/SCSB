import { apiFetch } from "./client";
import type { components } from "./generated/schema";

/**
 * Authentification de l'app iOS (ball-manager-back/docs/MOBILE_AUTH.md).
 * Utilisé par l'app (mobile/) et par deux pages web : `/public/{slug}/auth/app`
 * (connexion depuis Safari) et `/public/{slug}/connexion/code/{code}`.
 */
export type DeviceSessionDto = components["schemas"]["DeviceSessionDto"];
export type SessionInfoDto = components["schemas"]["SessionInfoDto"];
export type SessionPersonDto = components["schemas"]["SessionPersonDto"];
export type AuthCodeDto = components["schemas"]["AuthCodeDto"];
export type PublicClubListDto = components["schemas"]["PublicClubListDto"];

const base = (clubSlug: string) => `/v1/public/clubs/${encodeURIComponent(clubSlug)}/auth`;
const bearer = (secret: string) => ({ Authorization: `Bearer ${secret}` });

export const deviceAuth = {
  listClubs: () => apiFetch<PublicClubListDto>("/v1/public/clubs"),
  /** App : amorçage depuis un lien personnel reçu (le jeton n'est pas conservé). */
  createSession: (clubSlug: string, tokens: string[], meta: { appVersion?: string; deviceLabel?: string } = {}) =>
    apiFetch<DeviceSessionDto>(`${base(clubSlug)}/device-sessions`, { method: "POST", body: { tokens, platform: "ios", ...meta } }),
  session: (clubSlug: string, secret: string) => apiFetch<SessionInfoDto>(`${base(clubSlug)}/session`, { headers: bearer(secret) }),
  logout: (clubSlug: string, secret: string) => apiFetch<void>(`${base(clubSlug)}/session`, { method: "DELETE", headers: bearer(secret) }),
  addPeople: (clubSlug: string, secret: string, tokens: string[]) => apiFetch<SessionInfoDto>(`${base(clubSlug)}/session/people`, { method: "POST", headers: bearer(secret), body: { tokens } }),
  removePerson: (clubSlug: string, secret: string, licencieId: string) => apiFetch<void>(`${base(clubSlug)}/session/people/${encodeURIComponent(licencieId)}`, { method: "DELETE", headers: bearer(secret) }),
  /** Web (page ouverte par l'app dans Safari) : code court lié au PKCE de l'app. */
  createSsoCode: (clubSlug: string, tokens: string[], codeChallenge: string, redirectPath?: string) =>
    apiFetch<AuthCodeDto>(`${base(clubSlug)}/codes`, { method: "POST", body: { tokens, codeChallenge, codeChallengeMethod: "S256", redirectPath } }),
  /** App : code (Safari + PKCE, ou lien de connexion) → session d'appareil. */
  exchangeForApp: (clubSlug: string, code: string, codeVerifier?: string, meta: { appVersion?: string; deviceLabel?: string } = {}) =>
    apiFetch<DeviceSessionDto>(`${base(clubSlug)}/token`, { method: "POST", body: { code, codeVerifier, platform: "ios", ...meta } }),
  /** Notifications (APNs) : jeton de l'iPhone rattaché à CETTE session d'appareil (jamais à un club en double). */
  registerPushToken: (clubSlug: string, secret: string, body: { token: string; environment: "development" | "production"; appVersion?: string }) =>
    apiFetch<void>(`${base(clubSlug)}/session/push-token`, { method: "PUT", headers: bearer(secret), body }),
  removePushToken: (clubSlug: string, secret: string) => apiFetch<void>(`${base(clubSlug)}/session/push-token`, { method: "DELETE", headers: bearer(secret) }),
  /** Web : lien de connexion par email → lien personnel pour la session web existante. */
  exchangeForWeb: (clubSlug: string, code: string) => apiFetch<{ tokens: string[]; redirectPath: string | null }>(`${base(clubSlug)}/token`, { method: "POST", body: { code, platform: "web" } }),
};
