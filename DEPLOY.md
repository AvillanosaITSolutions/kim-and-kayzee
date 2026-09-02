# Deployment — GitHub Actions → VPS

Push-to-deploy for kim-and-kayzee, modelled on the auto-checkout-bot pipeline and
sharing the **same VPS** (`72.62.125.235`). This stack runs in its own directory
(`/root/kim-and-kayzee`) and its own Docker Compose project (`name: kim-and-kayzee`),
so it lives alongside auto-checkout-bot and chair-rental without touching them.

```
git push to main
      │
      ▼
GitHub Actions (.github/workflows/deploy.yml)
      ├── build_check: pnpm install + `pnpm -r build`   ── if FAIL → stop
      └── deploy (push to main only)
            └── SSH into the VPS
                  ├── write /root/kim-and-kayzee/.env from the PROD_DOTENV secret
                  ├── rsync the source (docker build context)
                  ├── (re)use the shared Traefik "edge" front door
                  └── docker compose -f docker-compose.yml -f docker-compose.release.yml \
                        -f docker-compose.tls.yml up -d --build
```

The `.env` lives **only on the VPS** (materialised from a GitHub secret) — never in git.

---

## What runs, and what's exposed

Ports are deliberately off the defaults auto-checkout-bot already uses on this box
(`5432` / `3000` / `8080`).

| Service | Port on VPS | Reachable from |
|---|---|---|
| **traefik** (HTTPS front door, shared `edge` project) | `0.0.0.0:80`, `0.0.0.0:443` | **public** — `https://kim.72-62-125-235.sslip.io` |
| **web** (nginx SPA + `/api` proxy) | `${WEB_BIND:-0.0.0.0}:8081` → :80 | **public** by default; set `WEB_BIND=127.0.0.1` once HTTPS is live |
| api | `127.0.0.1:3001` → :3000 | loopback only (proxied internally by the web nginx) |
| postgres | `${DB_BIND:-127.0.0.1}:5433` → :5432 | loopback only (API reaches it over the compose network) |

Only the web app is public. To reach the API or DB directly, tunnel in:

```bash
ssh -L 3001:localhost:3001 -L 5433:localhost:5433 root@72.62.125.235
```

---

## One-time setup

Docker is already installed on the VPS (the other stacks use it), so setup is just
GitHub secrets. The pipeline does everything else on its own — it rsyncs the source,
so `git` on the VPS isn't required.

### 1. Reuse (or add) the SSH deploy key

The VPS already authorises GitHub deploys for the other repos. Reuse the same key
pair, or mint a dedicated one on the VPS:

```bash
ssh-keygen -t ed25519 -C "kk-deploy" -f ~/.ssh/kk_deploy -N ""
cat ~/.ssh/kk_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/kk_deploy   # copy the PRIVATE key for the secret below
```

### 2. Add GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `VPS_HOST` | `72.62.125.235` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY_1` | full private key (incl. `-----BEGIN…` / `-----END…`) |
| `PROD_DOTENV` | the **entire** production `.env` (see below) |

### 3. Build the `PROD_DOTENV` value

Paste a complete `.env` — this is what the containers read on the VPS. Start from
[`.env.example`](.env.example) and set at least:

```dotenv
# Postgres — use a STRONG password (`openssl rand -base64 24`).
POSTGRES_USER=wedding
POSTGRES_PASSWORD=<strong-random>
POSTGRES_DB=wedding

# Everything else is optional. Leave KK_HOST blank to get HTTPS on a derived
# sslip.io hostname (kim.<dashed-ip>.sslip.io) with zero configuration.
```

---

## Deploy

Push to `main`:

```bash
git push origin main
```

Watch the run under the repo's **Actions** tab. `build_check` runs on every push
and PR; the deploy step runs only on a push to `main`.

### Load the guest list (once, after the first deploy)

The API creates the schema on boot (TypeORM `synchronize`), but the tables start
empty. Seed the 103 guests, then group them into invitations — run it inside the
API container (it carries the source + `ts-node`):

```bash
cd /root/kim-and-kayzee
C="docker compose -f docker-compose.yml -f docker-compose.release.yml -f docker-compose.tls.yml"
$C exec -w /repo/apps/api api pnpm seed
$C exec -w /repo/apps/api api pnpm seed:invitations
```

