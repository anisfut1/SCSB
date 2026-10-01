"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MailPlus, MapPin, Pencil } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/States";
import { Switch } from "@/components/ui/Switch";
import { Toast } from "@/components/ui/Toast";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { TeamDto } from "@/lib/api/clubs";
import type { ClubMemberDto, ClubVenueAdminDto, RoleGrantDto } from "@/lib/api/members";
import { ROLE_LABELS, type ClubRole } from "@/lib/permissions/roles";

/** Rôles attribuables ici, dans l'ordre d'affichage. */
const EDITABLE_ROLES: { role: ClubRole; description: string }[] = [
  { role: "coach", description: "Demande des dérogations pour les matchs de ses équipes." },
  { role: "correspondant_club", description: "Reçoit et traite les demandes de dérogation des coachs." },
  { role: "responsable_tables", description: "Organise les tables de marque." },
  { role: "club_admin", description: "Tous les droits sur le club." },
];

function roleChips(member: ClubMemberDto, teams: TeamDto[]): { key: string; label: string }[] {
  const teamName = (id: string | null) => (id ? (teams.find((t) => t.id === id)?.name ?? "Équipe") : null);
  return member.roles.map((r) => ({
    key: `${r.role}:${r.scopeTeamId ?? "all"}`,
    label: r.role === "coach" ? `Coach · ${teamName(r.scopeTeamId) ?? "toutes les équipes"}` : ROLE_LABELS[r.role],
  }));
}

/**
 * Membres du club et leurs rôles (club_admin) — c'est ici qu'on désigne les
 * coachs (portée par équipe) et le coordinateur des dérogations
 * (`correspondant_club`). Gymnases : actifs = proposés dans le planning des
 * demandes de dérogation. Tout passe par club-manager-api.
 */
