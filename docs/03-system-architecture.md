# MyGravelGuy — System Architecture & Technical Overview

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite 5 |
| **Styling** | Tailwind CSS 3 + shadcn/ui (Radix) |
| **State** | React Context (Cart, ZipCode, Blog, Quiz, LandingPage) + TanStack React Query |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form + Zod validation |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Payments** | Stripe (checkout sessions, payment intents, auth holds) |
| **SMS** | Twilio (send/receive SMS, voice response) |
| **Email** | Resend (transactional email) |
| **Maps** | Mapbox (delivery coverage map) |
| **Analytics** | Google Analytics GA4 (G-VWSWTSDH99) + Google Ads (AW-8424526917) |
| **Prospecting** | Apollo.io (website visitor tracking + email sequences) |
| **Hosting** | Hetzner VPS (Docker + nginx) |

---

## Hosting & Infrastructure

### Hetzner VPS
- **IP**: 5.161.88.134 (SSH alias: `hampton-vps`)
- **OS**: Ubuntu 24.04 LTS
- **Specs**: 3 CPUs, 3.7GB RAM, 75GB disk
- **Shared with**: Host Hampton project (11 Docker containers)

### Deployment
- Docker Compose with multi-stage build:
  1. `node:20-alpine` — npm ci + vite build
  2. `nginx:alpine` — serves static dist/
- nginx reverse proxy with:
  - SPA fallback (`try_files $uri $uri/ /index.html`)
  - Aggressive caching for `/assets/` (1 year, immutable — Vite hashes filenames)
  - No-cache for index.html (prevents stale JS bundles)
  - Gzip compression
  - Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Cloudflare sits in front (DNS + CDN + SSL)

### Deploy Process
```bash
ssh hampton-vps "cd /opt/mygravelguy && git pull origin main && docker compose build --no-cache && docker compose up -d"
```

---

## Application Architecture

### Directory Structure
```
src/
├── pages/              # 30+ route pages
├── components/         # Feature-grouped React components
│   ├── ui/            # shadcn/ui (30+ base components)
│   ├── admin/         # Admin dashboard
│   ├── cart/          # Shopping cart
│   ├── dashboard/     # Orders, expenses, analytics
│   ├── forms/         # Quote forms
│   ├── payment/       # Stripe integration
│   ├── products/      # Product grid, cards, calculator
│   ├── quiz/          # Product recommendation quiz
│   ├── shop/          # Shop layout & filtering
│   ├── calculator/    # Material calculators
│   ├── blog/          # Blog rendering
│   ├── chat/          # AI chat interface
│   ├── reviews/       # Customer reviews
│   └── [more...]     # contact, landing, messaging, sms, etc.
├── contexts/          # Cart, ZipCode, Blog, Quiz, LandingPage
├── hooks/             # 14 custom hooks
├── services/          # Business logic & API calls
├── integrations/      # Supabase client config
├── types/             # TypeScript definitions
├── utils/             # Helpers (analytics, dates, email templates, etc.)
├── lib/               # Library utilities
├── data/              # Static data
└── assets/            # Images, fonts
```

### Routing

**Public Pages**:
- `/` — Homepage
- `/products` — Product listing
- `/products/:slug` — Product detail
- `/shop` — Shop with filtering
- `/cart` — Shopping cart
- `/checkout` — Checkout flow
- `/locations` — All delivery locations
- `/locations/:slug` — Specific location (196 pages)
- `/blog`, `/blog/:slug` — Blog
- `/about`, `/contact`, `/faq` — Info pages
- `/contractors` — Contractor landing page
- `/reviews` — Customer reviews
- `/delivery-info` — Delivery information

**Tools**:
- `/quiz` — Product recommendation quiz
- `/calculator` — Material calculator
- `/delivery-map` — Coverage map (Mapbox)
- `/chat` — AI chat assistant

**Admin** (authenticated):
- `/dashboard` — Overview
- `/dashboard/orders` — Order management
- `/dashboard/quotes` — Quote management
- `/dashboard/suppliers` — Supplier management
- `/dashboard/expenses` — Expense tracking
- `/dashboard/analyze` — Business analytics

**Special**:
- `/quote-checkout/:quoteId` — Quote payment page
- `/google-shopping` — Product feed page
- `/delivery-confirm?token=` — Delivery confirmation (standalone, no nav)
- `/sms-consent` — SMS opt-in consent

### State Management

| Context | Data | Persistence |
|---|---|---|
| CartContext | Items, quantities, prices, delivery details, coupons, deposits | localStorage |
| ZipCodeContext | User ZIP, service area validation, price adjustment | localStorage |
| BlogContext | Blog posts, categories | React Query cache |
| QuizContext | Quiz answers, recommendations | In-memory |
| LandingPageContext | Landing page variant data | In-memory |

