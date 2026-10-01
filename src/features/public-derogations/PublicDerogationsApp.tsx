"use client";

import { useEffect, useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, IconMedallion } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { DerogationsList } from "@/features/admin/DerogationsList";
import { IdentifyView } from "@/features/public/IdentifyView";
import { usePublicIdentity, type PublicIdentity } from "@/features/public/PublicIdentityProvider";
import { listPublicDerogations } from "@/lib/api/publicTables";
import type { DerogationListItemDto } from "@/lib/api/derogations";
import { ApiError } from "@/lib/api/client";

/**
 * Onglet Dérogations de l'espace public (retour du club, 2026-10-01 :
 * "s'il clique sur dérogation, ça va lui demander de se co si token pas
 * reconnu") :
 *  - aucun lien reconnu → identification (lien personnel par email) ;
 *  - lien reconnu mais licencié non administrateur du club → accès réservé ;
 *  - licencié administrateur du club → liste en lecture seule.
 * Le serveur revérifie le rôle à chaque lecture (403 sinon) : l'indicateur
 * `isClubAdmin` ne sert ici qu'à choisir l'écran.
 */
export function PublicDerogationsApp({ clubSlug, clubName }: { clubSlug: string; clubName: string }) {
  const { identity, forget } = usePublicIdentity();

  if (identity === undefined) return <ListSkeleton rows={4} />;

  if (identity === null) {
    return (
      <IdentifyView
        clubSlug={clubSlug}
        clubName={clubName}
        returnTo="derogations"
        title="Dérogations"
        description="Réservé aux administrateurs du club. Retrouve ton nom pour recevoir ton lien personnel par email."
        notice={
          <Notice tone="info" icon={<Lock />}>
            Identifie-toi pour continuer : seul un administrateur du club peut consulter les dérogations.
          </Notice>
        }
      />
    );
  }

  if (!identity.isClubAdmin) return <RestrictedAccess identity={identity} onForget={forget} />;

  return <AdminDerogations clubSlug={clubSlug} clubName={clubName} identity={identity} onForget={forget} />;
}

function RestrictedAccess({ identity, onForget }: { identity: PublicIdentity; onForget: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col py-4">
      <Card>
        <div className="flex flex-col items-start gap-4">
          <IconMedallion tone="neutral" size="lg">
            <Lock />
          </IconMedallion>
          <div className="text-reflow">
            <h1 className="type-title text-foreground">Accès réservé</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Les dérogations sont réservées aux administrateurs du club. Tu es reconnu·e comme{" "}
              <span className="font-medium text-foreground">
                {identity.licencie.firstName} {identity.licencie.lastName}
              </span>
              , qui n&apos;a pas ce rôle.
            </p>
          </div>
          <Button variant="ghost" icon={<LogOut />} onClick={onForget}>
            Ce n&apos;est pas moi
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AdminDerogations({ clubSlug, clubName, identity, onForget }: { clubSlug: string; clubName: string; identity: PublicIdentity; onForget: () => void }) {
  const [derogations, setDerogations] = useState<DerogationListItemDto[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPublicDerogations(clubSlug, identity.token)
      .then((result) => {
        if (!cancelled) setDerogations(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Impossible de charger les dérogations."));
      });
    return () => {
      cancelled = true;
    };
  }, [clubSlug, identity.token]);

  // Rôle retiré ou lien révoqué entre-temps : le serveur fait foi.
  if (error instanceof ApiError && error.isForbidden) return <RestrictedAccess identity={identity} onForget={onForget} />;
  if (error instanceof ApiError && error.isUnauthorized) {
    return <ErrorState title="Lien personnel expiré" description="Ton lien a été remplacé ou révoqué. Demande un nouveau lien depuis cet onglet." action={<Button onClick={onForget}>Demander un nouveau lien</Button>} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={clubName} title="Dérogations" description="Demandes de dérogation FBI connues pour le club, en consultation. Pour accepter ou refuser une demande, connecte-toi à l'espace club." />
      {error ? (
        <ErrorState title="Impossible de charger les dérogations" description={error.message} />
      ) : derogations === null ? (
        <ListSkeleton rows={4} />
      ) : (
        <DerogationsList derogations={derogations} matchBasePath={`/public/${clubSlug}/matchs`} readOnly />
      )}
    </div>
  );
}
