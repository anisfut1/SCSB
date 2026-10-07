"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getPublicMe } from "@/lib/api/publicTables";
import { clearStoredPublicToken, consumePublicTokenFromUrl, getStoredPublicToken, resetConsumedPublicToken, setStoredPublicToken } from "@/lib/publicToken";
import { KNOWN_COOKIE } from "./known-cookie";

export interface PublicIdentity {
  token: string;
  licencie: { id: string; firstName: string; lastName: string };
  isClubAdmin: boolean;
  /** Demandes de dérogation internes : coach / coordinateur (rôles posés depuis /joueurs). */
  derogationRequests: { canCreate: boolean; canManage: boolean };
  /** Tables de marque : coach ou admin du club → désigne / retire n'importe qui (retour du club, 2026-10-02). */
  tables: { canManage: boolean };
}

/** `undefined` = résolution en cours, `null` = aucun lien reconnu, sinon identité résolue. */
export type PublicIdentityState = PublicIdentity | null | undefined;

/**
 * Marqueur « déjà reconnu sur ce navigateur » (jamais le jeton) lu côté
 * serveur par `/public/{slug}` : accueil pour un licencié reconnu, pages
 * publiques pour tous les autres — robots d'indexation compris.
 */

function setKnownCookie(clubSlug: string, known: boolean): void {
  try {
    document.cookie = `${KNOWN_COOKIE}=${known ? "1" : ""}; Path=/public/${clubSlug}; Max-Age=${known ? 60 * 60 * 24 * 365 : 0}; SameSite=Lax`;
  } catch {
    // Cookies bloqués : l'entrée retombe simplement sur les pages publiques.
  }
}

export interface PublicClubInfo {
  name: string;
  logoUrl: string | null;
}

interface PublicIdentityContextValue {
  clubSlug: string;
  club: PublicClubInfo;
  identity: PublicIdentityState;
  /** Oublie le lien mémorisé dans CE navigateur (le lien de l'email reste valable ailleurs). */
  forget: () => void;
}

const PublicIdentityContext = createContext<PublicIdentityContextValue | null>(null);

/**
 * Identité de l'espace public sans compte, partagée par tous les onglets
 * (Matchs, Tables, Dérogations) et résolue UNE fois par le layout public :
 * lien de l'email (`#token=`, ou `?token=` des liens déjà envoyés ; retiré de l'URL dès sa lecture) ou lien déjà mémorisé dans ce navigateur,
 * toujours revalidé par `GET /v1/public/clubs/:slug/me` — jamais une
 * identité supposée côté client.
 */
export function PublicIdentityProvider({ clubSlug, club, children }: { clubSlug: string; club: PublicClubInfo; children: ReactNode }) {
  const [identity, setIdentity] = useState<PublicIdentityState>(undefined);

  useEffect(() => {
    let cancelled = false;
    const candidate = consumePublicTokenFromUrl() ?? getStoredPublicToken(clubSlug);
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
        setKnownCookie(clubSlug, true);
        setIdentity({ token: candidate, licencie: result.licencie, isClubAdmin: result.isClubAdmin, derogationRequests: result.derogationRequests, tables: result.tables });
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredPublicToken(clubSlug);
        resetConsumedPublicToken();
        setKnownCookie(clubSlug, false);
        setIdentity(null);
      });

    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  const forget = useCallback(() => {
    clearStoredPublicToken(clubSlug);
    resetConsumedPublicToken();
    setKnownCookie(clubSlug, false);
    setIdentity(null);
  }, [clubSlug]);

  const { name: clubName, logoUrl: clubLogoUrl } = club;
  const value = useMemo(() => ({ clubSlug, club: { name: clubName, logoUrl: clubLogoUrl }, identity, forget }), [clubSlug, clubName, clubLogoUrl, identity, forget]);
  return <PublicIdentityContext.Provider value={value}>{children}</PublicIdentityContext.Provider>;
}

export function usePublicIdentity(): PublicIdentityContextValue {
  const value = useContext(PublicIdentityContext);
  if (!value) throw new Error("usePublicIdentity doit être utilisé sous <PublicIdentityProvider> (layout /public/[clubSlug]).");
  return value;
}
