# Staging (`staging.mygravelguy.com`) — plan + prepared, inactive infrastructure

Agent: ST-STAGING, 2026-09-28, `feature/metro-ui`. Owner ask: "Maybe we set up a staging
subdomain to test?" — so the metro Stripe checkout (TEST mode), prerender build, and redirects on
this branch can be exercised on a real domain before merging to `main` (only `main` auto-deploys —
`.github/workflows/deploy.yml`, triggered on every push to `main`).

**Status: nothing here is live.** No DNS record exists for `staging.mygravelguy.com` yet, no
container is running, and `.github/workflows/deploy-staging.yml` only runs when an owner manually
triggers it (`workflow_dispatch`, no `push:` trigger). This document + the files it describes are
everything needed to stand staging up in one sitting once the owner is ready — see "Owner runbook"
below.

## VPS architecture (read-only recon, 2026-09-28)

The Hetzner VPS (`ssh hampton-vps`, root@5.161.88.134) is **shared** with Host Hampton (a separate
production project) and about a dozen other unrelated projects. Findings, all read-only:

- **4 vCPUs**, **7.6GB RAM** total. `free -h` at recon time: **941Mi truly free**, 3.0Gi in
  buffers/cache (reclaimable under pressure → ~3.6Gi "available"), and **swap already in use**
  (1.3Gi of 2.0Gi). Disk is comfortable: 75G total, 26G used, **47G available** (36%).
  `docker system df` shows 15.89GB of images (95% reclaimable — old/dangling layers) and 4.7GB of
  build cache (also reclaimable) — headroom exists on disk, RAM is the tight resource.
- **14 separate `docker compose` projects** already running (`docker compose ls`): Host Hampton,
  MyGravelGuy (production), EasternLM, Maningo Method, Poolman, Nightreel, LarkinTech, QuestTrack,
  Hamptons Tree Experts, Eastern Rentals, Eastern Truck Repair, Happy Home demo, Benchworks
  Outbound (incl. n8n), and an "os-adam" agent stack — roughly 30 containers total.
- **Reverse proxy**: a single shared `hampton_nginx` container (`nginx:alpine`), part of the
  **`hosthampton`** compose project (`/opt/hosthampton/docker-compose.yml` +
  `docker-compose.override.yml`, the latter NOT in git — "server-only overrides ... multi-domain
  SSL mounts", per its own header comment). It's the only container binding host ports `80`/`443`.
  Its actual routing config, `nginx.conf`, is a bind-mounted file living at
  `/opt/hosthampton/nginx/nginx.conf` — **outside this repo**, hand-maintained on the VPS, one
  `server {}` block per domain.
- **How MyGravelGuy production is wired in**: `/opt/mygravelguy/docker-compose.yml` (this repo's
  own `docker-compose.yml`) builds a container named `mygravelguy`, `expose`s port 80 only (no
  host port binding — never reachable except through the proxy), and joins an **external** network
  named `hosthampton_hampton_net` (Compose's `<project>_<network-key>` naming — the `hosthampton`
  project's `hampton_net` network, defined `external: true` on the mygravelguy side so both compose
  projects share one Docker bridge network without either owning the other). `nginx.conf`'s
  `mygravelguy.com`/`www.mygravelguy.com` server block does
  `proxy_pass http://mygravelguy:80` — plain container-name DNS resolution via Docker's embedded
  resolver (`resolver 127.0.0.11`), since both containers share that network.
- **TLS**: every vhost in `nginx.conf` uses the same pattern — Cloudflare **Origin CA** certs
  (`/etc/ssl/<domain>/origin.{pem,key}`), one directory per domain, terminated directly by this
  nginx (`ssl_certificate`/`ssl_certificate_key`), fronted by Cloudflare in **Full (strict)** mode.
  This is **not** Let's Encrypt/certbot for any currently-active vhost — `certbot` isn't even
  installed as a CLI binary on the host (`certbot: command not found`). One stray leftover exists:
  `/etc/letsencrypt/live/staging.easternlm.com/` (an apparently abandoned prior staging attempt for
  a *different* project) — it has DNS (Cloudflare-proxied, resolves fine) but **no server block**
  in the current `nginx.conf`, so it's dead/unused today. Not a pattern to copy.
- **The existing `mygravelguy` origin cert already covers a staging subdomain** —
  `openssl x509 -in /etc/ssl/mygravelguy/origin.pem -noout -text` shows
  `Subject Alternative Name: DNS:*.mygravelguy.com, DNS:mygravelguy.com`. **No new certificate is
  needed** for `staging.mygravelguy.com`; the same origin cert file works as-is.
- **DNS**: `mygravelguy.com`/`www.mygravelguy.com` resolve to Cloudflare anycast IPs
  (`104.21.x.x`/`172.67.x.x` — orange-cloud **proxied**, confirmed via `nslookup`).
  `staging.mygravelguy.com` currently returns **NXDOMAIN** — it doesn't exist yet. Owner action
  required (see runbook).

**Conclusion**: the cheapest, lowest-risk staging setup reuses the existing shared `hampton_nginx`
proxy and the existing wildcard cert — no new reverse proxy, no new TLS cert, no Cloudflare
Origin-CA re-issue. The only new pieces are (1) a DNS record, (2) one new `server {}` block in the
VPS's hand-maintained `nginx.conf` (outside this repo — `nginx/staging.conf` here is the snippet to
paste in), and (3) a second, small container joined to the same Docker network.

