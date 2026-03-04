# MyGravelGuy — Business Overview & Project Knowledge

## What Is MyGravelGuy?

MyGravelGuy (mygravelguy.com) is a **nationwide bulk landscape materials delivery marketplace**. We connect customers (homeowners and contractors) with local quarries and suppliers to deliver gravel, sand, topsoil, mulch, crushed stone, and related materials directly to their jobsite or property.

**Business model**: We take orders online (instant pricing or quotes), source material from our network of local suppliers, coordinate delivery, and earn margin on the spread between supplier cost and customer price. Think of us as the "Uber for gravel" — one point of contact for bulk material delivery anywhere in the US.

**Website**: https://mygravelguy.com
**Tagline**: "Do You Have a Gravel Guy?"

---

## Key Value Propositions

1. **Instant Delivered Pricing** — Customers enter their ZIP code and get a price that includes delivery. No calling around to quarries.
2. **Nationwide Coverage** — We serve all 50 states through our supplier network. 33,700+ ZIP codes in our database with location-based price adjustments.
3. **One Point of Contact** — Especially valuable for contractors working in unfamiliar markets. One phone call/order and we handle sourcing.
4. **Online Ordering** — Full e-commerce flow with Stripe payments. No other bulk material company does this well.
5. **3-Ton Minimum** — Keeps orders profitable. Typical order is 16 tons.
6. **Free Delivery Included** — Delivery cost is baked into the per-ton price, not a separate line item.

---

## Product Catalog (47 Active Products)

### Categories & Products

