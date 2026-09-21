/**
 * Seed de développement local.
 *
 * Crée :
 * - un compte club_admin (via l'API admin Supabase), rattaché au tenant
 *   pilote SC Sète Basket via club_memberships/membership_roles
 * - optionnellement, ce même compte comme platform_admin (SEED_PLATFORM_ADMIN=true) —
 *   c'est la SEULE façon de créer un platform_admin : aucune UI ne le permet
 *   (§10 du brief SaaS, pas d'auto-élévation possible)
 * - quelques licenciés fictifs, clairement identifiables comme tels
 *
 * Aucune donnée réelle du club (aucun vrai licencié, aucun mot de passe
 * réel) : les valeurs par défaut sont volontairement des placeholders.
 *
 * Prérequis : un projet Supabase (local ou distant) avec les migrations de
 * `supabase/migrations/` déjà appliquées, et les variables d'environnement
 * du projet dans `.env.local` (voir .env.example).
 *
 * Usage :
 *   SEED_ADMIN_EMAIL=admin@scsete-basket.local SEED_ADMIN_PASSWORD=change-me-1234 npm run seed
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... SEED_PLATFORM_ADMIN=true npm run seed
 *
 * SEED_ADMIN_PASSWORD est obligatoire (pas de mot de passe par défaut dans
 * le code, même factice) et sert uniquement en local.
 *
 * Note technique : le script `seed` (package.json) lance ce fichier avec
 * `NODE_OPTIONS=--conditions=react-server`, requis pour que le marqueur
 * `server-only` (utilisé par lib/supabase/admin.ts) se résolve correctement
 * en dehors du bundler Next.js. Ne pas lancer ce fichier directement avec
 * `tsx scripts/seed.ts` sans cette variable.
 */
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const FAKE_LICENCIES = [
  { first_name: "Alix", last_name: "Testeur", birth_date: "2010-04-12" },
  { first_name: "Sacha", last_name: "Exemple", birth_date: "2008-09-01" },
  { first_name: "Nour", last_name: "Bidon", birth_date: "1995-01-20" },
] as const;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@scsete-basket.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const seedPlatformAdmin = process.env.SEED_PLATFORM_ADMIN === "true";

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD est requis (aucun mot de passe par défaut n'est codé en dur). " +
        "Exemple : SEED_ADMIN_PASSWORD=change-me-1234 npm run seed",
    );
  }

  const supabase = createAdminSupabaseClient();

  const { data: club, error: clubError } = await supabase.from("clubs").select("id").eq("slug", "sc-sete-basket").single();

  if (clubError || !club) {
    throw new Error(`Impossible de trouver le club pilote sc-sete-basket (migrations appliquées ?) : ${clubError?.message ?? "aucune ligne"}`);
  }

  console.log(`Club pilote trouvé (id=${club.id}).`);

  console.log(`Création/récupération du compte admin (${adminEmail})…`);
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw new Error(`Impossible de lister les utilisateurs existants : ${listError.message}`);
  }

  let adminUserId = existingUsers.users.find((u) => u.email === adminEmail)?.id;

  if (!adminUserId) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (createError || !created.user) {
      throw new Error(`Impossible de créer le compte admin : ${createError?.message ?? "inconnu"}`);
    }

    adminUserId = created.user.id;
    console.log(`Compte admin créé (id=${adminUserId}).`);
  } else {
    console.log(`Compte admin déjà existant (id=${adminUserId}).`);
  }

  // Le trigger `handle_new_auth_user` a déjà créé le profil ; on met juste à jour le nom affiché.
  const { error: profileError } = await supabase.from("profiles").update({ display_name: "Admin (seed)" }).eq("user_id", adminUserId);

  if (profileError) {
    throw new Error(`Impossible de mettre à jour le profil admin : ${profileError.message}`);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("club_memberships")
    .upsert({ club_id: club.id, user_id: adminUserId }, { onConflict: "club_id,user_id" })
    .select("id")
    .single();

  if (membershipError || !membership) {
    throw new Error(`Impossible de créer le membership : ${membershipError?.message}`);
  }

  const { error: roleError } = await supabase
    .from("membership_roles")
    .upsert({ membership_id: membership.id, role: "club_admin" }, { onConflict: "membership_id,role,scope_key" });

  if (roleError) {
    throw new Error(`Impossible d'attribuer le rôle club_admin : ${roleError.message}`);
  }

  console.log(`Rôle club_admin attribué sur ${club.id}.`);

  if (seedPlatformAdmin) {
    const { error: platformAdminError } = await supabase.from("platform_admins").upsert({ user_id: adminUserId }, { onConflict: "user_id" });

    if (platformAdminError) {
      throw new Error(`Impossible d'attribuer le rôle platform_admin : ${platformAdminError.message}`);
    }

    console.log("Rôle platform_admin attribué (SEED_PLATFORM_ADMIN=true).");
  }

  const { count: existingLicenciesCount, error: countError } = await supabase
    .from("licencies")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id);

  if (countError) {
    throw new Error(`Impossible de vérifier les licenciés existants : ${countError.message}`);
  }

  if (existingLicenciesCount && existingLicenciesCount > 0) {
    console.log(`${existingLicenciesCount} licencié(s) déjà présent(s), insertion des fictifs ignorée.`);
  } else {
    console.log("Insertion de licenciés fictifs…");
    const { error: licenciesError } = await supabase.from("licencies").insert(
      FAKE_LICENCIES.map((licencie) => ({
        ...licencie,
        club_id: club.id,
      })),
    );

    if (licenciesError) {
      throw new Error(`Impossible d'insérer les licenciés fictifs : ${licenciesError.message}`);
    }

    console.log(`${FAKE_LICENCIES.length} licenciés fictifs insérés.`);
  }

  console.log("Seed terminé.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
