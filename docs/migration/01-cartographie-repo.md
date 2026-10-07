# 01 — Cartographie du repository
_À remplir en Phase 1._

## État initial (Phase 0, 2026-10-07)
- Stack : Next.js 16.3.5, React 19.2.8, TypeScript 5, Tailwind 4, Vitest 5, Zod 4, Supabase (auth uniquement).
- ~225 fichiers sous `src/`, un `worker/` (Dockerfile, vitest) et `spikes/fbi-auth`.
- Back externe : `club-manager-api` (voir ../MIGRATION_TO_API.md). Client API : `src/lib/api/`.
- Variables `NEXT_PUBLIC_*` : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLUB_MANAGER_API_URL` (.env.example) — à auditer en Phase 1.
