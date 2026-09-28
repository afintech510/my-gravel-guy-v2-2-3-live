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

# vite build + Playwright prerender pass — see scripts/prerender/prerender.mjs
# and docs/metro/research/prerender-implementation.md. Falls back to plain
# `npm run build` (no prerender) if this needs to be rolled back quickly.
RUN npm run build:prerender

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
