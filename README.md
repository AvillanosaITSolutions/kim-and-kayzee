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

Push-to-deploy across three homes. Everything that can be pre-filled **is**
committed already, so the only value you ever type by hand is the Supabase
connection string.

| Piece | Host | Deploys when… |
| --- | --- | --- |
| Database (Postgres) | **Supabase** | you create the project once |
| API (NestJS) | **Render** (Docker, free) | every push to `main` (after 1-time connect) |
| Web (Vite/React) | **GitHub Pages** | every push to `main` |

> Supabase hosts only the **database** — it can't run the NestJS server, so the
> API lives on Render and connects to Supabase over SSL.

### One-time setup (≈5 minutes, then just push)

**A. Supabase — create the database**
1. New project at [supabase.com](https://supabase.com) (remember the DB password).
2. Copy **Project Settings → Database → Connection string → URI** and swap in
   your password. This string is your `DATABASE_URL`.

   > ⚠️ **Use the pooled connection** (host `…pooler.supabase.com`, port
   > `6543`), *not* the direct one. Supabase's direct connection is IPv6-only,
   > and Render's free tier is IPv4-only — the direct string fails with a
   > connection error. The pooler is IPv4-compatible.

**B. Render — host the API** (auto-deploys on every push once connected)
1. [dashboard.render.com](https://dashboard.render.com) → **New + → Blueprint**
   → pick `AvillanosaITSolutions/kim-and-kayzee` → **Apply**. Render reads
   [`render.yaml`](render.yaml) and provisions everything.
2. When prompted, paste `DATABASE_URL`. (`CORS_ORIGIN`, `NODE_ENV`, the Docker
   build, the health check, and auto-deploy are already set in the blueprint.)
3. Tables are created automatically on first boot (`synchronize: true`).

**C. GitHub Pages — host the web app**
1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   That's it — [`deploy-web.yml`](.github/workflows/deploy-web.yml) builds and
   publishes on every push. The API origin is baked in from
   [`apps/web/.env.production`](apps/web/.env.production); no variables to set.

Live at **https://avillanosaitsolutions.github.io/kim-and-kayzee/**.

**D. Load the guest list (once)** — from your machine, point the seed at
Supabase by putting the same `DATABASE_URL` in `apps/api/.env`, then:

```bash
pnpm seed && pnpm seed:invitations
```

### After that

Just `git push`. The web redeploys via Actions and the API redeploys via
Render automatically. Nothing else to touch.

### Where each value lives

| Value | Set in | Secret? |
| --- | --- | --- |
| `DATABASE_URL` | Render dashboard + your local `apps/api/.env` (for seeding) | **yes — you type it** |
| `CORS_ORIGIN` | [`render.yaml`](render.yaml) → `https://avillanosaitsolutions.github.io` | pre-filled |
| `VITE_API_URL` | [`apps/web/.env.production`](apps/web/.env.production) → `https://kim-and-kayzee-api.onrender.com` | pre-filled |
| `base` path | [`vite.config.ts`](apps/web/vite.config.ts) → `/kim-and-kayzee/` | pre-filled |
| `PORT` | injected by Render | automatic |

Deep links (e.g. `/i/<slug>`) work despite Pages having no server routing: an
SPA fallback in [`404.html`](apps/web/public/404.html) encodes the path and
`index.html` restores it before React Router boots.

> **Rename the repo or Render service?** Keep these three in sync: the `name` in
> [`render.yaml`](render.yaml), `VITE_API_URL` in
> [`apps/web/.env.production`](apps/web/.env.production), and the `base` /
> `CORS_ORIGIN` values shown above.

## Notes for developers

- The API uses TypeORM with `synchronize: true` — fine for this single-table
  app. For a larger schema, switch to migrations.
- `apps/api/.env` is created for local dev (see `.env.example`). CORS allows
  the Vite origin; in dev the web app also proxies `/api` to the API so there's
  a single origin.
- The seed is idempotent: it upserts by `id`, so rerunning it won't create
  duplicates and won't overwrite RSVP status or notes on existing rows.
