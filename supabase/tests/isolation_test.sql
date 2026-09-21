-- Tests d'isolation RLS reels, executes contre un vrai moteur Postgres
-- (shim local reproduisant auth.uid()/roles Supabase). Chaque assertion
-- echouee leve une exception explicite (le script s'arrete au premier
-- echec) ; un script qui va jusqu'au bout sans erreur = tous les tests OK.

set client_min_messages to notice;

create or replace function pg_temp.assert_count(label text, expected bigint, actual bigint) returns void
language plpgsql as $$
begin
  if expected <> actual then
    raise exception 'ECHEC [%] : attendu %, obtenu %', label, expected, actual;
  else
    raise notice 'OK [%] (=%)', label, actual;
  end if;
end;
$$;

-- =============================================================
-- Scenario 1 : User A (membre UNIQUEMENT du Club A) ne voit QUE le Club A
-- =============================================================
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';

select pg_temp.assert_count('user A - matches visibles', 1, (select count(*) from public.matches));
select pg_temp.assert_count('user A - matches: bien celui du club A', 1, (select count(*) from public.matches where club_id = 'aaaaaaaa-0000-0000-0000-000000000000'));
select pg_temp.assert_count('user A - matches club B invisibles', 0, (select count(*) from public.matches where club_id = 'bbbbbbbb-0000-0000-0000-000000000000'));

select pg_temp.assert_count('user A - sync_runs visibles (club_admin de A)', 1, (select count(*) from public.sync_runs));
select pg_temp.assert_count('user A - emarque_imports visibles', 1, (select count(*) from public.emarque_imports));
select pg_temp.assert_count('user A - match_participants visibles', 1, (select count(*) from public.match_participants));
select pg_temp.assert_count('user A - player_match_stats visibles', 1, (select count(*) from public.player_match_stats));

-- licencies : lecture "own" uniquement (pas de membership.licencie_id ici) + club_admin => tout le club A
select pg_temp.assert_count('user A - licencies visibles (club_admin de A)', 1, (select count(*) from public.licencies));

-- fbi_credentials : AUCUNE policy authenticated => invisible meme pour son propre club
select pg_temp.assert_count('user A - fbi_credentials TOUJOURS invisibles (service role only)', 0, (select count(*) from public.fbi_credentials));

-- Tentative de lecture DIRECTE par UUID connu du match B (meme en connaissant l'ID)
select pg_temp.assert_count('user A - lecture directe match B par UUID refusee', 0, (select count(*) from public.matches where id = 'bbbbbbbb-0000-0000-0000-000000000006'));

-- Tentative d'ECRITURE sur le club B (UPDATE ne doit affecter aucune ligne)
update public.matches set score_home = 999 where club_id = 'bbbbbbbb-0000-0000-0000-000000000000';
select pg_temp.assert_count('user A - UPDATE sur match B affecte 0 ligne', 0, (select count(*) from public.matches where club_id = 'bbbbbbbb-0000-0000-0000-000000000000' and score_home = 999));

reset role;
-- (repasser en superuser pour verifier la verite terrain sans RLS)
select pg_temp.assert_count('verite terrain - match B intact malgre la tentative user A', 0, (select count(*) from public.matches where club_id = 'bbbbbbbb-0000-0000-0000-000000000000' and score_home = 999));

-- =============================================================
-- Scenario 2 : User B (membre UNIQUEMENT du Club B) ne voit QUE le Club B
-- =============================================================
set role authenticated;
set request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000001';

select pg_temp.assert_count('user B - matches visibles', 1, (select count(*) from public.matches));
select pg_temp.assert_count('user B - matches: bien celui du club B', 1, (select count(*) from public.matches where club_id = 'bbbbbbbb-0000-0000-0000-000000000000'));
select pg_temp.assert_count('user B - matches club A invisibles', 0, (select count(*) from public.matches where club_id = 'aaaaaaaa-0000-0000-0000-000000000000'));
select pg_temp.assert_count('user B - licencies club A invisibles', 0, (select count(*) from public.licencies where club_id = 'aaaaaaaa-0000-0000-0000-000000000000'));
select pg_temp.assert_count('user B - sync_runs club A invisibles', 0, (select count(*) from public.sync_runs where club_id = 'aaaaaaaa-0000-0000-0000-000000000000'));

reset role;

-- =============================================================
-- Scenario 3 : User AB (membre des DEUX clubs, coach en A, joueur en B)
-- =============================================================
set role authenticated;
set request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000001';

select pg_temp.assert_count('user AB - voit les matchs des DEUX clubs', 2, (select count(*) from public.matches));
select pg_temp.assert_count('user AB - est bien membre de A et B', 2, (select count(*) from public.club_memberships where user_id = 'cccccccc-0000-0000-0000-000000000001'));

-- User AB n'est PAS club_admin (coach/joueur seulement) => ne doit PAS pouvoir
-- ecrire sur les tables reservees aux club_admin (ex: teams).
update public.teams set name = 'Hack' where club_id = 'aaaaaaaa-0000-0000-0000-000000000000';
select pg_temp.assert_count('user AB (coach, pas admin) - UPDATE teams club A refuse', 0, (select count(*) from public.teams where club_id = 'aaaaaaaa-0000-0000-0000-000000000000' and name = 'Hack'));

reset role;

-- =============================================================
-- Scenario 4 : platform_admin voit tout, cross-club
-- =============================================================
insert into public.platform_admins (user_id) values ('cccccccc-0000-0000-0000-000000000001');

set role authenticated;
set request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000001';

select pg_temp.assert_count('platform_admin - voit tous les matchs (2 clubs)', 2, (select count(*) from public.matches));
select pg_temp.assert_count('platform_admin - voit tous les sync_runs (2 clubs)', 2, (select count(*) from public.sync_runs));

reset role;
delete from public.platform_admins where user_id = 'cccccccc-0000-0000-0000-000000000001';

-- =============================================================
-- Scenario 5 : meme identifiant externe dans 2 clubs (coexistence, pas collision)
-- =============================================================
select pg_temp.assert_count('coexistence - 2 licencies avec le meme numero, clubs differents', 2, (select count(*) from public.licencies where license_number = 'AAA123456'));
select pg_temp.assert_count('coexistence - 2 matches avec le meme ffbb_match_id, clubs differents', 2, (select count(*) from public.matches where ffbb_match_id = 'ffbb-shared-123'));

-- =============================================================
-- Scenario 6 : sans authentification (anon), rien n'est visible
-- =============================================================
set role anon;
select pg_temp.assert_count('anon - aucun match visible', 0, (select count(*) from public.matches));
select pg_temp.assert_count('anon - aucun licencie visible', 0, (select count(*) from public.licencies));
reset role;

do $$ begin raise notice '=== TOUS LES TESTS D''ISOLATION SONT PASSES ==='; end $$;
