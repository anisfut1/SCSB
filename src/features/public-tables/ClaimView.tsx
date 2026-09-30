"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CheckCircle2, Copy, PartyPopper, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, IconMedallion } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PersonAvatar } from "@/components/ui/Avatar";
import { cn } from "@/components/ui/cn";
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
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <Card variant="glow">
          <div className="flex flex-col items-start gap-4">
            <IconMedallion tone="success" size="lg">
              <PartyPopper />
            </IconMedallion>
            <div>
              <h1 className="type-title text-foreground">
                C&apos;est fait, {justClaimed.licencie.firstName} {justClaimed.licencie.lastName} !
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Conserve ce lien personnel : c&apos;est lui qui te permettra de te positionner et de te retirer toi-même. Il ne pourra pas être redonné automatiquement si tu le perds — il faudra alors demander à un·e responsable du club.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Input type="text" readOnly aria-label="Ton lien personnel" value={personalLink} onFocus={(e) => e.currentTarget.select()} className="type-numeric flex-1 text-[13px]" />
              <Button variant={copied ? "success" : "secondary"} onClick={copyLink} icon={copied ? <Check /> : <Copy />}>
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
            <Button variant="primary" size="lg" onClick={() => onClaimed(justClaimed.token, justClaimed.licencie)} iconRight={<ArrowRight />}>
              J&apos;ai bien noté mon lien, continuer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={clubName} title="Tables de marque" description="Choisis ton nom dans la liste pour te positionner sur les matchs à domicile." />

      {loadError ? <Notice tone="danger" live>{loadError}</Notice> : null}
      {claimError ? <Notice tone="danger" live>{claimError}</Notice> : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Rechercher un nom</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom…" className="pl-10" />
          </label>

          {licencies === null ? (
            <ListSkeleton rows={6} />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((l) => {
                const active = selected?.id === l.id;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      disabled={l.claimed}
                      aria-pressed={active}
                      onClick={() => {
                        setSelected(l);
                        setClaimError(null);
                      }}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-[border-color,box-shadow,background-color] duration-150",
                        l.claimed
                          ? "cursor-not-allowed border-border bg-surface opacity-60"
                          : active
                            ? "border-accent bg-accent-softer shadow-glow-sm"
                            : "border-border bg-surface-raised shadow-1 hover:border-border-strong",
                      )}
                    >
                      <PersonAvatar name={`${l.firstName} ${l.lastName}`} size="sm" />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {l.firstName} {l.lastName}
                      </span>
                      {l.claimed ? (
                        <StatusBadge tone="neutral" size="sm">
                          Déjà choisi
                        </StatusBadge>
                      ) : active ? (
                        <CheckCircle2 aria-hidden className="size-5 text-accent-text" />
                      ) : (
                        <UserRound aria-hidden className="size-4 text-subtle" />
                      )}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? <p className="type-meta col-span-full py-4">Aucun licencié ne correspond.</p> : null}
            </ul>
          )}
        </div>

        <div className="lg:sticky lg:top-[calc(var(--topbar-height)+24px)]">
          {selected ? (
            <Card variant="glow">
              <p className="type-eyebrow">Confirmation</p>
              <p className="type-title mt-2 text-foreground">
                Tu es {selected.firstName} {selected.lastName} ?
              </p>
              <Field label="Email" optional hint="Pour te contacter en cas de besoin." className="mt-5">
                {(props) => <Input {...props} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.fr" />}
              </Field>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" loading={claiming} onClick={submitClaim} icon={<Check />}>
                  Confirmer, c&apos;est moi
                </Button>
                <Button variant="ghost" disabled={claiming} onClick={() => setSelected(null)}>
                  Annuler
                </Button>
              </div>
            </Card>
          ) : (
            <div className="surface-panel hidden flex-col items-center gap-2 px-6 py-10 text-center lg:flex">
              <UserRound aria-hidden className="size-6 text-subtle" />
              <p className="type-meta">Sélectionne ton nom pour continuer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
