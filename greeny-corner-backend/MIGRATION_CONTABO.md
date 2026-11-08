# Backend migration: Hostinger → Contabo

Scope: `api.greenycorner.ae` only (Laravel 12). The Next.js frontend stays on Vercel; mail stays on Hostinger (SMTP `support@greenycorner.ae`).

## Target layout (Contabo VPS `77.237.245.10`, Ubuntu 24.04)
The server already runs **mekna.app** as a Docker Compose stack (`/home/deploy/mekna`) fronted by **Caddy** (ports 80/443, automatic HTTPS). Greeny is a separate compose project and never touches mekna's containers or data:

| Path / object | Purpose |
|---|---|
| `/home/deploy/greeny/docker-compose.prod.yml` (source: `deploy/docker-compose.prod.yml`) | services `greeny-api` (nginx+php-fpm :8080), `greeny-worker` (queue), `greeny-db` (MariaDB 11.8, same version as Hostinger) |
| `/home/deploy/greeny/app/` | code (rsync'd from this folder; built by `Dockerfile`) |
| `/home/deploy/greeny/laravel.env`, `db.env`, `secrets/firebase.json` | secrets, mode 600/700 — never in git |
| volumes `greeny_uploads` (→ `storage/app`), `greeny_db_data` | plant images, database |
| network `mekna_default` | only `greeny-api` joins it, so mekna's Caddy can proxy to it. DB is on the private `greeny_internal` network, no published ports |

App changes made for this: `Dockerfile`, `.dockerignore`, `deploy/docker-compose.prod.yml`, and `TRUSTED_PROXIES` support in `bootstrap/app.php` (so Laravel sees the real client IP / https behind Caddy; no effect when the var is unset).

## Cutover steps (DNS is the only thing that makes it live)
1. Lower the TTL of the `api` DNS record to 300s (do this a few hours before).
2. Maintenance window (~5 min): put the Hostinger API in maintenance, run the **final sync** — re-dump DB and re-copy `storage/app` (commands below), restart `greeny-api`/`greeny-worker`.
3. Add the Caddy block (candidate saved at `/home/deploy/greeny/Caddyfile.candidate`, original backed up as `Caddyfile.mekna.backup`) to `/home/deploy/mekna/deploy/Caddyfile`, then `docker exec mekna-caddy-1 caddy reload --config /etc/caddy/Caddyfile` (graceful, no mekna downtime). Caddy gets the Let's Encrypt cert once DNS resolves.
   ```
   api.greenycorner.ae {
   	import common
   	reverse_proxy greeny-api:8080
   }
   ```
4. Point the `api` A record to `77.237.245.10`.
5. Verify (website, mobile app login, plant identify, encyclopedia pages). Keep Hostinger untouched ~1 week as rollback: flip the A record back.

## Final-sync commands (run from a machine with access to both servers)
```bash
# DB (MariaDB 11.8 → MariaDB 11.8)
ssh hostinger 'mysqldump -u USER -p... --single-transaction --quick --skip-lock-tables --no-tablespaces --routines DB | gzip -c' \
  | ssh deploy@77.237.245.10 'cd /home/deploy/greeny && gunzip -c | docker compose -f docker-compose.prod.yml exec -T greeny-db sh -c "mariadb -uroot -p\"\$MARIADB_ROOT_PASSWORD\" \"\$MARIADB_DATABASE\""'
# Uploads
ssh hostinger 'cd .../api/storage/app && tar czf - .' \
  | ssh deploy@77.237.245.10 'docker run --rm -i -v greeny_uploads:/data alpine sh -c "tar xzf - -C /data && chown -R 33:33 /data"'
```

## Deploying code changes afterwards
```bash
rsync -az --exclude='.env*' --exclude=vendor --exclude=storage/app --exclude=tests ./ deploy@77.237.245.10:/home/deploy/greeny/app/
ssh deploy@77.237.245.10 'cd /home/deploy/greeny && docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d && docker compose -f docker-compose.prod.yml exec greeny-api php artisan migrate --force'
```
(Code is baked into the image with OPcache on, so a rebuild + `up -d` is required for changes to take effect.)

## Known leftovers / follow-ups
- `PlantController::resolveImagePath()` has fallbacks for Hostinger's `api/` folder layout; harmless on Contabo (the primary `Storage::disk('public')` path is used) — can be removed later.
- `firebase.json` on Hostinger is a 699-byte placeholder (fake keys) — Google/Apple sign-in still needs the real service-account file; drop it into `secrets/firebase.json` and restart.
- After rollback window: delete `~/plants-snapshot-*.json` and `~/deploy-backup-*` on Hostinger (user data); rotate the Hostinger SSH/DB passwords that were kept in plaintext notes.
- `storage/logs` (514 MB) was intentionally not copied.
