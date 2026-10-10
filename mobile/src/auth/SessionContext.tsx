import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setPublicCredentialTransport } from "@/lib/api/publicTokenTransport";
import { sessionStore, type SessionState } from "./session-store";

/**
 * État des sessions (Keychain) partagé par l'app, et transport : chaque appel
 * de l'espace public fait avec une référence `as:<licencieId>` part avec la
 * session d'appareil du club de cette personne — jamais un jeton personnel.
 */
export const ACT_AS = "as:";

export function personRef(licencieId: string): string {
  return `${ACT_AS}${licencieId}`;
}

export function installCredentialTransport(): void {
  setPublicCredentialTransport((token) => {
    if (!token.startsWith(ACT_AS)) return null;
    const licencieId = token.slice(ACT_AS.length);
    const club = Object.values(sessionStore.current().clubs).find((c) => c.people.some((p) => p.licencieId === licencieId));
    return club ? { Authorization: `Bearer ${club.secret}`, "X-BM-As": licencieId } : null;
  });
}

const Ctx = createContext<{ state: SessionState | null }>({ state: null });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState | null>(null);
  useEffect(() => {
    installCredentialTransport();
    let alive = true;
    void sessionStore.load().then((s) => alive && setState(s));
    const off = sessionStore.subscribe((s) => setState(s));
    return () => {
      alive = false;
      off();
    };
  }, []);
  return <Ctx.Provider value={{ state }}>{children}</Ctx.Provider>;
}

/** `null` pendant la lecture du Keychain au démarrage. */
export function useSessions(): SessionState | null {
  return useContext(Ctx).state;
}
