# MyGravelGuy — Agent & Operations Guide

Nationwide gravel / construction-materials delivery marketplace SPA (mygravelguy.com).

## What this is

A live React single-page app for a gravel and construction-materials delivery business. The frontend lives in this repo; all backend logic (database, auth, server-side functions) runs on Supabase. There is no server-side code in this repo other than the Supabase Edge Functions under `supabase/functions/`.

## Stack

- React 18 + TypeScript, built with Vite 5
- Tailwind CSS 3 + shadcn/ui (Radix primitives)
- TanStack React Query, React Router v6
- React Hook Form + Zod
- Mapbox GL (`mapbox-gl`)
- Backend: Supabase — Postgres + RLS, Auth, ~16 Edge Functions (Deno)
- Third-party (server-side, via Edge Functions): Stripe, Twilio, Resend, OpenAI, Slack webhook
- Path alias: `@/` → `./src/`

## Where it runs

- **CURRENT (hosted): Lovable.** The app is built and served by the Lovable platform. Lovable auto-commits changes to the git repo; there is no `.github/` CI in this repo.
- **TARGET (self-hosted): Hetzner VPS** at `5.161.88.134` (ssh alias `hampton-vps`). Deploy path `/opt/mygravelguy`. The container joins the existing external Docker network `hosthampton_hampton_net` (shared with the Host Hampton project) and runs `nginx:alpine` serving the built `dist/`. The shared host nginx (Host Hampton) terminates TLS and proxies `mygravelguy.com` / `www.mygravelguy.com` to the `mygravelguy` container — see `nginx/vps-nginx-addition.conf`.
- **Domain:** `mygravelguy.com` (used as the sitemap base URL).
- **Supabase** (backend) is the same in both cases: ref `losrkjvrcambvgijfism`.

## Run locally

```bash
npm install
npm run dev          # Vite dev server on http://localhost:8080 (host "::")
npm run build        # runs scripts/generate-sitemap.mjs, then vite build → dist/
npm run build:dev    # build in development mode
npm run preview      # preview the production build
npm run lint         # eslint .
npm run test         # vitest run
npm run test:watch   # vitest (watch)
npm run generate-sitemap   # regenerate public sitemap only
```

`npm run dev` does not require secrets beyond the `VITE_` vars in `.env` (already committed; anon key only).

## Deploy

- **Now (Lovable):** changes are published through the Lovable platform; Lovable auto-commits to the repo. No manual deploy step or GitHub Actions.
- **Target (VPS), manual Docker pattern:**

  ```bash
  ssh hampton-vps "cd /opt/mygravelguy && git pull origin main && docker compose build --no-cache && docker compose up -d"
  ```

  Local Docker check:

  ```bash
  docker compose up -d        # builds Dockerfile, nginx:alpine serves dist/, exposes :80 on hosthampton_hampton_net
  ```

  The container only `expose`s port 80 on the shared network — it is not published to the host directly; the host nginx proxies to it.

- **Edge Functions deploy separately** (not part of the Docker image): `supabase functions deploy <name>` via the Supabase CLI.

## Database (Supabase)

- **Project ref:** `losrkjvrcambvgijfism` — `https://losrkjvrcambvgijfism.supabase.co`
- **Migrations:** `supabase/migrations/*.sql` (timestamped). Config in `supabase/config.toml`.
- **Storage policies:** `supabase/storage-policies.sql`.
- **Key tables** (from migrations): `leads`, `supplier_quotes`, `market_materials`, `market_aliases`, `expenses`, `expense_categories`, `abandoned_cart_emails`.

**Edge Functions** (`supabase/functions/`):

```
chat                         get-messages                process-abandoned-carts
create-auth-hold             mark-messages-read          receive-sms-webhook
create-payment               notify-new-quote            send-email
create-quote-checkout        send-order-sms              send-quote-conversion-email
send-sms                     unsubscribe-cart-emails     verify-payment
voice-response
```

Functions with `verify_jwt = false` (public; per `config.toml`): `receive-sms-webhook`, `send-quote-conversion-email`, `verify-payment`, `create-auth-hold`, `process-abandoned-carts`, `unsubscribe-cart-emails`.

