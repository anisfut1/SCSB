import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, Link2, Mail, Search, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ClubLogo } from "@/components/ui/Logo";
import { Notice } from "@/components/ui/Notice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { IdentifyView } from "@/features/public/IdentifyView";
import { deviceAuth } from "@/lib/api/deviceAuth";
import { ssoLogin } from "../auth/auth-service";
import { SsoCancelled } from "../auth/callback";
import { useSessions } from "../auth/SessionContext";
import { useLinkHandler } from "../links/LinkHandler";
import { peekPendingDestination, takePendingDestination } from "../links/pending";
import { isNativeApp } from "../native/bm-native";
import { loadClub, useLoad } from "./use-load";
import { Splash } from "../shell/Splash";

/** `/` : club actif → son accueil ; sinon l'écran de bienvenue. */
export function StartScreen() {
  const sessions = useSessions();
  if (!sessions) return <Splash />;
  if (sessions.active && sessions.clubs[sessions.active]) return <Navigate to={`/public/${sessions.active}/accueil`} replace />;
  return <Navigate to="/app/bienvenue" replace />;
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)]">{children}</div>;
}

/** Lien reçu par email / message, collé à la main : même routeur que les Universal Links. */
function PasteLink() {
  const { handle } = useLinkHandler();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    const url = value.trim();
    if (!/^https:\/\/(www\.|open\.)?ball-manager\.fr\//.test(url)) return setError("Colle le lien Ball Manager reçu par email (il commence par https://www.ball-manager.fr/).");
    setError(null);
    void handle(url);
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Field label="J'ai reçu un lien Ball Manager" error={error ?? undefined}>
        {(field) => <Input {...field} value={value} onChange={(e) => setValue(e.target.value)} inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder="https://www.ball-manager.fr/public/…" />}
      </Field>
      <Button type="submit" variant="secondary" icon={<Link2 />}>
        Ouvrir ce lien
      </Button>
    </form>
  );
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const clubs = useLoad(() => deviceAuth.listClubs(), []);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (clubs.data?.clubs ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [clubs.data, query]);

  return (
    <Screen>
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <BrandMark className="size-16 rounded-[18px]" />
        <h1 className="type-title text-foreground">Ball Manager</h1>
        <p className="type-meta">Convocations, entraînements et vie du club, au même endroit.</p>
      </div>
      <Card className="flex flex-col gap-3">
        <h2 className="text-[16px] font-semibold text-foreground">Ton club</h2>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un club" className="pl-9" />
        </div>
        {clubs.error ? <Notice tone="danger">{clubs.offline ? "Connexion indisponible. Vérifie ton réseau." : clubs.error.message}</Notice> : null}
        {!clubs.data && !clubs.error ? <ListSkeleton rows={3} /> : null}
        <ul className="flex flex-col divide-y divide-border">
          {filtered.map((c) => (
            <li key={c.slug}>
              <button type="button" onClick={() => navigate(`/app/connexion/${c.slug}`)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left active:bg-surface-muted">
                <ClubLogo name={c.name} src={c.logoUrl} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">{c.name}</span>
                <ChevronRight aria-hidden className="size-4 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <PasteLink />
    </Screen>
  );
}

export function ClubLoginScreen() {
  const { clubSlug = "" } = useParams<{ clubSlug: string }>();
  const navigate = useNavigate();
  const sessions = useSessions();
  const club = useLoad(() => loadClub(clubSlug), [clubSlug]);
  const [mode, setMode] = useState<"choice" | "email">("choice");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = peekPendingDestination();

  if (!sessions) return <Splash />;
  if (sessions.clubs[clubSlug]) return <Navigate to={takePendingDestination(clubSlug) ?? `/public/${clubSlug}/accueil`} replace />;

  async function continueWithBallManager() {
    setBusy(true);
    setError(null);
    try {
      const redirect = await ssoLogin(clubSlug, pending?.clubSlug === clubSlug ? pending.path : undefined);
      navigate(takePendingDestination(clubSlug) ?? redirect ?? `/public/${clubSlug}/accueil`, { replace: true });
    } catch (err) {
      if (!(err instanceof SsoCancelled) && !(err instanceof Error && /cancel/i.test(err.message))) setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  const name = club.data?.name ?? clubSlug;
  return (
    <Screen>
      <button type="button" onClick={() => navigate("/app/bienvenue")} className="inline-flex items-center gap-1 self-start text-[15px] font-medium text-accent-text [&_svg]:size-4">
        <ArrowLeft aria-hidden /> Changer de club
      </button>
      <div className="flex items-center gap-3">
        <ClubLogo name={name} src={club.data?.logoUrl ?? null} size="md" />
        <h1 className="type-title text-foreground">{name}</h1>
      </div>
      {pending?.clubSlug === clubSlug ? <Notice tone="info">Après la connexion, tu arriveras directement sur la page demandée.</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {mode === "choice" ? (
        <div className="flex flex-col gap-3">
          {isNativeApp() ? (
            <Button size="lg" loading={busy} icon={<ShieldCheck />} onClick={() => void continueWithBallManager()}>
              Continuer avec Ball Manager
            </Button>
          ) : null}
          <p className="type-meta">Déjà connecté sur le site Ball Manager dans Safari ? Continue en un geste. Sinon, reçois ton lien par email : il ouvrira directement l&apos;app.</p>
          <Button size="lg" variant="secondary" icon={<Mail />} onClick={() => setMode("email")}>
            Recevoir un lien de connexion
          </Button>
          <PasteLink />
        </div>
      ) : (
        <IdentifyView clubSlug={clubSlug} clubName={name} returnTo="accueil" searchFirst header={<span />} />
      )}
    </Screen>
  );
}
