import { secureStore } from "../native/bm-native";

/**
 * Sessions d'appareil de l'app, une par club (SaaS multi-club : une seule app
 * pour tous les clubs). Rangées dans le KEYCHAIN iOS (jamais localStorage,
 * jamais un journal). Le secret de session n'est jamais le lien personnel.
 */
export interface SessionPerson {
  licencieId: string;
  firstName: string;
  lastName: string;
  teamId: string | null;
}

export interface ClubSession {
  clubSlug: string;
  clubName: string;
  secret: string;
  people: SessionPerson[];
  activeLicencieId: string | null;
}

export interface SessionState {
  v: 1;
  active: string | null;
  clubs: Record<string, ClubSession>;
}

const KEY = "bm.sessions.v1";
const EMPTY: SessionState = { v: 1, active: null, clubs: {} };

export function parseState(raw: string | null): SessionState {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (parsed?.v !== 1 || typeof parsed.clubs !== "object") return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

/** Personne active valide (sinon la première de la session). */
export function activePerson(session: ClubSession): SessionPerson | null {
  return session.people.find((p) => p.licencieId === session.activeLicencieId) ?? session.people[0] ?? null;
}

export function withClub(state: SessionState, session: ClubSession, makeActive = true): SessionState {
  return { v: 1, active: makeActive ? session.clubSlug : (state.active ?? session.clubSlug), clubs: { ...state.clubs, [session.clubSlug]: session } };
}

export function withoutClub(state: SessionState, clubSlug: string): SessionState {
  const clubs = { ...state.clubs };
  delete clubs[clubSlug];
  const active = state.active === clubSlug ? (Object.keys(clubs)[0] ?? null) : state.active;
  return { v: 1, active, clubs };
}

let cache: SessionState | null = null;
const listeners = new Set<(s: SessionState) => void>();

export const sessionStore = {
  async load(): Promise<SessionState> {
    if (!cache) cache = parseState(await secureStore.get(KEY));
    return cache;
  },
  current(): SessionState {
    return cache ?? EMPTY;
  },
  async save(next: SessionState): Promise<void> {
    cache = next;
    if (Object.keys(next.clubs).length === 0) await secureStore.remove(KEY);
    else await secureStore.set(KEY, JSON.stringify(next));
    for (const l of listeners) l(next);
  },
  subscribe(listener: (s: SessionState) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
