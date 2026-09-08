# MyGravelGuy

E-commerce and delivery platform for a gravel and construction-materials business.
Customers size a job with a materials calculator, check that their ZIP is in the
delivery area, order by the ton, and track delivery. Staff get an operations
dashboard for orders, expenses, and analytics.

Roughly 1,600 commits of production work.

## Stack

React 18 · TypeScript · Vite · Tailwind + shadcn/ui · Supabase (PostgreSQL, Edge
Functions, Auth, Storage) · Mapbox GL for delivery mapping · Google Maps Geocoding
for ZIP resolution · a Cloudflare Worker for edge routing · Docker for self-hosting

## What's interesting here

- **Materials calculator drives the cart.** Customers enter dimensions and depth;
  the app converts to tonnage per material density and prices the order. Selling
  bulk aggregate by volume is where this category of site usually gets it wrong.
- **ZIP-gated delivery.** `ZipCodeContext` gates pricing and availability on the
  service area, so customers never reach checkout for an address that can't be
  served. `DeliveryMap` renders coverage with Mapbox.
- **Programmatic local SEO.** Landing pages are generated per material and per
  location (`CrushedStoneLanding`, `LocationProductHero`,
  `ContractorsAggregateLanding`), with a sitemap and prerendered routes produced at
  build time by `scripts/generate-sitemap.mjs` and
  `scripts/generate-prerender-routes.mjs`.
- **Contractor-specific flows** separate from retail — spec materials, bulk pricing,
  and aggregate landing pages for trade buyers.
- **Operations dashboard** covering orders, expenses, and analysis, not just a
  storefront.

## Development

```bash
npm install
cp .env.example .env      # Supabase URL + publishable key, Google Maps key
npm run dev
```

```bash
npm test                  # unit tests
npm run generate-sitemap  # rebuild sitemap and prerender routes
npm run build
```

`VITE_*` values are public by design — they ship in the client bundle. Restrict the
Google Maps key by HTTP referrer in the Google Cloud console; server-side secrets
belong in Supabase Edge Function config, not here.

## Layout

```
src/pages/           routes — storefront, calculator, checkout, dashboard, blog
src/components/      shared UI
src/contexts/        cart, ZIP/service-area, blog state
src/integrations/    Supabase client
cloudflare-worker/   edge worker
scripts/             sitemap and prerender generation
docs/                design notes
KNOWLEDGE_BASE.md    architecture and domain reference
```