### Auth System
- Supabase Auth with PKCE flow
- Admin access via email whitelist checked by `check_user_admin_status` RPC
- Admin emails: admin@mygravelguy.com, mygravelguy@gmail.com, manager@mygravelguy.com, adam@easternbuilding.supply, techminded.xyz@gmail.com, ronnie@easternbuilding.supply
- Google OAuth available
- Auto session recovery on app load

---

## Supabase Edge Functions (17 active)

| Function | Purpose | Auth |
|---|---|---|
| `create-payment` | Create Stripe checkout session | No JWT |
| `verify-payment` | Verify Stripe payment | No JWT |
| `create-auth-hold` | Create Stripe auth hold | No JWT |
| `create-quote-checkout` | Create quote payment session | No JWT |
| `send-email` | Send transactional email (Resend) | No JWT |
| `send-sms` | Send SMS (Twilio) | No JWT |
| `send-order-sms` | Send order-specific SMS | No JWT |
| `receive-sms-webhook` | Twilio inbound SMS webhook | No JWT |
| `get-messages` | Fetch SMS conversations | No JWT |
| `mark-messages-read` | Mark messages as read | No JWT |
| `voice-response` | Twilio voice call handler | No JWT |
| `chat` | AI chat assistant | No JWT |
| `send-quote-conversion-email` | Email when quote converts | No JWT |
| `process-abandoned-carts` | Cart recovery automation | No JWT |
| `unsubscribe-cart-emails` | Email unsubscribe handler | No JWT |
| `google-shopping-feed` | Generate product feed XML | No JWT |
| `delivery-verify` | SMS/email verification for delivery confirm | No JWT |

---

## Key Business Flows

### 1. Customer Purchase Flow
```
Visit site → Enter ZIP code → Browse/search products → Select product + quantity
→ See instant delivered price → Add to cart → Checkout → Stripe payment
→ Order created (status: pending) → Admin notified → Supplier sourced
→ Delivery scheduled → Delivery confirmed (signature + photo)
```

### 2. Quote Flow
```
Customer requests quote (form) → Quote created (status: Quote)
→ Admin reviews → Sends quote with pricing → Customer receives quote email
→ Customer pays via quote-checkout link → Quote converts to order
→ Standard fulfillment flow
```

### 3. Contractor Flow
```
Contractor visits /contractors → Submits quote request (material, qty, location, date)
→ Quote created → Admin sources from supplier network → Quote sent
→ Contractor pays → Material delivered → Delivery confirmed
```

### 4. Abandoned Cart Recovery
```
Customer adds to cart → Leaves without paying
→ process-abandoned-carts edge function runs on schedule
→ Recovery email sent → Track opens/clicks
→ Customer returns to complete purchase
```

### 5. Delivery Confirmation Flow
```
Admin creates delivery_confirmation record (token, order details)
→ SMS/email sent to customer with confirmation link
→ Customer opens link → Verifies identity (SMS or email code)
→ Reviews order details → Signs (signature canvas) → Optional photo
→ Submits confirmation → Record updated with signature, IP, location, timestamp
```

---

## Third-Party Integrations

### Stripe
- Checkout Sessions for standard payments
- Payment Intents for custom flows
- Auth Holds for deposit verification
- Webhooks: payment success → order status update

### Twilio
- Outbound SMS: order confirmations, delivery updates, verification codes
- Inbound SMS: customer replies via webhook
- Voice: automated phone responses
- Phone number management

### Resend
- Transactional email: order confirmations, quote emails, delivery verification
- Abandoned cart recovery emails
- Quote conversion notifications

### Mapbox
- Interactive delivery coverage map
- Geocoding for delivery addresses

### Apollo.io
- Website visitor identification (tracker script in index.html)
- Email sequence automation for contractor outreach
- App ID: `69604af00e7c6c0021cf92a9`

### Google
- GA4 analytics (G-VWSWTSDH99)
- Google Ads conversion tracking (AW-8424526917)
- Google Shopping product feed
- Structured data (JSON-LD) for products, reviews, organization

---

## SEO Infrastructure

### Current SEO Assets
- **47 product pages** with structured data (JSON-LD Product schema)
- **196 location pages** for local SEO (e.g., `/locations/dallas-tx`)
- **11 blog posts** across 4 categories
- **Dynamic sitemap** auto-generated at build time (273 URLs)
- **Contractor landing page** optimized for commercial keywords
- **Meta tags** on all pages via react-helmet-async
- **Canonical URLs** set on key pages
- **Open Graph + Twitter Cards** for social sharing

### Sitemap Breakdown
- 17 static pages
- 47 product pages
- 3 market material pages
- 11 blog posts
- 196 location pages
- **Total: 273 URLs**

### Analytics Tracking
- GA4 page views on all routes
- Google Ads conversion pixels
- UTM parameter capture on orders (source, medium, campaign, term, content)
- Google click IDs (gclid, gbraid, wbraid)
- Landing page URL and referrer tracking
- Apollo.io visitor identification
