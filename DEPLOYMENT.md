# Deploying Hillstar Hotel to Vercel

The project is fully configured for Vercel + Neon PostgreSQL. Follow these steps.

## 1. Prerequisites

- Code pushed to a GitHub/GitLab/Bitbucket repository.
- A [Neon](https://neon.tech) project (PostgreSQL).
- A [Vercel](https://vercel.com) account.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if desired):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string with `?sslmode=require&pgbouncer=true` appended. From Neon → Dashboard → Connection Details → copy the *pooled* string. |
| `DIRECT_URL` | Same credentials, host **without** `-pooler`. Used by `prisma db push` / migrations. |
| `AUTH_SECRET` | Strong random secret: `openssl rand -hex 32`. Signs admin session cookies. |
| `NEXT_PUBLIC_SITE_URL` | Your public site URL, e.g. `https://hillstarhotel.co.tz` or the Vercel domain. Used for SEO metadata, canonical URLs and the sitemap. |
| `CRON_SECRET` | Optional but recommended. Any random string. Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>` to the booking-expiry endpoint. |
| `ADMIN_PASSWORD` | Optional — only used by the seed script when creating the admin account. |

A template is provided in `.env.example`. **Never commit the real `.env`** — it is git-ignored.

> Notes:
> - Prisma needs `pgbouncer=true` when connecting through Neon's pooler (transaction-mode pooling does not support prepared statements).
> - Keep the Vercel function region close to your Neon region (default `iad1` is ideal for Neon `us-east-2`) — database latency dominates response times.

## 3. Database: schema + admin account (one-time)

From your machine, with `.env` containing the two Neon URLs:

```bash
bun install          # or npm install
bun run db:push      # creates all tables in Neon (uses DIRECT_URL)
bun run seed         # creates the admin user + editable sample content (uses DATABASE_URL)
```

Seed defaults: username `admin`, password `Hillstar2026!` — override with `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` before seeding, or run `bun run seed` with those env vars set. **Change this password before going live if you keep the default.**

To import data exported from an older SQLite database (if applicable):

```bash
bun run scripts/export-sqlite.ts   # on the old setup → db/export.json
bun run scripts/import-data.ts     # after db:push on Neon
```

## 4. Deploy

**Option A — Git integration (recommended):** import the repository in Vercel (Add New → Project). Vercel detects Next.js automatically. Build command and install are already correct:

- Install: `bun install` (detected from `bun.lock`) — `postinstall` runs `prisma generate`.
- Build: `prisma generate && next build`.

**Option B — CLI:**

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

## 5. Background jobs (booking expiry)

Pending booking requests expire after a configurable window (default 15 minutes, editable in Admin → Settings). Expiry is enforced in three redundant ways, so nothing depends on a long-running process:

1. Inline sweep before every availability search and admin view.
2. On process boot (long-running hosts only; skipped on Vercel).
3. **Vercel Cron** (`vercel.json`) calls `/api/admin/maintenance/expire` daily at 04:00 UTC with your `CRON_SECRET`.

On the Vercel **Hobby** plan cron schedules are capped to once per day; paths 1–2 keep expiry correct regardless. Upgrade to Pro if you want more frequent cron sweeps.

## 6. Admin image uploads

Uploaded images are stored **in the database** (`UploadedImage` table) and served from `/api/uploads/<id>` with immutable caching. This works on Vercel's read-only filesystem with zero extra services. Request-body limit: images up to 4MB.

## 7. Post-deploy checklist

- [ ] Site loads at the Vercel domain; homepage, rooms, restaurant, meetings, gallery, about, contact render.
- [ ] Booking search returns availability; a test request creates a reference (`HST-…`), shows the WhatsApp hand-off, and appears in Admin → Reservations.
- [ ] Admin login works at `/#/admin` (cookie is `Secure` in production — must be accessed over HTTPS).
- [ ] Admin → Settings: update hotel name, WhatsApp number, hero images, room content if needed.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final domain so SEO/canonical URLs are correct.
- [ ] Vercel Cron shows the `maintenance-expire` job (Project → Settings → Cron Jobs).
- [ ] Change the seeded admin password if you used the default.

## 8. Useful commands (local)

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server on port 3000 |
| `bun run lint` | ESLint |
| `bunx tsc --noEmit` | Type check (build fails on type errors) |
| `bun run db:push` | Push schema changes to the database |
| `bun run seed` | Idempotent seed (admin + sample content) |
| `bun run scripts/smoke-test.ts` | Full end-to-end API test against a running dev server |
| `bun run scripts/clean-test-data.ts` | Remove bookings/payments/inquiries/notifications |