export function MembersManager({ clubId, initialMembers, initialVenues, teams }: { clubId: string; initialMembers: ClubMemberDto[]; initialVenues: ClubVenueAdminDto[]; teams: TeamDto[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [venues, setVenues] = useState(initialVenues);
  const [editing, setEditing] = useState<ClubMemberDto | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeTeams = useMemo(() => teams.filter((t) => t.active), [teams]);
  const coordinators = members.filter((m) => m.roles.some((r) => r.role === "correspondant_club"));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function toggleVenue(venue: ClubVenueAdminDto, active: boolean) {
    setError(null);
    try {
      const updated = await browserApi.members.updateVenue(clubId, venue.id, { active });
      setVenues((list) => list.map((v) => (v.id === updated.id ? updated : v)));
      setToast(`${updated.name} : ${updated.active ? "proposé" : "masqué"} dans le planning des dérogations.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Modification impossible pour le moment.");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {toast ? <Toast message={toast} /> : null}
      {error ? (
        <Notice tone="danger" live>
          {error}
        </Notice>
      ) : null}

      <section aria-labelledby="members-title" className="flex flex-col gap-4">
        <SectionHeader id="members-title" title="Membres" description="Un coach ne voit que les matchs des équipes qui lui sont attribuées. Le coordinateur reçoit toutes les demandes de dérogation." />
        {coordinators.length === 0 ? <Notice tone="warning">Aucun coordinateur n&apos;est actuellement configuré pour recevoir les demandes de dérogation. Attribue le rôle « Coordinateur » à au moins un membre.</Notice> : null}

        <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {members.map((m) => {
            const name = m.displayName ?? (m.licencie ? `${m.licencie.firstName} ${m.licencie.lastName}` : (m.email ?? "Membre"));
            return (
              <li key={m.membershipId}>
                <Card padded={false} className="flex h-full items-start gap-3 p-4">
                  <PersonAvatar name={name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-foreground">
                        <span className="truncate">{name}</span>
                        {m.isMe ? <StatusBadge size="sm">Toi</StatusBadge> : null}
                        {m.status === "suspended" ? (
                          <StatusBadge size="sm" tone="warning">
                            Suspendu
                          </StatusBadge>
                        ) : null}
                      </p>
                      {m.email && m.email !== name ? <p className="type-meta truncate">{m.email}</p> : null}
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {roleChips(m, teams).map((c) => (
                        <li key={c.key}>
                          <StatusBadge size="sm" tone={c.key.startsWith("correspondant_club") ? "accent" : "neutral"} dot={false}>
                            {c.label}
                          </StatusBadge>
                        </li>
                      ))}
                      {m.roles.length === 0 ? <li className="type-meta">Aucun rôle</li> : null}
                    </ul>
                  </div>
                  <Button variant="ghost" size="sm" icon={<Pencil />} onClick={() => setEditing(m)}>
                    Rôles
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>

        <InviteForm
          clubId={clubId}
          teams={activeTeams}
          onInvited={(next, email) => {
            setMembers(next);
            setToast(`Invitation envoyée à ${email}.`);
          }}
        />
      </section>

      <section aria-labelledby="venues-title" className="flex flex-col gap-4">
        <SectionHeader id="venues-title" title="Gymnases" description="Gymnases proposés dans le planning des demandes de dérogation. Ils sont repris automatiquement des matchs à domicile synchronisés depuis la FFBB." />
        {venues.length === 0 ? (
          <EmptyState compact icon={<MapPin />} title="Aucun gymnase" description="Les gymnases apparaîtront après la synchronisation FFBB des matchs à domicile." />
        ) : (
          <Card className="flex flex-col divide-y divide-border py-1">
            {venues.map((v) => (
              <div key={v.id} className="py-1.5">
                <Switch checked={v.active} onChange={(next) => toggleVenue(v, next)} label={v.name} description={v.address ?? (v.active ? "Proposé dans le planning" : "Masqué du planning")} />
              </div>
            ))}
          </Card>
        )}
      </section>

      <RolesSheet
        key={editing?.membershipId ?? "none"}
        clubId={clubId}
        member={editing}
        teams={activeTeams}
        onClose={() => setEditing(null)}
        onSaved={(next) => {
          setMembers(next);
          setEditing(null);
          setToast("Rôles mis à jour.");
        }}
      />
    </div>
  );
}

function RolesSheet({ clubId, member, teams, onClose, onSaved }: { clubId: string; member: ClubMemberDto | null; teams: TeamDto[]; onClose: () => void; onSaved: (members: ClubMemberDto[]) => void }) {
  // Remonté à chaque membre (`key`) : l'état part toujours des rôles actuels.
  const [roles, setRoles] = useState<RoleGrantDto[]>(member?.roles ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!member) return null;
  const has = (role: ClubRole) => roles.some((r) => r.role === role);
  const coachAll = roles.some((r) => r.role === "coach" && r.scopeTeamId === null);
  const coachTeams = new Set(roles.filter((r) => r.role === "coach" && r.scopeTeamId).map((r) => r.scopeTeamId as string));
  // Rôles non éditables ici (joueur, parent…) : conservés tels quels.
  const preserved = roles.filter((r) => !EDITABLE_ROLES.some((e) => e.role === r.role));

  function toggleRole(role: ClubRole, on: boolean) {
    setRoles((list) => {
      const rest = list.filter((r) => r.role !== role);
      return on ? [...rest, { role, scopeTeamId: null }] : rest;
    });
  }

  function setCoachScope(teamId: string | null, on: boolean) {
    setRoles((list) => {
      const others = list.filter((r) => r.role !== "coach");
      if (teamId === null) return on ? [...others, { role: "coach", scopeTeamId: null }] : others;
      const current = list.filter((r) => r.role === "coach" && r.scopeTeamId !== null && r.scopeTeamId !== teamId);
      return [...others, ...current, ...(on ? [{ role: "coach" as ClubRole, scopeTeamId: teamId }] : [])];
    });
  }

  async function save() {
    if (!member) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await browserApi.members.setRoles(clubId, member.membershipId, roles));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Rôles · ${member.displayName ?? member.email ?? "Membre"}`}
      description="Les droits sont appliqués par club-manager-api dès l'enregistrement."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <Notice tone="danger" live>
            {error}
          </Notice>
        ) : null}
        {EDITABLE_ROLES.map(({ role, description }) =>
          role === "coach" ? (
            <fieldset key={role} className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-border p-3">
              <legend className="px-1 text-sm font-medium text-foreground">{ROLE_LABELS.coach}</legend>
              <p className="type-meta px-1">{description}</p>
              <Checkbox label="Toutes les équipes" checked={coachAll} onChange={(e) => setCoachScope(null, e.target.checked)} />
              {!coachAll ? (
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  {teams.map((t) => (
                    <Checkbox key={t.id} label={t.name} checked={coachTeams.has(t.id)} onChange={(e) => setCoachScope(t.id, e.target.checked)} />
                  ))}
                </div>
              ) : null}
            </fieldset>
          ) : (
            <Checkbox key={role} label={ROLE_LABELS[role]} description={description} checked={has(role)} onChange={(e) => toggleRole(role, e.target.checked)} disabled={role === "club_admin" && member.isMe} />
          ),
        )}
        {preserved.length > 0 ? <p className="type-meta">Autres rôles conservés : {preserved.map((r) => ROLE_LABELS[r.role]).join(", ")}.</p> : null}
      </div>
    </Sheet>
  );
}

function InviteForm({ clubId, teams, onInvited }: { clubId: string; teams: TeamDto[]; onInvited: (members: ClubMemberDto[], email: string) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClubRole>("coach");
  const [teamId, setTeamId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const target = email.trim();
      const next = await browserApi.members.invite(clubId, target, [{ role, scopeTeamId: role === "coach" && teamId ? teamId : null }]);
      setEmail("");
      onInvited(next, target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invitation impossible pour le moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card variant="muted" className="flex flex-col gap-3">
      <p className="type-card text-foreground">Ajouter un membre</p>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
        <Field label="Email" required>
          {(props) => <Input {...props} type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.fr" />}
        </Field>
        <Field label="Rôle">
          {(props) => (
            <Select {...props} value={role} onChange={(e) => setRole(e.target.value as ClubRole)}>
              {EDITABLE_ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {ROLE_LABELS[r.role]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Équipe">
          {(props) => (
            <Select {...props} value={teamId} onChange={(e) => setTeamId(e.target.value)} disabled={role !== "coach"}>
              <option value="">Toutes</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button type="submit" variant="primary" icon={<MailPlus />} loading={sending} disabled={!email.trim()}>
          Inviter
        </Button>
      </form>
      {error ? (
        <Notice tone="danger" live>
          {error}
        </Notice>
      ) : (
        <p className="type-meta">Un compte existant est simplement ajouté au club ; sinon, un email d&apos;invitation est envoyé.</p>
      )}
    </Card>
  );
}