**Note:** Edge Function secrets are NOT in this repo. They are configured in the Supabase dashboard (Project Settings → Edge Functions / Secrets). See "Environment & secrets".

## Environment & secrets

Never commit or print secret values. Names only below.

**Client (`.env`, `VITE_` prefix — bundled into the SPA, safe/public):**

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase anon key)

**Server-side secrets (managed in the Supabase dashboard, used by Edge Functions — NOT in `.env`):**

- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `stripe` (the Stripe secret key is stored under the lowercase env name `stripe`)
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Resend (email): `RESEND_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Notifications: `SLACK_QUOTE_WEBHOOK_URL`, `QUOTE_ALERT_PHONES`
- Unsubscribe links: `UNSUBSCRIBE_SECRET`

## Cron / scheduled jobs

- **`process-abandoned-carts`** runs every 15 minutes (`*/15 * * * *`). It is NOT auto-created by a migration — `supabase/migrations/20260228130000_setup_abandoned_cart_cron.sql` is a no-op (`SELECT 1`) and documents two manual options:
  1. Supabase `pg_cron` + `pg_net` (enable both extensions in the dashboard first, then run the `cron.schedule(...)` block in the SQL Editor), or
  2. A VPS crontab line calling the function via `curl` with the service role key.
- It calls `https://losrkjvrcambvgijfism.supabase.co/functions/v1/process-abandoned-carts` with a service-role bearer token.

## Day-to-day cheat sheet

```bash
npm run dev                                   # local dev → http://localhost:8080
npm run build                                 # sitemap + production build → dist/
npm run lint                                  # eslint
npm run test                                  # vitest run
docker compose up -d                          # build + run nginx:alpine container (port 80, shared net)
ssh hampton-vps                               # connect to Hetzner VPS (root@5.161.88.134)
ssh hampton-vps "cd /opt/mygravelguy && git pull origin main && docker compose build --no-cache && docker compose up -d"   # VPS deploy
supabase functions deploy <name>              # deploy an edge function
```

## Key files

- `CLAUDE.md` — Claude Code project guide / quick reference
- `KNOWLEDGE_BASE.md` — detailed project documentation (read for deep context)
- `README.md`, `SESSION_LOG.md`, `MARKETING_AGENT_PLAN.md`
- `Dockerfile` — two-stage build (node:20-alpine → nginx:alpine serving `dist/`)
- `docker-compose.yml` — service `mygravelguy`, external network `hosthampton_hampton_net`, `expose: 80`
- `nginx/default.conf` — in-container SPA routing, gzip, cache rules (index.html no-cache)
- `nginx/vps-nginx-addition.conf` — host-nginx blocks to add for TLS + proxy on the VPS
- `vite.config.ts` — port 8080, `@` alias, `lovable-tagger` in dev
- `scripts/generate-sitemap.mjs` — runs on every build; fetches dynamic routes from Supabase (anon)
- `supabase/` — `config.toml`, `migrations/`, `functions/`, `storage-policies.sql`
- `.env` — client `VITE_` vars only

## Gotchas

- **Dual host during migration.** The app currently lives on Lovable but is moving to the VPS. Confirm which target you are deploying to. The same Supabase backend serves both.
- **Lovable auto-commits.** There is no `.github/` CI. Pulling on the VPS may include Lovable-generated commits — coordinate before force-pushing.
- **Secrets are split.** Only `VITE_` (public) vars live in `.env`. All server secrets (Stripe, Twilio, Resend, OpenAI, Slack, service role) live in the Supabase dashboard and are invisible to local builds. The Stripe secret env name is the lowercase `stripe`, not `STRIPE_SECRET_KEY`.
- **Sitemap runs on build.** `npm run build` runs `generate-sitemap.mjs` first; it makes live Supabase queries (anon key), so a build needs network access to `losrkjvrcambvgijfism.supabase.co`.
- **Cron is manual.** `process-abandoned-carts` is not scheduled automatically — set it up via Supabase `pg_cron` or a VPS crontab (see Cron section).
- **No host port published.** `docker-compose.yml` only `expose`s 80 on `hosthampton_hampton_net`; the shared host nginx must be configured (`nginx/vps-nginx-addition.conf`) for the site to be reachable.
- **Edge Functions deploy separately** from the Docker image — they are not bundled in `dist/`.
