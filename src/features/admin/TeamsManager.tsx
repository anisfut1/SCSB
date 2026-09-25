"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { TeamDto } from "@/lib/api/clubs";

type Status = { kind: "success" | "error"; text: string } | null;

const inputClassName = "mt-1 w-full rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent";
const labelClassName = "block text-sm font-medium";

function TeamRow({ clubId, team }: { clubId: string; team: TeamDto }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(null);
  const [name, setName] = useState(team.name);
  const [category, setCategory] = useState(team.category ?? "");
  const [sexe, setSexe] = useState(team.sexe ?? "");
  const [numeroEquipe, setNumeroEquipe] = useState(team.numeroEquipe ?? "");
  const [active, setActive] = useState(team.active);

  function handleSave() {
    setStatus(null);
    startTransition(async () => {
      try {
        await browserApi.clubs.updateTeam(clubId, team.id, {
          name: name.trim(),
          category: category.trim() || null,
          sexe: sexe === "M" || sexe === "F" ? sexe : null,
          numeroEquipe: numeroEquipe.trim() || null,
          active,
        });
        setStatus({ kind: "success", text: "Équipe mise à jour." });
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Mise à jour impossible." });
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 border-t border-black/5 py-3 first:border-t-0 dark:border-white/10">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className={labelClassName}>
          Nom
          <input className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className={labelClassName}>
          Catégorie
          <input className={inputClassName} placeholder="U11, SM, …" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className={labelClassName}>
          Sexe
          <select className={inputClassName} value={sexe} onChange={(e) => setSexe(e.target.value)}>
            <option value="">—</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </label>
        <label className={labelClassName}>
          N° équipe
          <input className={inputClassName} placeholder="1, 2, …" value={numeroEquipe} onChange={(e) => setNumeroEquipe(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {status ? (
          <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {status.text}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function CreateTeamForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sexe, setSexe] = useState("");
  const [numeroEquipe, setNumeroEquipe] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    startTransition(async () => {
      try {
        await browserApi.clubs.createTeam(clubId, {
          name: name.trim(),
          category: category.trim() || null,
          sexe: sexe === "M" || sexe === "F" ? sexe : null,
          numeroEquipe: numeroEquipe.trim() || null,
        });
        setName("");
        setCategory("");
        setSexe("");
        setNumeroEquipe("");
        setStatus({ kind: "success", text: "Équipe créée." });
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Création impossible." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className={labelClassName}>
          Nom
          <input className={inputClassName} placeholder="U11M-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className={labelClassName}>
          Catégorie
          <input className={inputClassName} placeholder="U11, SM, …" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className={labelClassName}>
          Sexe
          <select className={inputClassName} value={sexe} onChange={(e) => setSexe(e.target.value)}>
            <option value="">—</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </label>
        <label className={labelClassName}>
          N° équipe
          <input className={inputClassName} placeholder="1, 2, …" value={numeroEquipe} onChange={(e) => setNumeroEquipe(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/85"
        >
          {isPending ? "Création…" : "Créer l'équipe"}
        </button>
        {status ? (
          <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {status.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Gestion des équipes (demande du club : sectoriser le roster/calendrier
 * par équipe — U9, U11M-1/2, U11F, U13M/F, U15M-1/2, U15F, U18M/F,
 * SM1/2/3, SF). Certaines catégories n'ont pas encore d'engagement FFBB
 * confirmé en début de saison (phase de brassage) : cette page permet de
 * les enregistrer manuellement dès maintenant, voir docs/TEAMS.md côté
 * club-manager-api — la synchro FFBB réutilisera ensuite la même ligne
 * (résolution par catégorie/sexe/numéro, jamais par le nom) une fois
 * l'engagement confirmé.
 */
export function TeamsManager({ clubId, teams }: { clubId: string; teams: TeamDto[] }) {
  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-black/70 dark:text-white/70">Nouvelle équipe</h2>
        <CreateTeamForm clubId={clubId} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-black/70 dark:text-white/70">
          Équipes ({sortedTeams.length})
        </h2>
        {sortedTeams.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">Aucune équipe enregistrée pour l&apos;instant.</p>
        ) : (
          <ul>
            {sortedTeams.map((team) => (
              <TeamRow key={team.id} clubId={clubId} team={team} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
