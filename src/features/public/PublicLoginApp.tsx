"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, House, Loader2, MailCheck, Search } from "lucide-react";
import { ClubLogo } from "@/components/ui/Logo";
import { IdentifyView } from "./IdentifyView";
import { usePublicIdentity } from "./PublicIdentityProvider";

const STEPS = [
  { icon: Search, label: "Ton nom" },
  { icon: MailCheck, label: "Ton email" },
  { icon: House, label: "Ton accueil" },
];

/**
 * Page de connexion de l'espace public (retour du club, 2026-10-01 : « une
 * page login public pour les nouveaux arrivés : il commence à taper son nom
 * ou prénom, se retrouve, clique sur recevoir le mail, puis est redirigé sur
 * l'accueil »). Le mail ouvre `/accueil?token=…` ; le lien est ensuite
 * mémorisé dans ce navigateur : un visiteur déjà reconnu ne voit jamais
 * cette page, il part directement sur son accueil.
 */
export function PublicLoginApp({ clubSlug, club }: { clubSlug: string; club: { name: string; logoUrl: string | null } }) {
  const { identity } = usePublicIdentity();
  const router = useRouter();
  const home = `/public/${clubSlug}/accueil`;

  useEffect(() => {
    if (identity) router.replace(home);
  }, [identity, home, router]);

  if (identity !== null) return <EntryLoader label={identity ? "Ouverture de ton espace…" : "Chargement…"} />;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-8 sm:py-14">
      <IdentifyView
        clubSlug={clubSlug}
        clubName={club.name}
        returnTo="accueil"
        searchFirst
        header={
          <div className="flex flex-col items-center gap-4 text-center">
            <ClubLogo name={club.name} src={club.logoUrl} size="xl" />
            <div className="text-reflow">
              <p className="type-eyebrow">{club.name} · Espace licenciés</p>
              <h1 className="type-display mt-1 text-foreground">Connexion</h1>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                Retrouve ton nom et reçois ton lien d&apos;accès par email — sans mot de passe. Ensuite, cet appareil te reconnaît automatiquement.
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
      <Link href={`/public/${clubSlug}/resultats`} className="type-meta self-center underline-offset-4 hover:text-foreground hover:underline">
        Voir les résultats et les matchs sans me connecter
      </Link>
    </div>
  );
}

/**
 * Entrée `/public/{slug}` : déjà reconnu (lien mémorisé ou `?token=`) →
 * accueil ; sinon → connexion. Le lien mémorisé vit dans le navigateur
 * (localStorage), d'où une redirection côté client.
 */
export function PublicEntryRedirect({ clubSlug }: { clubSlug: string }) {
  const { identity } = usePublicIdentity();
  const router = useRouter();

  useEffect(() => {
    if (identity === undefined) return;
    router.replace(`/public/${clubSlug}/${identity ? "accueil" : "connexion"}`);
  }, [identity, clubSlug, router]);

  return <EntryLoader label="Chargement…" />;
}

function EntryLoader({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-sm text-muted">
      <Loader2 aria-hidden className="size-5 animate-spin" />
      {label}
    </div>
  );
}
