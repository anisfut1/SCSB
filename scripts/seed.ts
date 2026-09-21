/**
 * Seed de développement local — Phase 0.
 *
 * Crée :
 * - un compte super_admin (via l'API admin Supabase)
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

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD est requis (aucun mot de passe par défaut n'est codé en dur). " +
        "Exemple : SEED_ADMIN_PASSWORD=change-me-1234 npm run seed",
    );
  }

  const supabase = createAdminSupabaseClient();

  const { data: club, error: clubError } = await supabase
    .from("club")
    .select("id")
    .eq("ffbb_club_id", "OCC0034008")
    .single();

  if (clubError || !club) {
    throw new Error(
      `Impossible de trouver le club (migration 'club' appliquée ?) : ${clubError?.message ?? "aucune ligne"}`,
    );
  }

  console.log(`Club trouvé (id=${club.id}).`);

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
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: "Admin (seed)" })
    .eq("user_id", adminUserId);

  if (profileError) {
    throw new Error(`Impossible de mettre à jour le profil admin : ${profileError.message}`);
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: adminUserId, role: "super_admin" }, { onConflict: "user_id,role" });

  if (roleError) {
    throw new Error(`Impossible d'attribuer le rôle super_admin : ${roleError.message}`);
  }

  console.log("Rôle super_admin attribué.");

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
