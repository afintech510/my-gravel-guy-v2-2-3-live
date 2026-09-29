# Stage 1: Build the React app
# Debian-based (not alpine) — Playwright's `--with-deps` installer needs a
# glibc distro with apt to pull Chromium's system libraries. Only this build
# stage needs it; the runtime image below is still nginx:alpine.
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .

# Chromium + its OS-level deps for the build-time prerender pass
# (scripts/prerender/prerender.mjs). Browser binary + apt packages stay in
# this stage only — never copied into the nginx runtime image.
RUN npx playwright install --with-deps chromium

# Optional build-time VITE_* overrides — used ONLY by the staging build
# (docker-compose.staging.yml, docs/metro/STAGING.md); the production build
# (docker-compose.yml) passes no build args at all, so every ARG below is
# unset/empty and this RUN behaves EXACTLY as before this block was added:
# Vite's `loadEnv` only overrides a committed `.env` value when the matching
# process-env key is actually present, and an empty string still compares
# unequal to every non-empty flag value these vars gate today (e.g.
# `=== 'true'`), so an empty override is a no-op either way — see
# docs/metro/STAGING.md "Build args" for what staging sets these to.
# - VITE_METRO_CHECKOUT_ENABLED: existing flag (src/metro/services/metroCheckoutService.ts),
#   now also settable at build time instead of only via the committed .env.
# - VITE_STAGING: drives the "STAGING — Stripe test mode" banner
#   (src/metro/components/layout/MetroLayout.tsx). Never set in production.
# - VITE_VERIFY_PAYMENT_FUNCTION / VITE_CREATE_AUTH_HOLD_FUNCTION: edge
#   function names for the live (non-metro) checkout path — staging points
#   these at the v2 functions (verify-payment-v2 / create-auth-hold-v2);
#   unset/empty in production, which keeps using the existing function names
#   however the client currently resolves them (unchanged by this pass).
ARG VITE_METRO_CHECKOUT_ENABLED
ARG VITE_STAGING
ARG VITE_VERIFY_PAYMENT_FUNCTION
ARG VITE_CREATE_AUTH_HOLD_FUNCTION

# vite build + Playwright prerender pass — see scripts/prerender/prerender.mjs
# and docs/metro/research/prerender-implementation.md. Falls back to plain
# `npm run build` (no prerender) if this needs to be rolled back quickly.
# Build ARGs are passed as env vars on this one command only (not `ENV`, so
# they never persist in this stage's image layers, and stage 2 below never
# sees them regardless since it starts a fresh `FROM nginx:alpine`).
RUN VITE_METRO_CHECKOUT_ENABLED="${VITE_METRO_CHECKOUT_ENABLED}" \
    VITE_STAGING="${VITE_STAGING}" \
    VITE_VERIFY_PAYMENT_FUNCTION="${VITE_VERIFY_PAYMENT_FUNCTION}" \
    VITE_CREATE_AUTH_HOLD_FUNCTION="${VITE_CREATE_AUTH_HOLD_FUNCTION}" \
    npm run build:prerender

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config for SPA routing, plus the redirect-map snippet it
# `include`s (see nginx/default.conf's comment above the `include` line, and
# docs/metro/research/aeo-foundations-changes.md §4 for what's in it).
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/redirects.conf /etc/nginx/redirects.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
