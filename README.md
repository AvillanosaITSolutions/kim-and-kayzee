# 💍 Kim & Kayzee — Wedding Guest Dashboard

A full-stack app for managing the wedding guest masterlist: browse, search,
filter, edit, and track RSVPs & invitations for all 103 guests.

- **Web** — Vite + React + TypeScript (`apps/web`)
- **API** — NestJS + TypeScript + TypeORM (`apps/api`)
- **Database** — PostgreSQL (via Docker)
- **Monorepo** — pnpm workspaces

---

## Prerequisites

- Node.js 20+ (tested on 22)
- pnpm 11+
- Docker (for Postgres)

## Quick start

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Start Postgres (host port 5433 -> container 5432)
pnpm db:up

# 3. Seed the 103 guests, then group them into invitations
pnpm seed
pnpm seed:invitations

# 4. Run API + web together
pnpm dev
```

Then open **http://localhost:5173**.

> Seed order matters: run `pnpm seed` (guests) before `pnpm seed:invitations`
> (which groups those guests). Both are idempotent and safe to re-run.

| Service  | URL                                      |
| -------- | ---------------------------------------- |
| Web app  | http://localhost:5173                    |
| API      | http://localhost:3001/api                |
| Postgres | localhost:5433 (db/user/pass: `wedding`) |

> **Ports:** this machine already runs another stack on `5432`/`3000`, so this
> project uses `5433` (Postgres) and `3001` (API). Change them in
> `apps/api/.env`, `docker-compose.yml`, and `apps/web/vite.config.ts` if needed.

## Useful scripts

Run from the repo root:

| Command        | What it does                                        |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Run API and web in parallel (watch mode)            |
| `pnpm dev:api` | Run only the NestJS API                             |
| `pnpm dev:web` | Run only the Vite dev server                        |
| `pnpm seed`    | Upsert the 103 guests from the masterlist (safe to rerun) |
| `pnpm seed:invitations` | Rebuild invitation groups from the structure (safe to rerun) |
| `pnpm build`   | Type-check and build both apps                      |
| `pnpm db:up`   | Start the Postgres container                        |
| `pnpm db:down` | Stop the Postgres container                         |

## Features

- **Dashboard stats** — totals, groom/bride split, RSVP breakdown, invites
  handed out, and a live guest-category count.
- **Search & filter** — free-text search plus filters for side, category,
  RSVP status, and invite status.
- **Inline RSVP** — change a guest's RSVP (Pending / Attending / Declined)
  straight from the table with an optimistic update.
- **Add / edit / delete** — full CRUD; new guests get the next `G-####` id
  automatically.
- **Notes** — free-text notes per guest for dietary needs, plus-ones, etc.
- **Invitations (groups)** — group one or more guests onto a single invitation
  (e.g. "Mama and Papa"). Manage them on the **Invitations** tab: search, create,
  edit members, delete, and copy each invite's link. A guest belongs to at most
  one invitation.
- **Standalone e-invite page** — every invitation has its own public page at
  `/i/:slug` with the couple, event details, the addressees, and a **group RSVP**
  (each named guest can accept/decline) that updates the same RSVP the dashboard
  tracks.

### The e-invite page

- Event details live in [`apps/web/src/wedding.ts`](apps/web/src/wedding.ts).
  The date (January 23, 2027) and venue (Ligaya Villas, Puerto Princesa,
  Palawan, with map + Facebook links) are set — **only the ceremony time is
  left blank** (`ceremonyTime`); until you fill it in the page shows
  "Time to be announced".
- Attire guidance is built in: shades of green, with white/cream/ivory reserved
  for the bride. Edit the `attire` block in the same file to tweak.
- The whole app uses a sage/mint green palette and is mobile-friendly.
- Each invitation's `slug` is randomised so links aren't guessable/enumerable.
- To preview on a phone or share a temporary link, expose the Vite dev server
  with a tunnel (e.g. ngrok → `http://localhost:5173`). `*.ngrok-free.dev`,
  `*.ngrok-free.app`, `*.ngrok.io`, and `*.ngrok.app` are already allow-listed
  in [`vite.config.ts`](apps/web/vite.config.ts); add your host there if you use
  a different tunnel provider.

## API reference

Base URL: `http://localhost:3001/api`

| Method   | Path            | Description                                                                                    |
| -------- | --------------- | --------------------------------------------------------------------------------------------- |
| `GET`    | `/guests`       | List guests. Query: `search`, `invitedBy`, `guestType`, `priority`, `rsvpStatus`, `hasInvite` |
| `GET`    | `/guests/stats` | Aggregate counts for the dashboard                                                            |
| `GET`    | `/guests/:id`   | Fetch one guest                                                                               |
| `POST`   | `/guests`       | Create a guest (id auto-assigned if omitted)                                                  |
| `PATCH`  | `/guests/:id`   | Update any guest fields                                                                        |
| `DELETE` | `/guests/:id`   | Remove a guest                                                                                 |
| `GET`    | `/invitations`  | List invitations with their members                                                           |
| `GET`    | `/invitations/:id` | One invitation (admin id)                                                                   |
| `GET`    | `/invitations/slug/:slug` | Public lookup for the e-invite page                                                  |
| `POST`   | `/invitations/slug/:slug/rsvp` | Group RSVP: `{ responses: [{ guestId, rsvpStatus }] }`                          |
| `POST`   | `/invitations`  | Create an invitation (`{ addressLabel, message, memberIds }`)                                  |
| `PATCH`  | `/invitations/:id` | Update label/message/members                                                                |
| `POST`   | `/invitations/:id/members` | Replace the member set (`{ memberIds }`)                                             |
| `DELETE` | `/invitations/:id` | Delete an invitation (its guests become unassigned)                                         |