### Why build the image in CI, not on the VPS

Production's own deploy (`deploy.yml`) already runs `docker compose up -d --build` **on this VPS**
— i.e. `npm ci` + `npx playwright install --with-deps chromium` + `vite build` +
`prerender.mjs` (a full headless-Chromium prerender pass over every route) all happen on this same
4-vCPU, <1GB-free host today, for production. Given the RAM headroom above (and that this VPS is
shared with a stranger's production traffic — Host Hampton), running a **second**,
independent instance of that same heavy build for staging is a real risk of starving other
containers (OOM-killed containers, swapping, or the build itself getting killed under memory
pressure). **Recommendation, and what `.github/workflows/deploy-staging.yml` implements**: build
the image in GitHub Actions (a disposable, dedicated runner with plenty of RAM), push it to GHCR
(`ghcr.io/afintech510/mygravelguy:staging`), and have the VPS only ever `docker compose pull` +
`up -d` for staging — zero build load added to the shared host. The alternative (building
`docker-compose.staging.yml` with a local `build:` on the VPS, on a schedule or with `mem_limit` /
off-hours timing) was considered and rejected as strictly worse: it still risks contending for RAM
during the build window even if bounded, whereas CI-build has zero marginal VPS resource cost.

## Architecture summary

```
Cloudflare (proxied, Full-strict)
        │
        ▼
Hetzner VPS (shared)
 hampton_nginx (nginx:alpine, ports 80/443)
   • existing: mygravelguy.com/www → mygravelguy:80         (production, /opt/mygravelguy)
   • NEW:      staging.mygravelguy.com → mygravelguy_staging:80  (this doc)
        │                                        │
        │ hosthampton_hampton_net (shared Docker bridge network)
        ▼                                        ▼
  mygravelguy (prod container)         mygravelguy_staging (NEW, separate compose project
  /opt/mygravelguy                     "mygravelguy-staging", dir /opt/mygravelguy-staging,
  built ON the VPS by deploy.yml       image PULLED from GHCR — built in CI, not on the VPS)
        │                                        │
        └──────────────────┬─────────────────────┘
                            ▼
              ONE Supabase project (production: losrkjvrcambvgijfism)
              — same DB, same Auth, same Edge Functions for both.
```

Both containers talk to the **same, single Supabase project** — there is no staging Supabase
project. Staging's frontend calls the same edge functions as production; the Stripe **live/test**
split happens *inside* the metro checkout edge functions based on request Origin, not by pointing
at different infrastructure (see "Stripe TEST mode" below).

## DNS (owner action)

Add, in Cloudflare (same zone as `mygravelguy.com`):

| Type | Name | Value | Proxy status |
|---|---|---|---|
| A | `staging` | `5.161.88.134` (the VPS's public IP — same as the apex/www records point at) | **Proxied** (orange cloud) |

Proxied (not DNS-only) so Cloudflare's edge TLS + the existing Full-strict origin-cert setup keeps
working identically to every other vhost on this VPS, and so Cloudflare's own bot-management /
caching sits in front of staging the same as production. A CNAME to `mygravelguy.com` instead of a
literal A record also works (Cloudflare flattens proxied CNAMEs at the edge either way) — either is
fine; the table above is simplest to reason about.

## TLS

No action needed — reuses `/etc/ssl/mygravelguy/origin.pem` / `origin.key`, already valid for
`*.mygravelguy.com` (see recon above). `nginx/staging.conf` references this exact path.

## Basic-auth protection (keep staging away from customers/Google)

`nginx/staging.conf`'s `server` block adds:

- **HTTP basic auth** (`auth_basic` + `auth_basic_user_file /etc/nginx/staging.htpasswd`) — the
  password file is created directly on the VPS (`htpasswd`, see runbook), never committed to this
  repo. This is the actual gate: nobody reaches the app at all without the shared
  username/password.
- **`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`** on every response (`add_header ...
  always;`, so it's sent even on the 401 basic-auth challenge itself) — belt-and-suspenders in
  case the basic-auth prompt is ever bypassed or misconfigured.
- **A `location = /robots.txt` override** that returns a hardcoded `Disallow: /` for every
  user-agent, instead of the app's own committed `public/robots.txt` (which is deliberately
  *permissive* — see that file's own header comment — because it's written for the production
  domain). Same belt-and-suspenders rationale.
- The client also renders a small fixed **"STAGING — Stripe test mode"** banner
  (`src/metro/components/layout/MetroLayout.tsx`) when the build was made with
  `VITE_STAGING=true` — a visual reminder for whoever's testing, not a security control.

None of the above is a substitute for the basic-auth gate — it's the only thing that actually
blocks access; the rest just reduces blast radius if it's ever misconfigured or momentarily down.

## Compose project / directory / ports

- **Directory**: `/opt/mygravelguy-staging` on the VPS (separate from `/opt/mygravelguy`).
- **Compose project name**: `mygravelguy-staging` (set via `name:` in
  `docker-compose.staging.yml`) — keeps every `docker compose` command run from that directory
  scoped to its own containers/network, never touching production's, even though both are on the
  same host.
- **Container name**: `mygravelguy_staging`.
- **Ports**: `expose: ["80"]` only — no host port binding, exactly like production. Reached
  exclusively through `hampton_nginx`'s new `staging.mygravelguy.com` server block.
- **Network**: joins the same external `hosthampton_hampton_net` network as production, so the
  shared proxy can reach it by container name.
- **Resource limits**: `mem_limit: 256m`, `memswap_limit: 512m`, `cpus: 0.5` in
  `docker-compose.staging.yml` — these are the plain (non-swarm) Compose resource keys, honored
  directly by `docker compose up` with no orchestration needed (unlike `deploy.resources.limits`,
  which historically required swarm mode on older Compose). Bounds the *running* container; the
  image is pulled prebuilt, so there's no build-time resource question on the VPS at all (see "Why
  build the image in CI" above).
- **Restart policy**: none set (Compose default: don't auto-restart). Staging is meant to be
  brought up for a testing window and torn down (see "Teardown"), not run indefinitely — flip to
  `restart: unless-stopped` in `docker-compose.staging.yml` if the owner wants it to survive a VPS
  reboot during an active testing window.

## Build args

Baked in at image-build time (CI, `.github/workflows/deploy-staging.yml`'s `build-args:` — Vite
inlines `import.meta.env.VITE_*` at build time, so these can't be changed by just restarting the
container; a new image build is required to change any of them):

| Build arg | Staging value | Purpose |
|---|---|---|
| `VITE_METRO_CHECKOUT_ENABLED` | `true` | Existing flag (`src/metro/services/metroCheckoutService.ts`) — without it, `isMetroCheckoutEnabled` is false regardless of `priceBookConfirmed`, so metro checkout wouldn't even be reachable to test. |
| `VITE_STAGING` | `true` | Drives the "STAGING — Stripe test mode" banner (`MetroLayout.tsx`). |
| `VITE_VERIFY_PAYMENT_FUNCTION` | `verify-payment-v2` | Selects the v2 edge function name for the live (non-metro) checkout path — another agent is building `verify-payment-v2`/`create-auth-hold-v2` selected by these two env vars. **Confirm these function names are actually deployed before first standing up staging** — if that work landed under different names, update this table and the workflow's `build-args:`. |
| `VITE_CREATE_AUTH_HOLD_FUNCTION` | `create-auth-hold-v2` | Same as above, for the auth-hold step. |

Production's build (`docker-compose.yml`, via `deploy.yml`) passes **none** of these build args —
see `Dockerfile`'s comment above the `ARG` lines for exactly why that keeps production's build
behavior unchanged (every one of these vars is either already-`undefined`-safe or literally unread
by any current code path when unset).

## Owner runbook

**One-time setup:**

1. **DNS**: add the `staging` A/CNAME record in Cloudflare (see "DNS" above). Wait for it to
   resolve (`nslookup staging.mygravelguy.com` — should return Cloudflare's anycast IPs, same
   pattern as `mygravelguy.com`).
2. **VPS directory**: `ssh hampton-vps 'mkdir -p /opt/mygravelguy-staging'`.
3. **Basic-auth password file** (on the VPS, not in git):
   `ssh hampton-vps 'sudo htpasswd -c /etc/nginx/staging.htpasswd <username>'` (you'll be prompted
   for a password; drop `-c` to add a second user without overwriting the first). Share the
   username/password with whoever needs to test.
4. **Reverse-proxy config**: SSH in, open `/opt/hosthampton/nginx/nginx.conf`, and paste in the two
   `server {}` blocks from this repo's `nginx/staging.conf` (anywhere at the top `http {}` level —
   e.g. right before the existing `mygravelguy.com` block). Validate + apply:
   ```
   ssh hampton-vps
   docker compose -f /opt/hosthampton/docker-compose.yml exec nginx nginx -t
   docker compose -f /opt/hosthampton/docker-compose.yml restart nginx
   ```
   `restart` briefly interrupts **every** site this shared proxy fronts (production
   `mygravelguy.com` included) — do this in a low-traffic window. If the nginx image/version
   supports `nginx -s reload` via `docker compose exec`, prefer that (no interruption).
5. **GHCR image visibility**: after the first `deploy-staging.yml` run pushes
   `ghcr.io/afintech510/mygravelguy:staging`, either (a) make the GHCR package **public**
   (Settings on the package's GitHub page) so the VPS can `docker compose pull` with no
   credentials — simplest, and this image contains nothing secret (same public anon Supabase key
   every browser already gets, same as the production image) — or (b) create a GitHub PAT with
   `read:packages` scope and store it as the `GHCR_READ_PAT` repo secret (used by the deploy
   workflow's `docker login` step on the VPS).
6. **Stripe TEST mode secrets** (Supabase project `losrkjvrcambvgijfism` — same project used by
   production, since there's only one; see "Shared Supabase" risk below):
   - `STRIPE_TEST_SECRET_KEY` — a Stripe **test-mode** secret key (`sk_test_...`) from the Stripe
     dashboard, **test mode** toggle on.
   - `STAGING_ORIGINS` — `https://staging.mygravelguy.com` (comma-separated if more than one
     staging origin is ever needed).
   - `STRIPE_METRO_WEBHOOK_SECRET_TEST` — see "Stripe TEST mode webhook" below.
   - Set via `supabase secrets set STRIPE_TEST_SECRET_KEY=sk_test_... STAGING_ORIGINS=https://staging.mygravelguy.com`
     (and the webhook secret once step 7 below has it) or the Supabase dashboard.
7. **Stripe TEST-mode webhook** — Stripe dashboard, switch to **Test mode**, Developers → Webhooks
   → Add endpoint → `https://losrkjvrcambvgijfism.supabase.co/functions/v1/metro-stripe-webhook`
   (**same URL** as the live webhook — one endpoint, two signing secrets), events
   `checkout.session.completed` + `checkout.session.async_payment_succeeded`. Copy the endpoint's
   signing secret into `STRIPE_METRO_WEBHOOK_SECRET_TEST` (step 6).
8. **GitHub Actions secrets** (repo Settings → Secrets and variables → Actions) — separate names
   from `deploy.yml`'s `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`/`VPS_PORT`, even though it's the same
   VPS (see `deploy-staging.yml`'s header comment for why):
   - `STAGING_VPS_HOST`, `STAGING_VPS_USER`, `STAGING_VPS_SSH_KEY`, `STAGING_VPS_PORT` — SSH access
     to the same VPS (can reuse the same key as `deploy.yml`'s, or use a narrower one scoped to
     `/opt/mygravelguy-staging` if you want tighter isolation).
   - `GHCR_READ_PAT` — only needed if you chose option (b) in step 5 above.
   - `STAGING_BASIC_AUTH` — `username:password` matching step 3, used only by the workflow's own
     post-deploy `curl` health check (so it doesn't fail every run on the 401 the basic-auth gate
     itself is supposed to return without it).
9. **Deploy**: GitHub → Actions → "Deploy Staging" → Run workflow → pick the `feature/metro-ui`
   branch → Run. Watch the two jobs (`build-and-push`, `deploy`) succeed. Then visit
   `https://staging.mygravelguy.com`, enter the basic-auth credentials, and confirm the
   "STAGING — Stripe test mode" banner shows on a metro page.

**Subsequent deploys**: just re-run the "Deploy Staging" workflow (step 9) — steps 1-8 are
one-time. Every run rebuilds from whatever branch you select in the Actions UI, so re-running after
pushing new commits to `feature/metro-ui` picks them up.

## Teardown

Staging isn't meant to run indefinitely. To tear down without losing the setup work:
```
ssh hampton-vps
cd /opt/mygravelguy-staging && docker compose down
```
This stops+removes the container but leaves the compose project directory, the nginx `server{}`
blocks, the DNS record, and the Stripe TEST secrets in place — re-running the "Deploy Staging"
workflow brings it back with no further setup. For a full teardown (reclaim the DNS name / nginx
config too), additionally remove the `staging.mygravelguy.com` DNS record in Cloudflare and delete
the two `server{}` blocks from `/opt/hosthampton/nginx/nginx.conf` (then `nginx -t` + reload/restart
as in runbook step 4).

## Risks / open decisions

- **Shared Supabase — staging writes go to the production database.** There is only one Supabase
  project. A completed staging checkout inserts a real row into the **production** `orders` table
  — see `docs/metro/research/metro-checkout-server.md`'s "Staging / test mode" section for exactly
  how those rows are tagged (`status: 'test'`, `tags` includes `'test'`, `[TEST]`-prefixed
  notification subjects) and the cleanup SQL to periodically purge them. **Never treat `status =
  'test'` rows as real orders in any dashboard/export that doesn't already filter them out.**
- **Shared edge functions.** `create-metro-checkout` / `verify-metro-payment` /
  `metro-stripe-webhook` are the same deployed functions serving both production and staging
  traffic — a bug introduced in this pass affects production immediately on deploy, not just
  staging. The live/test split is entirely inside those functions (Origin/session/event-based —
  see `stripe-mode.ts`), not a separate function deployment.
- **Shared reverse proxy.** Restarting `hampton_nginx` to add the staging vhost (runbook step 4)
  briefly interrupts every site on this VPS, including Host Hampton's production site and MGG
  production. Do it in a low-traffic window; prefer `nginx -s reload` over `restart` if available.
- **Shared VPS resources.** Even with `mem_limit`/`cpus` bounding the staging *container*, the
  image *pull* itself and general staging traffic add some load to an already RAM-constrained host
  (see "VPS architecture" above). Building in CI (not on the VPS) removes the biggest risk (the
  Chromium build), but staging traffic during an active testing session is still real load on a
  shared machine — keep testing sessions short/deliberate rather than leaving staging under
  sustained load.
- **`METRO_CHECKOUT_ALLOW_UNCONFIRMED`** — this owner override (to test checkout against a metro
  whose price book isn't `priceBookConfirmed` yet) is now gated to test-mode-only (see
  `metro-checkout-server.md`), so turning it on in the Supabase project's env is safe even with
  production traffic flowing through the same functions — it can never affect a live checkout.
  Still, only enable it when actively testing an unconfirmed metro on staging, and turn it back off
  afterward to avoid confusion.
- **GHCR image contains only public values** — same `.env`-committed public Supabase anon key every
  production browser bundle already ships; no server secrets are baked into the client image either
  way (server secrets live in Supabase project env vars, never in this repo or the built image).
  Still, prefer making the package public (runbook step 5) over leaving it private-with-a-long-lived-PAT
  once you're comfortable that's true for anything else that might get added to the build later.
