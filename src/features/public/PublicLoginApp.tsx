"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, House, Loader2, MailCheck, Search } from "lucide-react";
import { ClubLogo } from "@/components/ui/Logo";
import type { PublicLinkTarget } from "@/lib/api/publicTables";
import { IdentifyView } from "./IdentifyView";
import { usePublicIdentity } from "./PublicIdentityProvider";

const STEPS = [
  { icon: Search, label: "Ton nom" },
  { icon: MailCheck, label: "Ton email" },
  { icon: House, label: "Ton espace" },
];

/**
 * Écran de connexion de l'espace public (retour du club, 2026-10-01 : « il
 * commence à taper son nom ou prénom, se retrouve, clique sur recevoir le
 * mail »). Affiché UNIQUEMENT là où un lien personnel est nécessaire
 * (Accueil, Tables, Dérogations) et sur `/connexion` — jamais devant les
 * pages publiques (Résultats, Matchs), qui restent ouvertes et indexables.
 * Le mail ramène sur la page d'origine (`returnTo`) ; le lien est ensuite
 * mémorisé dans ce navigateur.
 */
export function PublicLoginPanel({ returnTo, title = "Connexion", lead, notice }: { returnTo: PublicLinkTarget; title?: string; lead?: ReactNode; notice?: ReactNode }) {
  const { clubSlug, club } = usePublicIdentity();
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 sm:py-8">
      <IdentifyView
        clubSlug={clubSlug}
        clubName={club.name}
        returnTo={returnTo}
        searchFirst
        notice={notice}
        header={
          <div className="flex flex-col items-center gap-4 text-center">
            <ClubLogo name={club.name} src={club.logoUrl} size="xl" />
            <div className="text-reflow">
              <p className="type-eyebrow">{club.name} · Espace licenciés</p>
              <h1 className="type-display mt-1 text-foreground">{title}</h1>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                {lead ?? "Retrouve ton nom et reçois ton lien d'accès par email — sans mot de passe."} Ensuite, cet appareil te reconnaît automatiquement.
              </p>
            </div>
            <ol aria-label="Étapes" className="flex items-center gap-2 text-[12.5px] font-medium text-muted">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className="flex items-center gap-2">
                    {index > 0 ? <ArrowRight aria-hidden className="size-3.5 text-subtle" /> : null}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1">
                      <Icon aria-hidden className="size-3.5 text-accent-text" />
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        }
      />
    </div>
  );
}

/**
 * `/public/{slug}/connexion` — lien direct à partager aux nouveaux. Déjà
 * reconnu → accueil. Les onglets restent visibles : rien n'est bloqué.
 */
export function PublicLoginApp({ clubSlug }: { clubSlug: string }) {
  const { identity } = usePublicIdentity();
  const router = useRouter();
  const home = `/public/${clubSlug}/accueil`;

  useEffect(() => {
    if (identity) router.replace(home);
  }, [identity, home, router]);

  if (identity !== null) {
    return (
      <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-sm text-muted">
        <Loader2 aria-hidden className="size-5 animate-spin" />
        {identity ? "Ouverture de ton espace…" : "Chargement…"}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 px-4 pb-10">
      <PublicLoginPanel returnTo="accueil" />
      <Link href={`/public/${clubSlug}/resultats`} className="type-meta underline-offset-4 hover:text-foreground hover:underline">
        Voir les résultats et les matchs sans me connecter
      </Link>
    </div>
  );
}
