"use client";

import { useActionState } from "react";
import { createClubAction, type CreateClubActionResult } from "@/server/actions/platform-clubs";

const initialState: CreateClubActionResult = { success: false, message: "" };

export function CreateClubForm() {
  const [state, formAction, isPending] = useActionState(createClubAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nom du club
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="ex: Club B Basket"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug (optionnel, généré depuis le nom sinon)
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          placeholder="ex: club-b-basket"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ffbb_club_id" className="text-sm font-medium">
          Code FFBB
        </label>
        <input
          id="ffbb_club_id"
          name="ffbb_club_id"
          type="text"
          required
          placeholder="ex: OCC0034008"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="timezone" className="text-sm font-medium">
          Fuseau horaire
        </label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          defaultValue="Europe/Paris"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin_email" className="text-sm font-medium">
          Email du premier administrateur (optionnel)
        </label>
        <input
          id="admin_email"
          name="admin_email"
          type="email"
          placeholder="admin@club-b.example"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          Si renseigné, une invitation Supabase est envoyée automatiquement et le rôle club_admin lui est attribué.
        </p>
      </div>

      {state.message ? (
        <p role="status" className={`text-sm ${state.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/85"
      >
        {isPending ? "Création…" : "Créer le club"}
      </button>
    </form>
  );
}
