"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Search, UserRound } from "lucide-react";
import { claimLicencie, listPublicLicencies, type PublicLicencieDto } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";

/**
 * Choix du nom (retour du club, 2026-09-29 : "il choisit son nom dans la
 * liste"). Une fois choisi, `onClaimed` n'est appelé qu'après confirmation
 * explicite que la personne a bien noté son lien personnel — jamais une
 * transition automatique qui risquerait de le faire disparaître sans que
 * personne ne l'ait vu.
 */
export function ClaimView({ clubSlug, clubName, onClaimed }: { clubSlug: string; clubName: string; onClaimed: (token: string, licencie: { id: string; firstName: string; lastName: string }) => void }) {
  const [licencies, setLicencies] = useState<PublicLicencieDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PublicLicencieDto | null>(null);
  const [email, setEmail] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<{ token: string; licencie: { id: string; firstName: string; lastName: string } } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPublicLicencies(clubSlug)
      .then((result) => {
        if (!cancelled) setLicencies(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "Impossible de charger la liste des licenciés.");
      });
    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  const filtered = useMemo(() => {
    if (!licencies) return [];
    const query = search.trim().toLowerCase();
    if (!query) return licencies;
    return licencies.filter((l) => `${l.firstName} ${l.lastName}`.toLowerCase().includes(query));
  }, [licencies, search]);

  async function submitClaim() {
    if (!selected) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const result = await claimLicencie(clubSlug, selected.id, email.trim() || null);
      setJustClaimed({ token: result.token, licencie: result.licencie });
    } catch (err) {
      if (err instanceof ApiError && err.code === "ALREADY_CLAIMED") {
        setClaimError(err.message);
        setSelected(null);
        listPublicLicencies(clubSlug)
          .then(setLicencies)
          .catch(() => undefined);
      } else {
        setClaimError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ce choix.");
      }
    } finally {
      setClaiming(false);
    }
  }

  const personalLink = justClaimed && typeof window !== "undefined" ? `${window.location.origin}/public/${clubSlug}/tables?token=${justClaimed.token}` : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(personalLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Rien à faire : le lien reste sélectionnable/copiable manuellement dans le champ.
    }
  }

  if (justClaimed) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            C&apos;est fait, {justClaimed.licencie.firstName} {justClaimed.licencie.lastName} !
          </p>
          <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-300/80">
            Conserve ce lien personnel : c&apos;est lui qui te permettra de te positionner et de te retirer toi-même. Il ne pourra pas être redonné automatiquement si tu le perds — il faudra alors demander à un·e responsable du club.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-black/15 bg-white p-2 dark:border-white/20 dark:bg-black/20">
          <input type="text" readOnly value={personalLink} className="flex-1 truncate bg-transparent text-sm outline-none" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={copyLink} className="flex shrink-0 items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onClaimed(justClaimed.token, justClaimed.licencie)}
          className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          J&apos;ai bien noté mon lien, continuer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Tables de marque — {clubName}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Choisis ton nom dans la liste pour te positionner sur les matchs à domicile.</p>
      </div>

      {loadError ? <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p> : null}
      {claimError ? <p className="text-sm text-red-600 dark:text-red-400">{claimError}</p> : null}

      <label className="flex items-center gap-2 rounded-md border border-black/15 px-2.5 py-1.5 dark:border-white/20">
        <Search className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom…" className="w-full bg-transparent text-sm outline-none placeholder:text-black/40 dark:placeholder:text-white/40" />
      </label>

      {licencies === null ? (
        <p className="text-sm text-black/50 dark:text-white/50">Chargement…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                disabled={l.claimed}
                onClick={() => {
                  setSelected(l);
                  setClaimError(null);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm ${
                  l.claimed
                    ? "cursor-not-allowed border-black/10 opacity-50 dark:border-white/10"
                    : selected?.id === l.id
                      ? "border-black bg-black/[0.03] dark:border-white dark:bg-white/10"
                      : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 shrink-0 text-black/40 dark:text-white/40" aria-hidden />
                  {l.firstName} {l.lastName}
                </span>
                {l.claimed ? <span className="text-xs text-black/40 dark:text-white/40">Déjà choisi</span> : null}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-black/40 dark:text-white/40">Aucun licencié ne correspond.</p> : null}
        </ul>
      )}

      {selected ? (
        <div className="flex flex-col gap-3 rounded-lg border border-black/15 bg-black/[0.02] p-3 dark:border-white/20 dark:bg-white/[0.03]">
          <p className="text-sm">
            Tu es <strong>{selected.firstName} {selected.lastName}</strong> ?
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-black/60 dark:text-white/60">Email (optionnel — pour te contacter en cas de besoin)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.fr"
              className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-black/20"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={claiming}
              onClick={submitClaim}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {claiming ? "…" : "Confirmer, c'est moi"}
            </button>
            <button type="button" disabled={claiming} onClick={() => setSelected(null)} className="rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10">
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
