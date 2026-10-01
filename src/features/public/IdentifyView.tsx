"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Mail, MailCheck, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, IconMedallion } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PersonAvatar } from "@/components/ui/Avatar";
import { cn } from "@/components/ui/cn";
import { listPublicLicencies, requestPersonalLink, type PublicLicencieDto, type PublicLinkTarget } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";

type Step = { kind: "pick" } | { kind: "confirm"; licencie: PublicLicencieDto; needsEmail: boolean } | { kind: "sent"; licencie: PublicLicencieDto; maskedEmail: string };

type Feedback = { tone: "danger" | "warning" | "info"; message: string } | null;

/** Mode « connexion » : rien n'est listé avant 2 lettres, puis au plus 8 noms. */
const SEARCH_MIN_CHARS = 2;
const SEARCH_MAX_RESULTS = 8;

/**
 * Identification de l'espace public sans compte (retour du club,
 * 2026-10-01 : "il va chercher son nom, il va mettre son mail... un bouton
 * qui renvoie vers son lien avec token"). Le lien personnel n'est JAMAIS
 * affiché ici : il part uniquement par email (club-manager-api, Resend).
 * Un nom déjà inscrit reste sélectionnable — c'est le « lien perdu ? » :
 * le nouveau lien repart à l'adresse déjà enregistrée, jamais ailleurs.
 *
 * `searchFirst` (page de connexion, retour du club 2026-10-01 : « il va
 * commencer à taper son nom ou prénom pour se retrouver ») : aucune liste
 * affichée d'emblée, seulement les noms qui correspondent à la frappe.
 */
