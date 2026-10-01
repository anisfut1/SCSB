"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getPublicMe } from "@/lib/api/publicTables";
import { clearStoredPublicToken, getStoredPublicToken, setStoredPublicToken } from "@/lib/publicToken";

export interface PublicIdentity {
  token: string;
  licencie: { id: string; firstName: string; lastName: string };
  isClubAdmin: boolean;
  /** Demandes de dérogation internes : coach / coordinateur (rôles posés depuis /joueurs). */
  derogationRequests: { canCreate: boolean; canManage: boolean };
}

/** `undefined` = résolution en cours, `null` = aucun lien reconnu, sinon identité résolue. */
export type PublicIdentityState = PublicIdentity | null | undefined;

function tokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get("token");
}

/**
 * Retire `?token=` de la barre d'adresse une fois le lien mémorisé dans ce
 * navigateur : évite qu'une capture d'écran ou un lien recopié depuis la
 * barre d'adresse partage involontairement le lien personnel.
 */
function stripTokenFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("token")) return;
  url.searchParams.delete("token");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

interface PublicIdentityContextValue {
  clubSlug: string;
  identity: PublicIdentityState;
  /** Oublie le lien mémorisé dans CE navigateur (le lien de l'email reste valable ailleurs). */
  forget: () => void;
}

const PublicIdentityContext = createContext<PublicIdentityContextValue | null>(null);

/**
 * Identité de l'espace public sans compte, partagée par tous les onglets
 * (Matchs, Tables, Dérogations) et résolue UNE fois par le layout public :
 * lien de l'email (`?token=`) ou lien déjà mémorisé dans ce navigateur,
 * toujours revalidé par `GET /v1/public/clubs/:slug/me` — jamais une
 * identité supposée côté client.
 */
export function PublicIdentityProvider({ clubSlug, children }: { clubSlug: string; children: ReactNode }) {
  const [identity, setIdentity] = useState<PublicIdentityState>(undefined);

  useEffect(() => {
    let cancelled = false;
    const candidate = tokenFromUrl() ?? getStoredPublicToken(clubSlug);
    if (!candidate) {
      // Résolu en microtâche : jamais de setState synchrone dans un effet.
      void Promise.resolve().then(() => {
        if (!cancelled) setIdentity(null);
      });
      return () => {
        cancelled = true;
      };
    }

    getPublicMe(clubSlug, candidate)
      .then((result) => {
        if (cancelled) return;
        setStoredPublicToken(clubSlug, candidate);
        stripTokenFromUrl();
        setIdentity({ token: candidate, licencie: result.licencie, isClubAdmin: result.isClubAdmin, derogationRequests: result.derogationRequests });
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredPublicToken(clubSlug);
        stripTokenFromUrl();
        setIdentity(null);
      });

    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  const forget = useCallback(() => {
    clearStoredPublicToken(clubSlug);
    setIdentity(null);
  }, [clubSlug]);

  const value = useMemo(() => ({ clubSlug, identity, forget }), [clubSlug, identity, forget]);
  return <PublicIdentityContext.Provider value={value}>{children}</PublicIdentityContext.Provider>;
}

export function usePublicIdentity(): PublicIdentityContextValue {
  const value = useContext(PublicIdentityContext);
  if (!value) throw new Error("usePublicIdentity doit être utilisé sous <PublicIdentityProvider> (layout /public/[clubSlug]).");
  return value;
}
