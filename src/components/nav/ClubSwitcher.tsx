"use client";

import { useRouter } from "next/navigation";

interface ClubSwitcherProps {
  currentSlug: string;
  clubs: { slug: string; name: string }[];
}

/**
 * Sélecteur de club (§14 du brief SaaS) : affiché uniquement si
 * l'utilisateur appartient à plusieurs clubs — pas de switcher encombrant
 * pour le cas courant (un seul club).
 */
export function ClubSwitcher({ currentSlug, clubs }: ClubSwitcherProps) {
  const router = useRouter();

  if (clubs.length <= 1) return null;

  return (
    <select
      value={currentSlug}
      onChange={(event) => router.push(`/c/${event.target.value}/dashboard`)}
      aria-label="Changer de club"
      className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-black"
    >
      {clubs.map((club) => (
        <option key={club.slug} value={club.slug}>
          {club.name}
        </option>
      ))}
    </select>
  );
}
