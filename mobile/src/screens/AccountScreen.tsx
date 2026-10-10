import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Bell, BellOff, Check, LogOut, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Field";
import { IdentifyView } from "@/features/public/IdentifyView";
import { deviceAuth } from "@/lib/api/deviceAuth";
import { logout, removePerson, setActiveClub, setActivePerson } from "../auth/auth-service";
import { useSessions } from "../auth/SessionContext";
import { activePerson } from "../auth/session-store";
import { openExternal } from "../links/external";
import { disablePushFor, enablePush, pushPermission, type PushPermission } from "../push/push";

/**
 * Compte : personnes de cet iPhone, notifications (permission demandée ICI,
 * après explication — jamais au lancement), autres clubs, déconnexion et
 * « Supprimer mon compte » (initiée dans l'app, traitée par le club : voir
 * docs/APP_STORE.md § Suppression de compte).
 */
export function AccountScreen() {
  const { clubSlug = "" } = useParams<{ clubSlug: string }>();
  const navigate = useNavigate();
  const sessions = useSessions();
  const session = sessions?.clubs[clubSlug];
  const [push, setPush] = useState<PushPermission | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    void pushPermission().then(setPush);
  }, []);

  if (!sessions || !session) return null;
  const me = activePerson(session);
  const otherClubs = Object.values(sessions.clubs).filter((c) => c.clubSlug !== clubSlug);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setMessage(null);
    try {
      await action();
    } catch (err) {
      setMessage({ tone: "danger", text: err instanceof Error ? err.message : "Action impossible." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageContainer className="gap-6">
      <PageHeader eyebrow={session.clubName} title="Mon compte" />
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <Card className="flex flex-col gap-3">
        <h2 className="text-[16px] font-semibold text-foreground">Sur cet iPhone</h2>
        <ul className="flex flex-col divide-y divide-border">
          {session.people.map((p) => (
            <li key={p.licencieId} className="flex min-h-14 items-center gap-3">
              <UserRound aria-hidden className="size-5 text-muted" />
              <button type="button" className="min-w-0 flex-1 truncate text-left text-[15px] font-medium text-foreground" onClick={() => void setActivePerson(clubSlug, p.licencieId)}>
                {p.firstName} {p.lastName}
              </button>
              {me?.licencieId === p.licencieId ? <Check aria-label="Personne active" className="size-5 text-success" /> : null}
              {session.people.length > 1 ? (
                <Button size="sm" variant="ghost" aria-label={`Retirer ${p.firstName} de cet iPhone`} icon={<Trash2 />} loading={busy === p.licencieId} onClick={() => void run(p.licencieId, () => removePerson(clubSlug, p.licencieId))} />
              ) : null}
            </li>
          ))}
        </ul>
        <Button variant="secondary" icon={<Plus />} onClick={() => setAdding(true)}>
          Ajouter un enfant
        </Button>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-[16px] font-semibold text-foreground">Notifications</h2>
        {push === "granted" ? (
          <p className="type-meta">Activées : convocations, changements de match et d&apos;entraînement, dérogations.</p>
        ) : push === "denied" ? (
          <p className="type-meta">Refusées. Pour les activer : Réglages de l&apos;iPhone → Notifications → Ball Manager.</p>
        ) : push === "unavailable" ? (
          <p className="type-meta">Disponibles dans l&apos;app iPhone.</p>
        ) : (
          <>
            <p className="text-[15px] text-foreground">Recevez vos convocations et les changements de match au moment où ils arrivent.</p>
            <Button icon={<Bell />} loading={busy === "push"} onClick={() => void run("push", async () => setPush(await enablePush(Object.values(sessions.clubs))))}>
              Activer les notifications
            </Button>
          </>
        )}
        {push === "granted" ? (
          <Button variant="ghost" icon={<BellOff />} loading={busy === "push-off"} onClick={() => void run("push-off", async () => (await disablePushFor(session), setMessage({ tone: "success", text: "Plus de notifications de ce club sur cet iPhone." })))}>
            Ne plus recevoir celles de ce club
          </Button>
        ) : null}
      </Card>

      {otherClubs.length ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-[16px] font-semibold text-foreground">Mes autres clubs</h2>
          {otherClubs.map((c) => (
            <Button key={c.clubSlug} variant="secondary" onClick={() => void setActiveClub(c.clubSlug).then(() => navigate(`/public/${c.clubSlug}/accueil`))}>
              {c.clubName}
            </Button>
          ))}
        </Card>
      ) : null}
      <Button variant="ghost" icon={<Plus />} onClick={() => navigate("/app/bienvenue")}>
        Ajouter un club
      </Button>

      <Card className="flex flex-col gap-2">
        <Button variant="secondary" icon={<LogOut />} loading={busy === "logout"} onClick={() => void run("logout", () => logout(clubSlug, disablePushFor).then(() => navigate("/", { replace: true })))}>
          Se déconnecter de {session.clubName}
        </Button>
        <Button variant="danger-ghost" icon={<Trash2 />} onClick={() => setDeleting(true)}>
          Supprimer mon compte
        </Button>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-[13px] text-muted">
          <button type="button" onClick={() => openExternal("https://www.ball-manager.fr/confidentialite")}>Confidentialité</button>
          <button type="button" onClick={() => openExternal("https://www.ball-manager.fr/support")}>Aide</button>
          <span>Version {(import.meta.env.BM_APP_VERSION as string | undefined) ?? "1.0.0"}</span>
        </div>
      </Card>

      <Sheet open={adding} onClose={() => setAdding(false)} side="bottom" title="Ajouter un enfant" description="Retrouve le nom de l'autre enfant : son lien arrive par email et l'ajoute à cet iPhone en l'ouvrant.">
        <IdentifyView clubSlug={clubSlug} clubName={session.clubName} returnTo="accueil" searchFirst header={<span />} />
      </Sheet>

      <Sheet open={deleting} onClose={() => setDeleting(false)} side="bottom" title="Supprimer mon compte" description="Ta demande est transmise au club, et cet iPhone est déconnecté tout de suite.">
        <div className="flex flex-col gap-4">
          <Notice tone="warning">
            Ton lien personnel est désactivé et tes appareils sont déconnectés. Le club supprime ensuite tes données personnelles ; il conserve uniquement ce qu&apos;il est tenu de garder (licence FFBB, feuilles de match officielles).
          </Notice>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Message au club (facultatif)" rows={3} />
          <Button
            variant="danger"
            icon={<Trash2 />}
            loading={busy === "delete"}
            onClick={() =>
              void run("delete", async () => {
                await deviceAuth.requestAccountDeletion(clubSlug, session.secret, { licencieIds: session.people.map((p) => p.licencieId), comment: comment.trim() || undefined });
                await logout(clubSlug);
                navigate("/", { replace: true });
              })
            }
          >
            Confirmer la suppression
          </Button>
        </div>
      </Sheet>
    </PageContainer>
  );
}
