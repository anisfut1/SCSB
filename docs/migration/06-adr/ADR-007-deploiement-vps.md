# ADR-007 — Topologie de déploiement sur VPS
- **Date** : 2026-10-07
- **Statut** : Proposée (dépend de Q-013 : Docker présent ? reverse proxy ? méthode de déploiement actuelle du front ?)

## Contexte
Le front **et** le nouveau back seront sur un VPS (Q-007). Inconnus : distribution, ressources, Docker, reverse proxy déjà en place, méthode de déploiement (Q-013). CI : GitHub Actions limité aux vérifications ; **aucun déploiement automatique sans validation** (`.github/workflows/ci.yml`). Le back a besoin d'un processus **API**, d'un processus **worker** (jobs, ADR-004), d'un accès à Supabase (Postgres 5432 direct et HTTPS auth) et, en coexistence, à `club-manager-api`.

## Options étudiées
| Option | Avantages | Inconvénients |
|---|---|---|
| A. **Docker Compose** (services `api`, `worker`, `proxy`) + image construite en CI et poussée vers un registre | Reproductible, retour arrière = ancienne image, isolation, limites mémoire par service | Docker à exploiter/mettre à jour ; secrets à gérer proprement |
| B. Services **systemd** (Node natif, `pm2`/unit files) | Peu de couches ; faible empreinte | Dérive de configuration, mises à jour Node manuelles, retour arrière artisanal |
| C. Orchestrateur (k3s/Nomad) | Rolling updates, secrets natifs | Surdimensionné pour un VPS et quelques services |
Reverse proxy : **Caddy** (TLS Let's Encrypt automatique, config courte) ou **Nginx + certbot** (largement connu) ou **Traefik** (labels Docker).

## Décision (proposée)
**Option A, Docker Compose**, proxy **Caddy** par défaut (**Nginx accepté si déjà en place — Q-013**). Implications :
- **Réseau** : seul le proxy expose 80/443 ; `api`/`worker` écoutent sur le réseau Docker interne ; pare-feu `ufw` : 22 (clé SSH seulement), 80, 443.
- **TLS** : certificats automatiques (ACME), HSTS ; redirection HTTP→HTTPS ; en-têtes de sécurité posés au proxy (complète LOT-14).
- **Reverse proxy = point de routage S1** (ADR-005) : `/v1/public/clubs/*/licencies/search`, `/v1/clubs/*/dashboard`… → `api` ; tout le reste → `club-manager-api`. Journaux d'accès **sans query string** (jeton personnel, E-4).
- **Secrets** : fichier `.env` **hors dépôt**, droits `600` propriétaire dédié, ou Docker/Compose secrets ; jamais dans l'image ni dans les logs ; rôle Postgres dédié (ADR-003) ; clé d'envoi d'e-mails ; jeton de service vers `club-manager-api`. Procédure de rotation écrite.
- **Sauvegardes** : la base reste chez Supabase (sauvegardes/PITR selon l'offre — **à confirmer**) ; sur le VPS : sauvegarde de `compose.yaml`, config proxy, `.env` chiffré (hors machine), et d'éventuels volumes (ex. certificats). Test de restauration documenté. Le back est **sans état** hors file `pg-boss` (en base).
- **Déploiement** : image `ghcr.io/…` construite en CI (job manuel `workflow_dispatch`), puis **déploiement manuel validé** (`docker compose pull && up -d`), avec `healthcheck` (`GET /health`) et vérification `GET /ready` avant bascule ; retour arrière = tag précédent. Aucun déploiement automatique (Q-007).
- **Exploitation** : conteneurs non-root, système de fichiers en lecture seule hors `/tmp`, limites mémoire/CPU (worker Playwright éventuel : plafonné), `restart: unless-stopped`, mises à jour de sécurité automatiques du système, journaux JSON (pino) avec rotation, supervision externe de `/health`.

## Conséquences
- (+) Déploiement reproductible et réversible sur une seule machine ; même procédure pour front et back.
- (−) Machine unique = **point de défaillance unique** (pas de haute disponibilité) ; acceptable à la charge estimée, à expliciter au propriétaire.
- (−) Maintenance système/Docker à la charge de l'équipe ; la dérive de configuration n'est évitée que par la discipline (config versionnée).
- À surveiller : ressources du VPS (inconnues), version de Docker, disponibilité du registre, latence VPS↔Supabase et VPS↔Vercel (non mesurées).
