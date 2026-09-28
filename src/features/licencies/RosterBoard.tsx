"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { LicencieDto } from "@/lib/api/licencies";
import type { TeamDto } from "@/lib/api/clubs";

interface Bucket {
  teamId: string | null;
  title: string;
  licencies: LicencieDto[];
}

function bucketsFor(licencies: LicencieDto[], teams: TeamDto[]): Bucket[] {
  const byTeamId = new Map<string, LicencieDto[]>();
  const withoutTeam: LicencieDto[] = [];
  for (const l of licencies) {
    if (!l.teamId) {
      withoutTeam.push(l);
      continue;
    }
    const bucket = byTeamId.get(l.teamId) ?? [];
    bucket.push(l);
    byTeamId.set(l.teamId, bucket);
  }

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  const buckets: Bucket[] = sortedTeams.map((t) => ({ teamId: t.id, title: t.name, licencies: byTeamId.get(t.id) ?? [] }));
  buckets.push({ teamId: null, title: "Sans équipe", licencies: withoutTeam });
  return buckets;
}

function LicencieCard({ clubSlug, licencie, isAdmin }: { clubSlug: string; licencie: LicencieDto; isAdmin: boolean }) {
  return (
    <Link
      href={`/c/${clubSlug}/joueurs/${licencie.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10"
    >
      <span className="flex items-center gap-3">
        {licencie.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL de photo arbitraire fournie par le club, hors domaines Next configurés
          <img src={licencie.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="h-8 w-8 shrink-0 rounded-full bg-black/10 dark:bg-white/10" aria-hidden />
        )}
        <span>
          {licencie.lastName} {licencie.firstName}
          {!licencie.active ? <span className="ml-2 text-xs text-black/40 dark:text-white/40">(inactif·ve)</span> : null}
          {/* Catégorie/sexe FFBB — repère pour glisser la carte vers la bonne équipe (un club a souvent plusieurs équipes par catégorie, ex. SM1/SM2/SF). */}
          {licencie.categoryLabel || licencie.sexe ? (
            <span className="ml-2 text-xs text-black/40 dark:text-white/40">
              {[licencie.categoryLabel, licencie.sexe].filter(Boolean).join(" · ")}
            </span>
          ) : null}
        </span>
      </span>
      <span className="flex items-center gap-2 text-sm text-black/40 dark:text-white/40">
        {isAdmin ? <span aria-hidden>⠿</span> : null}
        {licencie.licenseNumber ?? "—"}
      </span>
    </Link>
  );
}

/**
 * "Fais moi un truc ou jpeux glisser les cartes pr les mettre d'une equipe
 * a lautre" (demande du club, 2026-09-28) — glisser-déposer natif (HTML5
 * drag & drop, aucune dépendance ajoutée) entre les sections par équipe.
 * `isAdmin` uniquement (même verrou que `PATCH .../profile` côté API,
 * appelé ici pour CHAQUE déplacement — teamId est admin-only en écriture,
 * voir docs/LICENCIES.md côté club-manager-api).
 *
 * Optimiste : la carte change de section IMMÉDIATEMENT au dépôt, annulé
 * (retour à l'état précédent) si l'appel API échoue — jamais un
 * déplacement visuel qui resterait affiché alors qu'il n'a pas été
 * réellement enregistré.
 */
export function RosterBoard({
  clubId,
  clubSlug,
  licencies,
  teams,
  isAdmin,
}: {
  clubId: string;
  clubSlug: string;
  licencies: LicencieDto[];
  teams: TeamDto[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(licencies);
  // Resynchronise l'état local sur les props fraîches après un
  // `router.refresh()` (déplacement ou répartition automatique) — mise à
  // jour PENDANT le rendu (jamais dans un Effect, voir la doc React
  // "Adjusting state when a prop changes") : sans ça, `items` resterait
  // figé sur le snapshot initial du montage.
  const [prevLicencies, setPrevLicencies] = useState(licencies);
  if (licencies !== prevLicencies) {
    setPrevLicencies(licencies);
    setItems(licencies);
  }
  const [isPending, startTransition] = useTransition();
  const [dragLicencieId, setDragLicencieId] = useState<string | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [autoAssignStatus, setAutoAssignStatus] = useState<string | null>(null);

  function handleAutoAssign() {
    setError(null);
    setAutoAssignStatus(null);
    startTransition(async () => {
      try {
        const result = await browserApi.licencies.autoAssignTeams(clubId);
        setAutoAssignStatus(
          result.total === 0
            ? "Aucun·e licencié·e sans équipe avec une catégorie connue."
            : `${result.assigned} licencié·e·s affecté·e·s automatiquement sur ${result.total} sans équipe${result.skipped > 0 ? ` (${result.skipped} restent sans équipe correspondante, à traiter à la main)` : ""}.`,
        );
        router.refresh();
      } catch (e) {
        setAutoAssignStatus(e instanceof ApiError ? e.message : "Répartition automatique impossible.");
      }
    });
  }

  function handleDrop(teamId: string | null) {
    setDragOverTeamId(undefined);
    if (!isAdmin || !dragLicencieId) return;
    const licencieId = dragLicencieId;
    setDragLicencieId(null);

    const licencie = items.find((l) => l.id === licencieId);
    if (!licencie || licencie.teamId === teamId) return;

    const previous = items;
    setError(null);
    setItems(items.map((l) => (l.id === licencieId ? { ...l, teamId } : l)));

    startTransition(async () => {
      try {
        await browserApi.licencies.updateProfile(clubId, licencieId, { teamId });
        router.refresh();
      } catch (e) {
        setItems(previous);
        setError(e instanceof ApiError ? e.message : "Déplacement impossible.");
      }
    });
  }

  const buckets = bucketsFor(items, teams);
  const unassignedCount = buckets.find((b) => b.teamId === null)?.licencies.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {isAdmin && unassignedCount > 0 ? (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleAutoAssign}
            disabled={isPending}
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
          >
            {isPending ? "Répartition en cours…" : "Répartir automatiquement par catégorie"}
          </button>
          {autoAssignStatus ? <p className="text-sm text-black/60 dark:text-white/60">{autoAssignStatus}</p> : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {buckets.map((bucket) => (
        <section
          key={bucket.teamId ?? "no-team"}
          onDragOver={
            isAdmin
              ? (e) => {
                  e.preventDefault();
                  setDragOverTeamId(bucket.teamId);
                }
              : undefined
          }
          onDragLeave={isAdmin ? () => setDragOverTeamId((current) => (current === bucket.teamId ? undefined : current)) : undefined}
          onDrop={isAdmin ? () => handleDrop(bucket.teamId) : undefined}
        >
          <h2 className="mb-2 text-sm font-semibold text-black/70 dark:text-white/70">
            {bucket.title} <span className="font-normal text-black/40 dark:text-white/40">({bucket.licencies.length})</span>
          </h2>
          {bucket.licencies.length === 0 ? (
            <p
              className={`rounded-lg border border-dashed px-4 py-3 text-sm text-black/40 dark:text-white/40 ${
                dragOverTeamId === bucket.teamId ? "border-black/40 dark:border-white/40" : "border-black/10 dark:border-white/10"
              }`}
            >
              {isAdmin ? "Glisse une carte ici pour l'ajouter à cette équipe." : "Aucun·e licencié·e rattaché·e à cette équipe pour l'instant."}
            </p>
          ) : (
            <ul
              className={`divide-y divide-black/5 rounded-lg border bg-white dark:divide-white/10 dark:bg-white/5 ${
                dragOverTeamId === bucket.teamId ? "border-black/40 dark:border-white/40" : "border-black/10 dark:border-white/10"
              }`}
            >
              {bucket.licencies.map((licencie) => (
                <li
                  key={licencie.id}
                  draggable={isAdmin}
                  onDragStart={isAdmin ? () => setDragLicencieId(licencie.id) : undefined}
                  onDragEnd={isAdmin ? () => setDragLicencieId(null) : undefined}
                  className={isAdmin ? "cursor-grab active:cursor-grabbing" : undefined}
                >
                  <LicencieCard clubSlug={clubSlug} licencie={licencie} isAdmin={isAdmin} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
