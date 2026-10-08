import { AccountLayout } from "@/features/account/AccountLayout";
import { ForgotPasswordForm } from "@/features/account/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AccountLayout
      eyebrow="Mot de passe oublié"
      title={
        <>
          Pas de panique<span className="text-accent-text">.</span>
        </>
      }
      lead="Indique ton email : tu reçois un lien pour choisir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
    </AccountLayout>
  );
}
