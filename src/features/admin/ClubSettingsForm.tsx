"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, Input } from "@/components/ui/Field";
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
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom du club" className="sm:col-span-2">
          {(props) => <Input {...props} name="name" type="text" defaultValue={name} autoComplete="organization" />}
        </Field>
        <Field label="Nom court" optional hint="Affiché dans les listes compactes (cartes de match).">
          {(props) => <Input {...props} name="short_name" type="text" defaultValue={shortName ?? ""} />}
        </Field>
        <Field label="Fuseau horaire" hint="Identifiant IANA, ex. Europe/Paris.">
          {(props) => <Input {...props} name="timezone" type="text" defaultValue={timezone} />}
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button type="submit" variant="primary" loading={isPending} icon={<Save />}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {state.message ? <FormMessage tone={state.success ? "success" : "danger"}>{state.message}</FormMessage> : null}
      </div>
    </form>
  );
}
