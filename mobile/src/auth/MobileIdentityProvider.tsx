import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { PublicIdentityContext, type PublicIdentityContextValue, type PublicIdentityState } from "@/features/public/PublicIdentityProvider";
import { getPublicMe } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/errors";
import { setSessionDeviceTokens } from "@/lib/publicToken";
import { activePerson, type ClubSession } from "./session-store";
import { personRef, ACT_AS } from "./SessionContext";
import { logout, refreshClub, removePerson, setActivePerson } from "./auth-service";

/**
 * Même identité que le web (`usePublicIdentity`), fournie à partir de la
 * session d'appareil : tous les écrans partagés (accueil, match, équipe,
 * dérogations, tables…) fonctionnent tels quels. `identity.token` est une
 * RÉFÉRENCE (`as:<licencieId>`), jamais un jeton personnel.
 */
export function MobileIdentityProvider({ session, children }: { session: ClubSession; children: ReactNode }) {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<PublicIdentityState>(undefined);
  const person = activePerson(session);
  const clubSlug = session.clubSlug;
  const refs = useMemo(() => session.people.map((p) => personRef(p.licencieId)), [session.people]);
  const activeRef = person ? personRef(person.licencieId) : null;

  useEffect(() => {
    // Plusieurs enfants : l'accueil « À faire » et le planning les fusionnent (comme les liens de l'appareil sur le web).
    setSessionDeviceTokens(clubSlug, activeRef ? [activeRef, ...refs.filter((r) => r !== activeRef)] : refs);
  }, [clubSlug, refs, activeRef]);

  useEffect(() => {
    if (!activeRef) return;
    let cancelled = false;
    getPublicMe(clubSlug, activeRef)
      .then((me) => !cancelled && setIdentity({ token: activeRef, licencie: me.licencie, isClubAdmin: me.isClubAdmin, derogationRequests: me.derogationRequests, tables: me.tables }))
      .catch(async (error: unknown) => {
        if (cancelled) return;
        // Session révoquée (lien réinitialisé par le club) ou expirée : retour à la connexion.
        if (error instanceof ApiError && error.status === 401) {
          if (!(await refreshClub(clubSlug))) navigate(`/app/connexion/${clubSlug}`, { replace: true });
          return;
        }
        setIdentity(null);
      });
    return () => {
      cancelled = true;
    };
  }, [clubSlug, activeRef, navigate]);

  const forget = useCallback(() => {
    void logout(clubSlug).then(() => navigate("/", { replace: true }));
  }, [clubSlug, navigate]);
  const switchTo = useCallback(
    (token: string) => {
      if (token.startsWith(ACT_AS)) {
        setIdentity(undefined);
        void setActivePerson(clubSlug, token.slice(ACT_AS.length));
      }
    },
    [clubSlug],
  );
  const forgetToken = useCallback(
    (token: string) => {
      if (token.startsWith(ACT_AS)) void removePerson(clubSlug, token.slice(ACT_AS.length));
    },
    [clubSlug],
  );

  const value: PublicIdentityContextValue = useMemo(
    () => ({ clubSlug, club: { name: session.clubName, logoUrl: null }, identity, forget, switchTo, forgetToken }),
    [clubSlug, session.clubName, identity, forget, switchTo, forgetToken],
  );
  return <PublicIdentityContext.Provider value={value}>{children}</PublicIdentityContext.Provider>;
}
