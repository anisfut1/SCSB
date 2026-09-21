import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform";
import { listUserClubs } from "@/lib/tenancy/club-context";

/**
 * Racine de l'application : résout le contexte club de l'utilisateur
 * (§14 du brief SaaS) plutôt que de rediriger vers une destination unique.
 * - 0 club : message d'accueil (+ lien /platform/clubs si platform_admin)
 * - 1 club : redirection directe
 * - plusieurs clubs : choix
 */
export default async function HomePage() {
  const user = await requireUser();
  const clubs = await listUserClubs(user.id);

  if (clubs.length === 1) {
    redirect(`/c/${clubs[0]!.slug}/dashboard`);
  }

  if (clubs.length === 0) {
    const canManagePlatform = await isPlatformAdmin(user.id);

    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-lg font-semibold">Aucun club pour l&apos;instant</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Votre compte n&apos;est membre d&apos;aucun club. Contactez l&apos;administrateur de votre club pour être invité.
        </p>
        {canManagePlatform ? (
          <Link href="/platform/clubs" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
            Gérer les clubs (platform admin)
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-lg font-semibold">Choisir un club</h1>
      <ul className="flex flex-col gap-2">
        {clubs.map((club) => (
          <li key={club.id}>
            <Link
              href={`/c/${club.slug}/dashboard`}
              className="block rounded-lg border border-black/10 bg-white p-4 text-sm font-medium shadow-sm hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              {club.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