| Category | Products | Base Price Range | Unit |
|---|---|---|---|
| **Crushed Concrete** | Crushed Concrete (1.5", 2-3", 3/4"), RCA Blend 3/4" | $90/ton | ton |
| **Crushed Gravel** | Crushed Gravel (1.5", 2-3", 3/4", 3/8") | $100/ton | ton |
| **Crushed Stone** | #10 Screenings, #57, #67, #8 Stone, Crushed Stone (1.5", 2-3", 3/4", 3/8") | $83-95/ton | ton |
| **Dirt** | Clean Fill, Dirt Fill | $30/yard | yard |
| **Driveway Gravel** | Driveway Gravel (default, 1.5", 3/4", 3/8") | $80/ton | ton |
| **Mulch** | Chocolate Brown, Jet Black, Natural Brown, Red | $95/yard | yard |
| **Natural Gravel** | Drainage Rock, Natural Gravel, Pea Gravel 3/8" | $100-130/ton | ton |
| **River Rock** | River Rock (1"), River Rock Large (2-3") | $136-205/ton | ton |
| **Rock & Stone** | #57 Stone, Crusher Run, Decomposed Granite, Pea Gravel, Road Base | $83-125/ton | ton |
| **Sand** | Beach Sand, Mason Sand, Playground Sand, Washed Sand | $95/ton | ton |
| **Soil** | Compost, Loam, Topsoil | $30/yard | yard |
| **Walkway Gravel** | Walkway Gravel (default, 3/4", 3/8") | $60-80/ton | ton |

### Pricing Model

We use an **exponential pricing curve** that gives volume discounts:

```
price_per_unit = a * e^(b * quantity) + c
```

- Each product has custom coefficients (a, b, c)
- Larger orders = lower per-unit price (incentivizes bulk)
- ZIP code adjustment multiplier applied on top (e.g., 1.2x for remote areas)
- Prices rounded to nearest $10
- Minimum price floor: max(basePrice * 0.5, $50)

**Example**: Crusher Run at 10 tons → ~$89/ton delivered. At 30 tons → ~$79/ton delivered. Plus ZIP code adjustment.

---

## Order & Revenue Data (as of March 2026)

| Metric | Value |
|---|---|
| Total orders + quotes | 200 |
| Paid orders | 41 |
| Quotes generated | 89 |
| Average order value | $1,473 |
| Average quantity per order | 16.4 tons |
| First order | July 2025 |
| Operating since | ~8 months |

### Top States by Order Volume
1. California (9 orders, $1,262 avg)
2. Florida (8 orders, $3,355 avg)
3. Texas (6 orders, $1,055 avg)
4. New York (6 orders, $1,471 avg)
5. Minnesota (5 orders, $1,707 avg)
6. North Carolina (4 orders, $785 avg)

### Payment Options
- **Full payment** via Stripe (credit card)
- **$199 deposit** option with balance due on delivery
- **Quote-to-order conversion** flow for custom pricing

---

## Customer Segments

### 1. Homeowners (Current secondary focus)
- DIY driveway, landscaping, patio, drainage projects
- Typical order: 3-10 tons
- Found us via Google Search, Google Shopping
- Value: instant pricing, no calling around, delivered to their door
- Pain points: "How much gravel do I need?", "What type?", "How much will it cost delivered?"

### 2. Contractors (Primary growth target)
- Landscapers, GCs, excavation companies, playground/turf installers
- **Key use case**: Working OUTSIDE their normal area and need a reliable material source
- Typical order: 15-50+ tons, higher AOV
- Value: One point of contact nationwide, reliable sourcing in unfamiliar markets
- **Current traction**: Regional/national contractors using us when outside their home turf
- Pain points: Finding reliable suppliers in new markets, getting competitive pricing fast, coordinating logistics

### 3. Contractor Subtypes
- **Playground & Turf Specialists** — Need specific materials (pea gravel, sand, crushed stone) for playground surfacing
- **Landscaping Companies** — Mulch, topsoil, decorative stone for residential/commercial projects
- **General Contractors** — Base materials (crusher run, road base, crushed concrete) for site work
- **Excavation/Grading** — Fill dirt, road base, large quantities

---

## Current Marketing & Sales Channels

### Active Channels
1. **Google Ads** — Targeting homeowners and contractors (starting up)
2. **Google Shopping** — Product feed via Edge Function (google-shopping-feed)
3. **Apollo.io** — Email sequencing for contractor outreach (website tracker installed)
4. **SEO / Organic** — Blog content, location pages (196 delivery locations), product pages
5. **Google Analytics (GA4)** — ID: G-VWSWTSDH99
6. **Google Ads Conversion Tracking** — ID: AW-8424526917

### Website Features Supporting Marketing
- **Product Recommendation Quiz** — Helps homeowners choose the right material
- **Material Calculator** — "How much do I need?" tool (area + depth → tons/yards)
- **196 Location Pages** — SEO pages for delivery areas (e.g., /locations/dallas-tx)
- **Blog** (11 posts) — Material guides, driveway ideas, project tips, delivery FAQ
- **Contractor Landing Page** (/contractors) — Dedicated page targeting contractor accounts
- **Google Shopping Feed** — Automated product data feed
- **Abandoned Cart Emails** — Automated recovery sequences
- **Live Chat** — AI-powered chat for visitor questions

### UTM Tracking
Orders table tracks: utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, gbraid, wbraid, landing_page_url, referrer, user_agent. (Currently no UTM data on existing orders — needs implementation in ad campaigns.)

---

## Supplier Network

22 suppliers in the database, spanning:
- Colorado (Direct Landscape Supply, Martin Marietta)
- Texas (OilFlyOne Aggregates, Texan Material, AAA Sand)
- New Hampshire (Greymont Earth Materials)
- New York (Spallina Materials)
- Oregon (Instant Landscaping)
- Florida (Cemex Florida, J&K Rocks, Dirt Cheap)
- North Carolina (Pittsboro Landscape Supply, Coastal Mulch)
- Minnesota (North Country Excavation)
- Massachusetts (Landscape Express)
- California (Acapulco Rock and Soil)

**Supplier model**: We contact suppliers to quote material + delivery, negotiate pricing, then mark up for our margin. Some suppliers are pre-negotiated, others are quoted per-order.

---

## Competitive Landscape

| Competitor | Model | Weakness vs. Us |
|---|---|---|
| Local quarries/suppliers | Direct, pickup-focused | No online ordering, limited delivery, no instant pricing |
| Landscape supply stores | Retail, small quantities | Not bulk-focused, high prices per unit |
| National aggregate cos (Vulcan, Martin Marietta) | B2B wholesale | Don't serve small orders, no consumer-facing e-commerce |
| Other online material marketplaces | Similar concept | Most are regional or haven't built instant pricing |

**Our moat**: Exponential pricing engine + nationwide ZIP code coverage + full e-commerce checkout + supplier network.

---

## Brand & Design

- **Primary Color**: Bright green `#14FF6A`
- **Accent**: `#BADF24` (contractor pages)
- **Background**: Dark `#0F1115`
- **Fonts**: Montserrat (headings), Playfair Display (accents), Roboto Mono (data)
- **Tone**: Professional but approachable, construction-industry language, no fluff
- **Logo**: Stored in Supabase Storage

---

## Contact Information

- **Legal Entity**: Eastern Building Supply Inc.
- **Brand**: MyGravelGuy.com / My Gravel Guy
- **Website**: https://mygravelguy.com
- **Phone**: (844) 624-0400
- **Support Email**: support@mygravelguy.com
- **Order Email**: order.support@mygravelguy.com
- **Hours**: Mon-Fri 8am-5pm ET, Sat 8am-1pm ET
- **Social**: @mygravelguy (Twitter/X)

---

## Current Business Objectives (Q1 2026)

1. **Scale contractor acquisition** — More contractor accounts via Google Ads + Apollo.io email sequences
2. **Google Ads campaigns** — Target homeowners (DIY projects) and contractors (bulk sourcing)
3. **Improve conversion funnel** — Quote-to-order conversion, abandoned cart recovery
4. **Expand supplier network** — More suppliers = better coverage + pricing
5. **SEO growth** — Rank for material + location keywords
6. **Delivery confirmation system** — Just built and deployed (SMS/email verification + signature capture)
