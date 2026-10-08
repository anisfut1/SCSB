"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, MailWarning } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { PasswordField } from "./PasswordField";

const MIN_LENGTH = 8;

/**
 * Choix du mot de passe depuis le lien de l'email (invitation ou mot de passe
 * oublié). Le lien n'est vérifié qu'à la validation du formulaire, jamais à
 * l'ouverture de la page : un antivirus de messagerie qui « ouvre » le lien
 * ne le consomme pas.
 */
export function WelcomeForm({ tokenHash, type, next, submitLabel }: { tokenHash: string; type: EmailOtpType; next: string; submitLabel: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== password;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(`Au moins ${MIN_LENGTH} caractères.`);
    if (password !== confirmation) return setError("Les deux mots de passe ne sont pas identiques.");

    setPending(true);
    const supabase = createBrowserSupabaseClient();
    if (!verified) {
      const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (otpError) {
        setPending(false);
        setExpired(true);
        return;
      }
      setVerified(true);
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setPending(false);
      setError(updateError.message.toLowerCase().includes("different") ? "Choisis un mot de passe différent de l'ancien." : "Ce mot de passe n'a pas pu être enregistré. Essaie-en un autre.");
      return;
    }
    // Rechargement complet : les pages serveur relisent la nouvelle session.
    window.location.assign(next);
  }

  if (expired) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="warning" icon={<MailWarning />} title="Ce lien n'est plus valable">
          Il a déjà été utilisé ou il a expiré. Demande un nouveau lien : il arrive en quelques secondes.
        </Notice>
        <ButtonLink href="/mot-de-passe-oublie" variant="primary" size="lg" iconRight={<ArrowRight />} className="w-full">
          Recevoir un nouveau lien
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-5">
      <PasswordField label="Mot de passe" name="password" autoComplete="new-password" value={password} onChange={setPassword} hint={`Au moins ${MIN_LENGTH} caractères.`} error={tooShort ? `Encore ${MIN_LENGTH - password.length} caractère${MIN_LENGTH - password.length > 1 ? "s" : ""}.` : undefined} />
      <PasswordField label="Confirme le mot de passe" name="confirmation" autoComplete="new-password" value={confirmation} onChange={setConfirmation} error={mismatch ? "Les deux mots de passe ne sont pas identiques." : undefined} />
      {error ? (
        <Notice tone="danger" live>
          {error}
        </Notice>
      ) : null}
      <Button type="submit" variant="primary" size="lg" loading={pending} iconRight={pending ? undefined : <ArrowRight />} className="mt-1 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
