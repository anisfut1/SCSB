"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicClub, getPublicMe, type PublicClubDto } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";
import { clearStoredPublicToken, getStoredPublicToken, setStoredPublicToken } from "@/lib/publicToken";
import { ErrorState } from "@/components/ui/States";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ClaimView } from "./ClaimView";
import { BoardView } from "./BoardView";

type Identity = { token: string; licencie: { id: string; firstName: string; lastName: string } };

/**
 * Orchestrateur du flux public sans compte (retour du club, 2026-09-29) :
 * résout l'identité (URL `?token=` ou lien déjà enregistré dans ce
 * navigateur), puis bascule entre le choix du nom (`ClaimView`) et le
 * tableau de positionnement (`BoardView`). Aucune session Supabase nulle
 * part dans cet arbre — uniquement `clubSlug` + un jeton personnel.
 */
export function PublicTablesApp({ clubSlug }: { clubSlug: string }) {
  const searchParams = useSearchParams();
  const [club, setClub] = useState<PublicClubDto | null>(null);
  const [clubError, setClubError] = useState<string | null>(null);
  // `undefined` = résolution réseau du jeton en cours, `null` = résolu (aucun jeton), sinon = identité résolue.
  // Calculé une fois au montage (jamais un `setState` synchrone dans l'effet ci-dessous, voir §react-hooks/set-state-in-effect) :
  // s'il n'y a candidat aucun jeton dès le départ, on sait déjà qu'il n'y a rien à résoudre.
  const [identity, setIdentity] = useState<Identity | null | undefined>(() => ((searchParams.get("token") ?? getStoredPublicToken(clubSlug)) ? undefined : null));

  useEffect(() => {
    let cancelled = false;
    getPublicClub(clubSlug)
      .then((result) => {
        if (!cancelled) setClub(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setClubError(err instanceof ApiError && err.isNotFound ? "Club introuvable — vérifie le lien." : "Impossible de charger ce club.");
      });
    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  useEffect(() => {
    let cancelled = false;
    const candidateToken = searchParams.get("token") ?? getStoredPublicToken(clubSlug);
    // Pas de jeton candidat : déjà résolu à `null` par l'état initial ci-dessus, rien à faire ici.
    if (!candidateToken) return;

    getPublicMe(clubSlug, candidateToken)
      .then((result) => {
        if (cancelled) return;
        setStoredPublicToken(clubSlug, candidateToken);
        setIdentity({ token: candidateToken, licencie: result.licencie });
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredPublicToken(clubSlug);
        setIdentity(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- résolution d'identité au montage/changement de club uniquement, jamais sur un changement de searchParams ultérieur (éviterait une re-résolution en boucle).
  }, [clubSlug]);

  function handleClaimed(token: string, licencie: { id: string; firstName: string; lastName: string }) {
    setStoredPublicToken(clubSlug, token);
    setIdentity({ token, licencie });
  }

  function handleLogout() {
    clearStoredPublicToken(clubSlug);
    setIdentity(null);
  }

  if (clubError) {
    return <ErrorState title={clubError} description="Demande le lien à jour à un·e responsable du club." />;
  }

  if (!club || identity === undefined) {
    return <ListSkeleton rows={4} />;
  }

  if (identity === null) {
    return <ClaimView clubSlug={clubSlug} clubName={club.name} onClaimed={handleClaimed} />;
  }

  return <BoardView clubSlug={clubSlug} clubTimezone={club.timezone} token={identity.token} me={identity.licencie} onLogout={handleLogout} />;
}
