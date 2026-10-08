"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ShieldCheck, ShieldPlus, UserMinus, UserPlus } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDivider, CardHeader } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/Dialog";
import { Field, FormMessage, Input } from "@/components/ui/Field";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { PlatformClubMembersDto } from "@/lib/api/platform";
import { ROLE_LABELS } from "@/lib/permissions/roles";

type Member = PlatformClubMembersDto["members"][number];

const isAdmin = (m: Member) => m.roles.some((r) => r.role === "club_admin");

function memberName(m: Member): string {
  if (m.licencie) return `${m.licencie.firstName} ${m.licencie.lastName}`;
  return m.displayName ?? m.email ?? "Compte sans nom";
}

/**
 * Administrateurs d'un club, gérés par l'opérateur de la plateforme (retour
 * du club, 2026-10-08 : « dans l'espace clubs, il faut que je voie les
 * admins, qui je mets admin »). Un administrateur a accès à toute la
 * gestion du club dans /c/{club}.
 */
export function ClubAdminsManager({ initial }: { initial: PlatformClubMembersDto }) {
  const [data, setData] = useState(initial);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const admins = data.members.filter(isAdmin);
  const others = data.members.filter((m) => !isAdmin(m) && m.status === "active");

  function run(action: () => Promise<PlatformClubMembersDto>, success: string, id: string | null) {
    setMessage(null);
    setBusyId(id);
    startTransition(async () => {
      try {
        setData(await action());
        setMessage({ tone: "success", text: success });
      } catch (error) {
        setMessage({ tone: "danger", text: error instanceof ApiError ? error.message : "L'opération a échoué. Réessaie." });
      } finally {
        setBusyId(null);
      }
    });
  }

  function grant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;
    run(() => browserApi.platform.grantClubAdmin(data.club.id, value), `${value} est maintenant administrateur de ${data.club.name}.`, "form");
    setEmail("");
  }

  async function revoke(m: Member) {
    const ok = await confirm({
      title: `Retirer ${memberName(m)} des administrateurs ?`,
      description: "Cette personne garde son accès au club et ses autres rôles, mais ne pourra plus gérer le club.",
      confirmLabel: "Retirer",
      destructive: true,
    });
    if (!ok) return;
    run(() => browserApi.platform.revokeClubAdmin(data.club.id, m.membershipId), `${memberName(m)} n'est plus administrateur.`, m.membershipId);
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <Card>
        <CardHeader
          icon={<ShieldCheck />}
          title={`Administrateurs (${admins.length})`}
          description="Accès complet à la gestion du club : licenciés, équipes, tables, dérogations, intégrations FFBB/FBI."
        />
        <CardDivider />
        {admins.length === 0 ? (
          <p className="type-meta">Aucun administrateur pour ce club. Nomme-en un ci-dessous.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {admins.map((m) => (
              <MemberRow key={m.membershipId} member={m}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<UserMinus />}
                  loading={pending && busyId === m.membershipId}
                  disabled={pending || admins.length <= 1}
                  title={admins.length <= 1 ? "Dernier administrateur : nommes-en un autre d'abord." : undefined}
                  onClick={() => revoke(m)}
                >
                  Retirer
                </Button>
              </MemberRow>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader icon={<UserPlus />} title="Nommer un administrateur" description="Par email. Si la personne n'a pas encore de compte, elle reçoit une invitation pour en créer un." />
        <CardDivider />
        <form onSubmit={grant} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Email">
              {(props) => <Input {...props} type="email" inputMode="email" autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.fr" />}
            </Field>
          </div>
          <Button type="submit" variant="primary" icon={<ShieldPlus />} loading={pending && busyId === "form"} disabled={pending || !email.trim()}>
            Nommer administrateur
          </Button>
        </form>
      </Card>

      {others.length > 0 ? (
        <Card>
          <CardHeader title={`Autres membres (${others.length})`} description="Comptes déjà rattachés au club. Un clic suffit pour en faire un administrateur." />
          <CardDivider />
          <ul className="flex flex-col divide-y divide-border">
            {others.map((m) => (
              <MemberRow key={m.membershipId} member={m}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ShieldPlus />}
                  loading={pending && busyId === m.membershipId}
                  disabled={pending || !m.email}
                  title={!m.email ? "Email du compte introuvable." : undefined}
                  onClick={() => run(() => browserApi.platform.grantClubAdmin(data.club.id, m.email!), `${memberName(m)} est maintenant administrateur.`, m.membershipId)}
                >
                  Nommer admin
                </Button>
              </MemberRow>
            ))}
          </ul>
        </Card>
      ) : null}
      {confirmDialog}
    </div>
  );
}

function MemberRow({ member, children }: { member: Member; children: React.ReactNode }) {
  const name = memberName(member);
  const otherRoles = member.roles.filter((r) => r.role !== "club_admin");
  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PersonAvatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-foreground">
            <span className="truncate">{name}</span>
            {member.isMe ? (
              <StatusBadge tone="accent" size="sm">
                Toi
              </StatusBadge>
            ) : null}
            {member.status === "suspended" ? (
              <StatusBadge tone="warning" size="sm">
                Suspendu
              </StatusBadge>
            ) : null}
          </p>
          <p className="type-meta truncate text-[12.5px]">
            {[member.email && member.email !== name ? member.email : null, ...otherRoles.map((r) => ROLE_LABELS[r.role])].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 sm:justify-end">{children}</div>
    </li>
  );
}
