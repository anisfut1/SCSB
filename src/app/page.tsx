import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, UsersRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform";
import { listUserClubs } from "@/lib/tenancy/club-context";
import { PLATFORM_NAME } from "@/config/site";
import { BrandMark } from "@/components/brand/BrandMark";
import { ClubLogo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { signOutAction } from "@/server/actions/auth";
import { clubAccentStyle } from "@/lib/ui/accent";

/**
 * Racine de l'application : résout le contexte club de l'utilisateur
 * (§14 du brief SaaS) plutôt que de rediriger vers une destination unique.
 * - 0 club : message d'accueil (+ lien /platform/clubs si platform_admin)
 * - 1 club : redirection directe
 * - plusieurs clubs : choix
 */
export default async function HomePage() {
  await requireUser();
  const clubs = await listUserClubs();

  if (clubs.length === 1) {
    redirect(`/c/${clubs[0]!.slug}/dashboard`);
  }

  const canManagePlatform = clubs.length === 0 ? await isPlatformAdmin() : false;

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <span className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">{PLATFORM_NAME}</span>
        </span>
        <form action={signOutAction}>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground">
            Se déconnecter
          </button>
        </form>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-10">
        {clubs.length === 0 ? (
          <EmptyState
            icon={<UsersRound />}
            title="Aucun club pour l'instant"
            description="Votre compte n'est membre d'aucun club. Contactez l'administrateur de votre club pour être invité."
            action={
              canManagePlatform ? (
                <ButtonLink href="/platform/clubs" variant="primary" icon={<ShieldCheck />}>
                  Gérer les clubs (platform admin)
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-2 text-center">
              <p className="type-eyebrow">Vos espaces</p>
              <h1 className="type-title text-foreground">Choisir un club</h1>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {clubs.map((club) => (
                <li key={club.id} style={clubAccentStyle(club.accentColor)} className="accent-scope">
                  <Link href={`/c/${club.slug}/dashboard`} data-interactive="true" className="surface-card group flex items-center gap-4 p-4">
                    <ClubLogo name={club.name} src={club.logoUrl} size="lg" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-foreground">{club.name}</span>
                      <span className="type-meta truncate">/c/{club.slug}</span>
                    </span>
                    <ArrowRight aria-hidden className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-text" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
