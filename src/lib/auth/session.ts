import "server-only";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/api/auth.server";

/** Utilisateur connecté, tel que vérifié dans les claims JWT (pas de lecture de la table des profils). */
export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * Utilisateur actuellement connecté (Server Components / Server Actions),
 * ou `null` si aucune session valide. Ne redirige jamais — c'est au code
 * appelant de décider quoi faire d'une absence de session.
 *
 * Les rôles applicatifs sont désormais scopés par club (voir
 * src/lib/tenancy/club-context.ts) : ce module ne gère plus que
 * l'authentification globale (compte Supabase Auth), pas les permissions.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const auth = await getServerAuth();
  return auth ? { id: auth.userId, email: auth.email } : null;
}

/**
 * Variante stricte de `getCurrentUser` : redirige vers /login si aucune
 * session valide. Destinée aux layouts/pages protégés. Le proxy protège déjà
 * ces routes en amont (voir src/proxy.ts) ; cet appel est la seconde
 * barrière côté serveur, pas un simple confort d'UI.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