## Data model

Each guest mirrors the original masterlist columns, plus RSVP tracking:

| Field                    | Notes                                          |
| ------------------------ | ---------------------------------------------- |
| `id`                     | `G-0001` style primary key                     |
| `includedBy`             | Who the guest is listed under (optional)       |
| `nameOnInvitation`       | How the name is printed on the invite          |
| `firstName` / `lastName` | —                                              |
| `guestType`              | Category with emoji, e.g. `🥇Family Member`     |
| `priority`               | `Important Person` / `Regular` / `Unsure` / `` |
| `invitedBy`              | `Groom` or `Bride`                             |
| `hasInvite`              | Whether the physical invite is ready           |
| `rsvpStatus`             | `Pending` / `Attending` / `Declined`           |
| `notes`                  | Free text                                      |
| `invitationId`           | The invitation this guest is grouped under, or null |

**Invitation** — a group of guests addressed together:

| Field          | Notes                                            |
| -------------- | ------------------------------------------------ |
| `id`           | `INV-0001` style primary key                     |
| `slug`         | Randomised, unique key for the public `/i/:slug` page |
| `addressLabel` | How it's addressed, e.g. "Kuya Caloy and Ate Joelle" |
| `message`      | Optional personal note shown on the invite       |
| `members`      | The guests on this invitation (one-to-many)      |

Members are matched from the invitation structure **by name** (falling back to
id) because the source ids were renumbered after the original masterlist. The
seed de-dupes globally (a guest lands on the first invitation that lists them),
skips empty groups, and prints a reconciliation report.

## Project layout

```
kim-and-kayzee/
├── apps/
│   ├── api/                 # NestJS API
│   │   └── src/
│   │       ├── guests/      # entity, service, controller, DTOs
│   │       ├── invitations/ # invitation entity, service, controller, DTOs
│   │       ├── config/      # shared TypeORM data-source options
│   │       └── seed/        # masterlist + invitation structure + seed scripts
│   └── web/                 # Vite + React frontend (react-router)
│       └── src/
│           ├── components/  # Layout, StatsBar, Toolbar, tables, modals
│           ├── pages/       # GuestsPage, InvitationsPage, InvitePage
│           ├── wedding.ts   # ✏️ event details for the e-invite
│           ├── api.ts       # typed fetch client
│           └── App.tsx      # routes
├── docker-compose.yml       # Postgres 16
└── pnpm-workspace.yaml
```

## Deployment

Push-to-deploy to a **VPS** (`72.62.125.235`, shared with the auto-checkout-bot
stack). One `git push` builds three Docker images on the box — Postgres, the API,
and the nginx-served web app — and puts the site behind an automatic HTTPS front
door. The full guide is in **[DEPLOY.md](DEPLOY.md)**; the short version:

| Piece | Where | Deploys when… |
| --- | --- | --- |
| Database (Postgres 16) | **VPS**, Docker (`pgdata` volume) | every push to `main` |
| API (NestJS) | **VPS**, Docker | every push to `main` |
| Web (Vite/React) | **VPS**, nginx (same-origin `/api` proxy) | every push to `main` |

GitHub Actions ([`deploy.yml`](.github/workflows/deploy.yml)) runs a build check,
then SSHes in, rsyncs the source, and runs `docker compose up -d --build`. The
whole production `.env` lives **only on the VPS**, materialised from the
`PROD_DOTENV` GitHub secret — nothing sensitive is committed.

### One-time setup

Add four repo secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value |
| --- | --- |
| `VPS_HOST` | `72.62.125.235` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY_1` | the private deploy key |
| `PROD_DOTENV` | the whole production `.env` (template: [`.env.example`](.env.example)) — set at least `POSTGRES_PASSWORD` |

Then `git push origin main`. After the first deploy, load the guest list once
(inside the API container):

```bash
cd /root/kim-and-kayzee
C="docker compose -f docker-compose.yml -f docker-compose.release.yml -f docker-compose.tls.yml"
$C exec -w /repo/apps/api api pnpm seed
$C exec -w /repo/apps/api api pnpm seed:invitations
```

### HTTPS

Zero-config: the deploy derives a hostname from the VPS's public IP via sslip.io
and Traefik issues a Let's Encrypt certificate. Live at
**https://kim.72-62-125-235.sslip.io** (or set `KK_HOST` to a domain you own).
The Traefik front door is shared with auto-checkout-bot on the same box.

### Ports on the VPS

Chosen to avoid the auto-checkout-bot stack (which uses `5432` / `3000` / `8080`):

| Service | VPS port | Notes |
| --- | --- | --- |
| web (nginx) | `8081` (public) + `443` via Traefik | serves the SPA, proxies `/api` |
| api | `127.0.0.1:3001` | loopback only, proxied internally |
| postgres | `127.0.0.1:5433` | loopback only, reached over the compose network |

### After that

Just `git push`. Every push to `main` rebuilds and redeploys the whole stack.
Nothing else to touch.

## Notes for developers

- The API uses TypeORM with `synchronize: true` — fine for this single-table
  app. For a larger schema, switch to migrations.
- `apps/api/.env` is created for local dev (see `.env.example`). CORS allows
  the Vite origin; in dev the web app also proxies `/api` to the API so there's
  a single origin.
- The seed is idempotent: it upserts by `id`, so rerunning it won't create
  duplicates and won't overwrite RSVP status or notes on existing rows.