Both are idempotent — safe to re-run; they won't duplicate guests or overwrite
RSVP status / notes.

---

## HTTPS

**There is nothing to set up.** Push to `main` and the web app comes up on HTTPS
with a real Let's Encrypt certificate. No domain to buy, no DNS record to create.

Live at **https://kim.72-62-125-235.sslip.io**.

### How it works with no configuration

A certificate authority needs a hostname that publicly resolves to the server.
`sslip.io` answers any `<name>.<dashed-ip>.sslip.io` with that exact IP — so
`kim.72-62-125-235.sslip.io` already points here. The deploy reads the box's public
IP, builds that name, and hands it to Traefik, which gets a certificate over an
HTTP-01 challenge.

```
internet :443 ──► traefik  (project "edge", deploy/traefik/docker-compose.yml)
                     │      terminates TLS, Let's Encrypt, auto-renews
                     │      ── network: edge ──►
                  web nginx :80  (project "kim-and-kayzee")
                     ├── /            → the SPA
                     └── /api         → api:3000  (internal)
```

The `edge` Traefik is **shared** with auto-checkout-bot (same `name: edge` project,
identical compose file in both repos). The deploy brings it up only if it isn't
already running, so it never flaps the other stack's front door. kim-and-kayzee's
Traefik labels are prefixed `kk` (router/service/middleware), distinct from
auto-checkout-bot's `acb`, and its Host rule (`kim.…sslip.io`) is a different name
from the back office's (`72-62-125-235.sslip.io`), so both route off the one Traefik.

> **sslip.io caveat:** it is not on the Public Suffix List, so Let's Encrypt counts
> every certificate for it against one shared weekly limit. It works fine in practice,
> and plain `:8081` keeps serving if a renewal ever fails. Point `KK_HOST` at a domain
> you own to remove the dependency.

### Optional: use your own domain

1. Add an `A` record: `<your-host>` → `72.62.125.235`.
2. Set `KK_HOST=<your-host>` in the `PROD_DOTENV` secret.
3. Push. Everything else is identical.

### Optional: close the plaintext door

Once you trust HTTPS, set `WEB_BIND=127.0.0.1` in `PROD_DOTENV`. Port `8081` then
answers only over an SSH tunnel and the app is reachable from outside solely via
HTTPS. Leave it unset to keep the fallback.

---

## Operations

```bash
# On the VPS:
cd /root/kim-and-kayzee
C="docker compose -f docker-compose.yml -f docker-compose.release.yml -f docker-compose.tls.yml"

$C ps                       # status
$C logs -f api
$C logs -f web
$C up -d --force-recreate api   # restart one service after an env change
$C down                     # stop the stack (data survives in the pgdata volume)
```

### Rolling back Traefik

```bash
docker compose -f /root/kim-and-kayzee/deploy/traefik/docker-compose.yml down
```

`:8081` keeps serving throughout. Certificates survive in the `edge_letsencrypt`
volume. Note this front door is shared with auto-checkout-bot — taking it down
affects both; usually you leave it up.

---

## Troubleshooting

- **SSH permission denied** — the public key must be in the VPS `~/.ssh/authorized_keys`, and `VPS_SSH_KEY_1` must be the matching private key with no trailing whitespace.
- **`pnpm -r build` fails in CI** — reproduce locally with `pnpm install --frozen-lockfile && pnpm -r build`; the deploy won't run until it's green.
- **Port 8081 already in use** — another project on the VPS owns it. Change the web mapping in `docker-compose.yml` (e.g. `"8082:80"`).
- **Certificate won't issue** — HTTP-01 needs `:80` reachable from the internet. `ss -lntp | grep :80` should show Traefik. If auto-checkout-bot's Traefik is already holding `:80/:443`, kim-and-kayzee reuses it — check `docker logs edge-traefik-1 --tail 30` for ACME activity.
- **API can't reach the DB** — the API uses the discrete `DB_*` vars pointing at the `postgres` service; confirm `POSTGRES_PASSWORD` in `PROD_DOTENV` matches what the DB was first created with (a changed password won't take on an existing `pgdata` volume).
