"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BackButton, PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { derogationClient, type DerogationSource } from "@/features/derogation-requests/client";
import { RequestThread } from "@/features/derogation-requests/RequestThread";
import { RequestWizard } from "@/features/derogation-requests/RequestWizard";
import { usePublicIdentity, type PublicIdentity } from "@/features/public/PublicIdentityProvider";
import { ApiError } from "@/lib/api/client";
import type { DerogationContextDto, DerogationRequestDetailDto } from "@/lib/api/derogationRequests";
import { PublicDerogationsApp, hasDerogationAccess } from "./PublicDerogationsApp";

/**
 * Sous-pages publiques des demandes de dérogation (nouvelle demande,
 * conversation) : même identité que l'onglet (lien personnel mémorisé), même
 * composants que l'espace club. Sans identité ou sans rôle → l'écran
 * d'accueil de l'onglet (identification / accès réservé).
 */
function useGate(clubSlug: string, clubName: string): { identity: PublicIdentity | null; fallback: React.ReactNode } {
  const { identity } = usePublicIdentity();
  if (identity === undefined) return { identity: null, fallback: <ListSkeleton rows={4} /> };
  if (identity === null || !hasDerogationAccess(identity)) return { identity: null, fallback: <PublicDerogationsApp clubSlug={clubSlug} clubName={clubName} /> };
  return { identity, fallback: null };
}

function useLoad<T>(source: DerogationSource | null, load: (source: DerogationSource) => Promise<T>, key: string) {
  const [state, setState] = useState<{ key: string; data: T | null; error: Error | null } | null>(null);
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    load(source)
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((error: unknown) => !cancelled && setState({ key, data: null, error: error instanceof Error ? error : new Error("Chargement impossible.") }));
    return () => {
      cancelled = true;
    };
    // `load` est stable par construction (fonction déclarée par l'appelant pour cette clé).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, key]);
  return state?.key === key ? state : null;
}

function LoadError({ error, onForget }: { error: Error; onForget: () => void }) {
  if (error instanceof ApiError && error.isUnauthorized) {
    return <ErrorState title="Lien personnel expiré" description="Ton lien a été remplacé ou révoqué. Demande un nouveau lien depuis l'onglet Dérogations." action={<Button onClick={onForget}>Demander un nouveau lien</Button>} />;
  }
  return <ErrorState title={error instanceof ApiError && error.isNotFound ? "Demande introuvable" : "Chargement impossible"} description={error.message} />;
}

export function PublicNewRequestPage({ clubSlug, clubName, initialMatchId }: { clubSlug: string; clubName: string; initialMatchId: string | null }) {
  const { forget } = usePublicIdentity();
  const { identity, fallback } = useGate(clubSlug, clubName);
  const source = useMemo<DerogationSource | null>(() => (identity ? { kind: "public", clubSlug, token: identity.token } : null), [clubSlug, identity]);
  const loaded = useLoad<DerogationContextDto>(source, (s) => derogationClient(s).context(), "context");
  const base = `/public/${clubSlug}/derogations`;
  if (fallback) return fallback;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader back={{ href: base, label: "Dérogations" }} eyebrow={clubName} title="Demander une dérogation" description="Choisis le match, la nouvelle date et un créneau libre : le coordinateur du club reçoit ta demande." />
      {loaded?.error ? <LoadError error={loaded.error} onForget={forget} /> : !loaded?.data || !source ? <ListSkeleton rows={4} /> : <RequestWizard source={source} basePath={base} context={loaded.data} initialMatchId={initialMatchId} />}
    </div>
  );
}

export function PublicRequestThreadPage({ clubSlug, clubName, requestId, justSent }: { clubSlug: string; clubName: string; requestId: string; justSent: boolean }) {
  const { forget } = usePublicIdentity();
  const { identity, fallback } = useGate(clubSlug, clubName);
  const source = useMemo<DerogationSource | null>(() => (identity ? { kind: "public", clubSlug, token: identity.token } : null), [clubSlug, identity]);
  const loaded = useLoad<[DerogationRequestDetailDto, DerogationContextDto]>(source, (s) => Promise.all([derogationClient(s).get(requestId), derogationClient(s).context()]), requestId);
  if (fallback) return fallback;

  return (
    <div className="flex flex-col gap-5">
      <BackButton href={`/public/${clubSlug}/derogations`} label="Dérogations" />
      {loaded?.error ? (
        <LoadError error={loaded.error} onForget={forget} />
      ) : !loaded?.data || !source ? (
        <ListSkeleton rows={5} />
      ) : (
        <RequestThread key={loaded.data[0].id} source={source} initial={loaded.data[0]} timezone={loaded.data[1].timezone} venues={loaded.data[1].venues} justSent={justSent} />
      )}
    </div>
  );
}
