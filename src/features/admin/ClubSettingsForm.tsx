"use client";

import { useActionState } from "react";
import { updateClubSettingsAction, type ClubSettingsActionResult } from "@/server/actions/club-settings";

const initialState: ClubSettingsActionResult = { success: false, message: "" };

interface ClubSettingsFormProps {
  clubSlug: string;
  name: string;
  shortName: string | null;
  timezone: string;
}

export function ClubSettingsForm({ clubSlug, name, shortName, timezone }: ClubSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateClubSettingsAction.bind(null, clubSlug), initialState);

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
          defaultValue={name}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="short_name" className="text-sm font-medium">
          Nom court (optionnel)
        </label>
        <input
          id="short_name"
          name="short_name"
          type="text"
          defaultValue={shortName ?? ""}
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
          defaultValue={timezone}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
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
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