export function IdentifyView({
  clubSlug,
  clubName,
  returnTo,
  title,
  description,
  notice,
  header,
  searchFirst = false,
}: {
  clubSlug: string;
  clubName: string;
  returnTo: PublicLinkTarget;
  title?: string;
  description?: ReactNode;
  notice?: ReactNode;
  /** Remplace l'en-tête de page par défaut (page de connexion). */
  header?: ReactNode;
  searchFirst?: boolean;
}) {
  const [licencies, setLicencies] = useState<PublicLicencieDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

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

  const query = normalize(search.trim());
  const waitingForInput = searchFirst && query.length < SEARCH_MIN_CHARS;
  const matches = useMemo(() => {
    if (!licencies) return [];
    if (!query) return licencies;
    return licencies.filter((l) => normalize(`${l.firstName} ${l.lastName}`).includes(query) || normalize(`${l.lastName} ${l.firstName}`).includes(query));
  }, [licencies, query]);
  const filtered = searchFirst ? matches.slice(0, SEARCH_MAX_RESULTS) : matches;

  function choose(licencie: PublicLicencieDto) {
    setFeedback(null);
    setEmail("");
    setStep({ kind: "confirm", licencie, needsEmail: false });
  }

  function backToList() {
    setFeedback(null);
    setStep({ kind: "pick" });
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (step.kind !== "confirm") return;
    setSending(true);
    setFeedback(null);
    try {
      const result = await requestPersonalLink(clubSlug, step.licencie.id, { email: step.needsEmail ? email.trim() : null, returnTo });
      setStep({ kind: "sent", licencie: step.licencie, maskedEmail: result.maskedEmail });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_REQUIRED") {
        // Aucune adresse connue pour ce nom : on la demande, sans considérer cela comme une erreur.
        if (step.needsEmail) setFeedback({ tone: "danger", message: err.message });
        setStep({ ...step, needsEmail: true });
      } else if (err instanceof ApiError && err.code === "LINK_RECENTLY_SENT") {
        setFeedback({ tone: "info", message: err.message });
      } else if (err instanceof ApiError && err.code === "EMAIL_NOT_CONFIGURED") {
        setFeedback({ tone: "warning", message: err.message });
      } else {
        setFeedback({ tone: "danger", message: err instanceof ApiError ? err.message : "Impossible d'envoyer le lien pour le moment. Réessaie dans quelques minutes." });
      }
    } finally {
      setSending(false);
    }
  }

  if (step.kind === "sent") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 py-4">
        <Card variant="glow">
          <div className="flex flex-col items-start gap-4">
            <IconMedallion tone="success" size="lg">
              <MailCheck />
            </IconMedallion>
            <div className="text-reflow">
              <h1 className="type-title text-foreground">Lien envoyé, {step.licencie.firstName} !</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Un email vient de partir à <span className="type-numeric font-medium text-foreground">{step.maskedEmail}</span>. Ouvre-le et appuie sur <span className="font-medium text-foreground">« Ouvrir mon espace »</span> : tu seras reconnu·e automatiquement sur cet appareil.
              </p>
              <p className="type-meta mt-3">Rien reçu d&apos;ici quelques minutes ? Vérifie tes spams. Chaque nouvelle demande remplace l&apos;ancien lien.</p>
            </div>
            <Button variant="ghost" icon={<ArrowLeft />} onClick={backToList}>
              Ce n&apos;est pas moi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step.kind === "confirm") {
    const { licencie, needsEmail } = step;
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 py-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft />} onClick={backToList} className="self-start">
          Changer de nom
        </Button>
        <Card variant="glow">
          <form onSubmit={send} className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <PersonAvatar name={`${licencie.firstName} ${licencie.lastName}`} />
              <div className="text-reflow flex-1">
                <p className="type-eyebrow">{clubName}</p>
                <p className="type-title text-foreground">
                  {licencie.firstName} {licencie.lastName}
                </p>
              </div>
            </div>

            {needsEmail ? (
              <Field label="Ton adresse email" required hint="Ton lien personnel y sera envoyé. Elle est enregistrée sur ta fiche licencié." error={feedback?.tone === "danger" ? feedback.message : undefined}>
                {(props) => <Input {...props} type="email" inputMode="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.fr" />}
              </Field>
            ) : (
              <p className="text-[15px] leading-relaxed text-muted">
                {licencie.claimed
                  ? "Ce profil est déjà inscrit. Un nouveau lien sera envoyé à l'adresse email déjà enregistrée — l'ancien lien ne fonctionnera plus."
                  : "On t'envoie ton lien personnel par email. Il te suffira de cliquer dessus pour accéder à ton espace, sans mot de passe."}
              </p>
            )}

            {feedback && !(needsEmail && feedback.tone === "danger") ? (
              <Notice tone={feedback.tone} live>
                {feedback.message}
              </Notice>
            ) : null}

            <Button type="submit" variant="primary" size="lg" loading={sending} disabled={needsEmail && !email.trim()} icon={<Mail />}>
              {needsEmail ? "Envoyer mon lien" : "Recevoir mon lien par email"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header ?? <PageHeader eyebrow={clubName} title={title ?? ""} description={description} />}

      {notice}
      {loadError ? (
        <Notice tone="danger" live>
          {loadError}
        </Notice>
      ) : null}

      <div className="flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Rechercher ton nom</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchFirst ? "Commence à taper ton nom ou ton prénom…" : "Rechercher ton nom…"}
            className={cn("pl-10", searchFirst && "h-12 text-base")}
            autoComplete="off"
            autoFocus={searchFirst}
          />
        </label>

        {waitingForInput ? (
          <p className="type-meta px-1">Tape au moins {SEARCH_MIN_CHARS} lettres pour te retrouver dans la liste du club.</p>
        ) : licencies === null && !loadError ? (
          <ListSkeleton rows={searchFirst ? 3 : 6} />
        ) : (
          <ul className={cn("grid grid-cols-1 gap-2", !searchFirst && "sm:grid-cols-2 xl:grid-cols-3")}>
            {filtered.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => choose(l)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface-raised px-3 py-2 text-left text-sm shadow-1",
                    "transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong focus-visible:border-accent",
                  )}
                >
                  <PersonAvatar name={`${l.firstName} ${l.lastName}`} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {l.firstName} {l.lastName}
                  </span>
                  {l.claimed ? (
                    <StatusBadge tone="success" size="sm" icon={<CheckCircle2 />}>
                      Inscrit
                    </StatusBadge>
                  ) : (
                    <UserRound aria-hidden className="size-4 text-subtle" />
                  )}
                </button>
              </li>
            ))}
            {licencies !== null && filtered.length === 0 ? <p className="type-meta col-span-full py-4">Aucun licencié ne correspond à « {search.trim()} ».</p> : null}
            {matches.length > filtered.length ? <p className="type-meta col-span-full px-1">Et {matches.length - filtered.length} autre(s) — précise ta recherche (nom + prénom).</p> : null}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Recherche insensible à la casse et aux accents (« lea » trouve « Léa »). */
function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
