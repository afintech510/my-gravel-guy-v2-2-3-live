# MyGravelGuy — SEO Audit Report

**Date**: March 3, 2026
**URL**: https://mygravelguy.com
**Audit Scope**: Full site — technical, on-page, content, structured data

---

## Executive Summary

MyGravelGuy has a solid SEO foundation with 273+ indexed URLs (47 products, 196+ locations, 11 blog posts), structured data on key pages, and good route-based code splitting. However, several critical issues are limiting organic performance:

### Top 5 Priority Issues

1. **No server-side rendering (SSR) or prerendering** — Social shares show generic fallback title; reliance on Googlebot JS rendering
2. **Hardcoded fake aggregate ratings** in structured data — Violates Google policy, risks manual penalty
3. **Missing meta tags on key commercial pages** — Contractors, blog index, reviews, calculator pages
4. **`/products` vs `/shop` keyword cannibalization** — Two near-identical pages competing
5. **Homepage hero image invisible to search** — CSS background instead of `<img>` tag

### Quick Wins Identified
- Add missing Helmet meta tags to ~10 pages (1-2 hours of work)
- Fix canonical URL inconsistency on LandingPage.tsx (`www` vs non-`www`)
- Add `noindex` to Cart/Checkout pages
- Add `noindex` + proper title to 404 page

---

## 1. Crawlability & Indexation

### Robots.txt ✅ Good

```
User-agent: Googlebot — Allow: /
User-agent: Bingbot — Allow: /
Blocked: /dashboard, /dashboard/*, /stripe-test, /checkout, /payment-success
Sitemap: https://mygravelguy.com/sitemap.xml
```

- Cloudflare managed section blocks AI scrapers (GPTBot, ClaudeBot, etc.) — intentional
- Admin/checkout pages properly blocked
- Sitemap reference present

**No issues found.**

### XML Sitemap ✅ Good

- **545 URLs** indexed (up from 273 at last build — location pages expanded)
- Valid XML format with `<urlset>` declaration
- Priority values appropriate (1.0 for homepage, 0.3-0.8 for content)
- No duplicate URLs, no parameterized URLs
- All HTTPS
- Auto-generated at build time

**Minor**: Product page `lastmod` dates are June 2025 — should update on product changes.

### Client-Side Rendering 🔴 CRITICAL

**Issue**: The site is a React SPA. All content is rendered client-side via JavaScript. The initial HTML served is:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

**Impact**:
- **Social sharing broken for inner pages** — When someone shares a product/blog/location URL on Slack, WhatsApp, Facebook, or Twitter, the preview shows the generic `index.html` fallback title ("My Gravel Guy | Bulk Gravel, Sand & Mulch Delivery Nationwide") instead of the page-specific title set by `react-helmet-async`
- **Googlebot dependency** — Google can render JS, but relies on its rendering queue. Pages may take days/weeks to be fully indexed after changes
- **Other search engines** — Bing, DuckDuckGo, and others have limited JS rendering
- **SEO tools** — Most crawlers (Screaming Frog without JS, Ahrefs) won't see rendered content

**Evidence**: The `NotFound.tsx` has a `document.dispatchEvent(new Event('prerender-ready'))` call, suggesting prerendering was planned but **never deployed**.

**Recommendation**: Implement one of:
1. **Cloudflare Workers prerendering** (easiest — intercept bot requests, serve pre-rendered HTML)
2. **prerender.io** service integration
3. **Migrate critical pages to Next.js/Astro** for SSR (most work, best results)

### Soft 404s ⚠️ Medium

**Issue**: The 404 page returns HTTP 200 (as all SPA routes do). Google sees these as "soft 404s."

**Fix**: The `NotFound.tsx` page needs:
- `<title>Page Not Found | My Gravel Guy</title>`
- `<meta name="robots" content="noindex, follow" />`

Currently NotFound.tsx has NO Helmet at all.

---

## 2. Technical Foundations

### HTTPS & Security ✅ Good
- Full HTTPS via Cloudflare
- Security headers present (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- No mixed content issues

### URL Structure ✅ Good
- Clean, readable URLs: `/products/crushed-gravel-34in`, `/locations/dallas-tx`
- Lowercase, hyphen-separated
- No unnecessary parameters
- Consistent structure

### Caching ✅ Fixed (this session)
- `index.html` now returns `no-cache, no-store, must-revalidate`
- `/assets/*` gets 1-year immutable cache (Vite hashes filenames)
- Static files get 30-day cache

### Code Splitting ✅ Excellent
- `React.lazy()` for all 53+ routes except homepage
- Homepage eager-loaded for instant first paint
- `<Suspense fallback={<PageLoader />}>` on all lazy routes

### Image Optimization ⚠️ Mixed
- `loading="lazy"` used on many components (ProductCard, BlogPost, About, etc.)
- **Missing lazy loading**: ShoppingModule product thumbnails
- **No WebP/AVIF**: Images served from Supabase Storage as original format (PNG/JPG)
- **Homepage hero is CSS background**: Not crawlable by Google Images, no alt text

### Mobile ✅ Good
- Responsive design (Tailwind CSS responsive utilities)
- Viewport meta tag present
- Touch-friendly tap targets (buttons use py-4, adequate sizing)

---

## 3. On-Page SEO — Page-by-Page Audit

### Pages With Full SEO Coverage ✅

| Page | Title | Description | Canonical | OG Tags | JSON-LD |
|---|---|---|---|---|---|
| `/` Homepage | ✅ | ✅ | ✅ | Partial (no og:image in Helmet) | ✅ LocalBusiness |
| `/products` | ✅ | ✅ | ✅ | Partial (no og:image) | — |
| `/shop` | ✅ | ✅ | ✅ | ✅ Full | ✅ CollectionPage |
| `/about` | ✅ | ✅ | ✅ | ✅ Full | ✅ Organization |
| `/contact` | ✅ | ✅ | ✅ | ✅ Full | ✅ ContactPage |
| `/faq` | ✅ | ✅ | ✅ | Partial (no og:desc) | ✅ FAQPage |
| `/products/:slug` | ✅ | ✅ | ✅ | ✅ Full | ✅ Product (rich) |
| `/locations/:slug` | ✅ | ✅ | ✅ | ✅ Conditional | ✅ LocalBusiness |
| `/blog/:slug` | ✅ | ✅ | ✅ | ✅ Conditional | ✅ BlogPosting |
| `/landing` | ✅ | ✅ | ⚠️ Uses `www.` | ✅ Full | ✅ Organization+Service |
| `/markets/…/materials/…` | ✅ | ✅ | ✅ | ✅ Full | ✅ Product |

### Pages With Missing SEO Elements 🔴

| Page | Title | Description | Canonical | OG Tags | JSON-LD | Priority |
|---|---|---|---|---|---|---|
| `/contractors` | ✅ | ✅ | ✅ | ❌ All missing | — | **HIGH** — key commercial page |
| `/contractors-aggregate…` | ✅ | ✅ | ❌ | ❌ All missing | — | **HIGH** |
| `/contractors-spec-materials` | ✅ | ✅ | ✅ | Partial (no og:image) | ✅ Service | Medium |
| `/blog` (index) | ✅ | ✅ | ❌ | ❌ All missing | — | **HIGH** |
| `/reviews` | ✅ | ✅ | ❌ | ❌ All missing | — | **HIGH** |
| `/locations` (index) | ✅ | ✅ | ❌ | ❌ All missing | — | Medium |
| `/57-crushed-stone` | ✅ | ✅ | ✅ | Partial (no og:image) | ❌ No Product schema | **HIGH** — landing page |
| `/delivery` | ✅ | ❌ | ❌ | ❌ All missing | — | Medium |
| `/product-calculator` | ✅ | ✅ | ❌ | ❌ All missing | — | Medium |
| `/cart` | ✅ | ❌ | ❌ | ❌ | — | Low (should be noindex) |
| `/checkout` | ✅ | ❌ | ❌ | ❌ | — | Low (should be noindex) |
| `NotFound` (404) | ❌ | ❌ | ❌ | ❌ | — | **HIGH** |
| `/privacy`, `/terms`, `/refund` | ✅ | ✅ | ❌ | ❌ | — | Low |

---

## 4. Structured Data Audit

### What's Good ✅

| Schema Type | Pages | Quality |
|---|---|---|
| `LocalBusiness` | Homepage, Location pages | Good — includes telephone, areaServed |
| `Organization` | About, Landing | Good — includes legalName, knowsAbout |
| `Product` | Product detail, Market material pages | Rich — offers, shipping, return policy |
| `FAQPage` | FAQ | Excellent — all Q&A pairs mapped |
| `ContactPage` | Contact | Good |
| `BlogPosting` | Blog posts | Good |
| `CollectionPage` | Shop | Good |
| `Service` | ContractorsSpecMaterials | Good |

### Critical Issue: Fake Aggregate Ratings 🔴

**Issue**: `ProductDetail.tsx` and `MarketMaterialPage.tsx` include **hardcoded** aggregate ratings:

```json
"aggregateRating": {
  "ratingValue": "4.8",
  "reviewCount": "36"
}
```

This data is NOT pulled from actual customer reviews. It's the same static values on every product.

**Risk**: Google's structured data guidelines explicitly prohibit fake or misleading ratings. This can result in:
- Rich snippet removal
- Manual action (penalty)
- Loss of trust signals

**Fix**: Either pull real review data from the `customer_reviews` table per-product, or **remove the aggregateRating node entirely** until real per-product reviews exist.

### Missing Structured Data

| Page | Missing Schema | Impact |
|---|---|---|
| `/blog` (index) | `Blog` or `ItemList` | Medium |
| `/locations` (index) | `ItemList` of locations | Low |
| `/reviews` | `AggregateRating` at page level | Medium |
| `/57-crushed-stone` | `Product` | **High** — conversion landing page |
| `/products` | `ItemList` or `CollectionPage` | Medium |

---

## 5. Heading Hierarchy

### Overall: ✅ Good

All major pages have a single H1 with appropriate keyword targeting:

| Page | H1 |
|---|---|
| Homepage | "Premium Gravel Delivered to Your Door" |
| Products | "Premium Aggregates for All Projects" |
| Shop | "Shop Premium Materials" |
| About | "About MyGravelGuy.com" |
| Contact | "Nationwide Aggregate Sourcing & Delivery — Made Simple" |
| Contractors | "Do You Have a Gravel Guy?" |
| FAQ | "Frequently Asked Questions" |

**Minor issues**:
- Contractors page skips H3, goes H2→H4 in materials grid
- Homepage may have duplicate "Why Choose Us" H2 (static section + component)

---

## 6. Internal Linking

### Navigation Structure

**Navbar** links to: `/contractors`, `/shop`, `/product-calculator`, `/contact`, `/cart`
**Footer** links to: `/products`, `/locations`, `/product-calculator`, `/reviews`, `/contact`, `/delivery-map`, `/bulk-landscape-materials`, `/faq`, `/blog`, `/delivery`, `/about`, `/privacy`, `/terms`, `/refund`, `/sms-consent`, `/sitemap`

### Gaps ⚠️

| Issue | Impact |
|---|---|
| `/about` not in main nav | Medium — trust page should be accessible |
| `/blog` not in main nav | **High** — blog content needs nav link for authority |
| `/faq` not in main nav | Medium |
| `/reviews` not in main nav | Medium — social proof page |
| `/products` vs `/shop` — both exist, both linked | **High** — cannibalization risk |

### /products vs /shop Cannibalization 🔴

Both pages display the product catalog. They're both in the sitemap and both linked:
- Footer links to `/products`
- Navbar links to `/shop`

**Fix**: Pick ONE as the canonical product browsing page. Add `<link rel="canonical">` on the other pointing to the primary, or redirect one to the other.

---

## 7. Canonical URL Issues

### Domain Inconsistency 🔴

**`LandingPage.tsx`** uses `https://www.mygravelguy.com/landing` as canonical.
**All other pages** use `https://mygravelguy.com/...` (no `www`).

Google may treat these as different sites. Fix the landing page to use the non-www version.

### Missing Canonicals

Pages without canonical tags (see table in Section 3): Blog index, Reviews, LocationsIndex, DeliveryInfo, ProductCalculator, Cart, Checkout, legal pages, ContractorsAggregateLanding.

---

## 8. Open Graph & Social Sharing

### Issue: SPA Fallback for Social Previews 🔴

Because the site is client-rendered, social media crawlers (Facebook, Twitter, Slack, WhatsApp) only see the `index.html` meta tags:

```html
<meta property="og:title" content="My Gravel Guy | Bulk Gravel, Sand & Mulch Delivery Nationwide" />
<meta property="og:description" content="Order bulk gravel, sand, topsoil, mulch..." />
```

**Every page shared on social shows this generic title/description**, regardless of the page-specific Helmet tags. This means:
- Sharing a product page shows the homepage title
- Sharing a blog post shows the homepage title
- Sharing the contractor page shows the homepage title

**This is the single biggest SEO/marketing issue** — especially for contractor outreach via email/Slack where link previews matter.

### og:image Inconsistency

Two different sources used:
- `index.html`: `https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images/og-image.png`
- Page Helmets: `https://mygravelguy.com/og-image.png`

Standardize to one URL (preferably the domain one).

---

## 9. Content Quality Assessment

### Strengths
- 47 product pages with detailed descriptions, pricing, and structured data
- 196+ location pages for local SEO
- FAQ page with comprehensive Q&A (also has FAQPage schema)
- Calculator tools add genuine user value
- Blog content covers key informational queries

### Gaps for Contractor Audience
Currently no blog content targeting contractors:
- Missing: "How Contractors Source Materials in New Markets"
- Missing: "Playground Installation Material Guide"
- Missing: "Bulk Aggregate Pricing: What Contractors Should Know"
- Missing: Case studies or testimonials from contractor customers

### Review System Issue
- Review submission form (`ReviewForm.tsx`) is **commented out** — customers can't submit reviews
- All 36 reviews appear to be seeded/placeholder data (all created same timestamp)
- This undermines the review structured data credibility

---

## 10. Prioritized Action Plan

### 🔴 Critical (Fix This Week)

| # | Issue | Fix | Est. Effort |
|---|---|---|---|
| 1 | **Hardcoded fake aggregateRating** | Remove from ProductDetail.tsx and MarketMaterialPage.tsx, or wire to real DB reviews | 1 hour |
| 2 | **Social sharing shows generic title** | Implement prerendering (Cloudflare Workers or prerender.io) | 4-8 hours |
| 3 | **`/products` vs `/shop` cannibalization** | Redirect `/products` → `/shop` or set canonical | 30 min |
| 4 | **LandingPage.tsx `www` canonical** | Change to `https://mygravelguy.com/landing` | 5 min |

### 🟠 High Priority (This Sprint)

| # | Issue | Fix | Est. Effort |
|---|---|---|---|
| 5 | **NotFound.tsx missing Helmet** | Add title "Page Not Found" + `noindex` meta | 10 min |
| 6 | **Cart/Checkout missing `noindex`** | Add `<meta name="robots" content="noindex">` via Helmet | 10 min |
| 7 | **Contractors page missing OG tags** | Add og:title, og:description, og:image to Helmet | 15 min |
| 8 | **Blog index missing canonical + OG** | Add canonical, og:title, og:description, og:image | 15 min |
| 9 | **Reviews page missing canonical + OG** | Same as above | 15 min |
| 10 | **ContractorsAggregateLanding missing canonical + OG** | Same as above | 15 min |
| 11 | **`/57-crushed-stone` missing Product schema** | Add JSON-LD Product structured data | 30 min |
| 12 | **Add `/blog` to main navigation** | Update Navbar.tsx | 10 min |

### 🟡 Medium Priority (Next Sprint)

| # | Issue | Fix | Est. Effort |
|---|---|---|---|
| 13 | **Homepage hero → proper `<img>` tag** | Replace CSS background with `<img>` + descriptive alt | 30 min |
| 14 | **Enable review submission** | Uncomment ReviewForm, wire to Supabase | 2-3 hours |
| 15 | **og:image standardize** | Use `https://mygravelguy.com/og-image.png` everywhere | 30 min |
| 16 | **Add missing canonicals** | LocationsIndex, DeliveryInfo, ProductCalculator, legal pages | 30 min |
| 17 | **Product page `lastmod` dates** | Update sitemap generator to use product `updated_at` | 1 hour |
| 18 | **Twitter Card tags** | Add to all major pages (only ContractorsSpecMaterials has them) | 1 hour |
| 19 | **Image optimization** | Serve WebP from Supabase Storage or use `<picture>` tag | 2-3 hours |

### 🟢 Long-Term (Ongoing)

| # | Issue | Fix |
|---|---|---|
| 20 | **Contractor-focused blog content** | Write 4-6 posts targeting contractor search queries |
| 21 | **Collect real customer reviews** | Enable review form, email post-delivery review requests |
| 22 | **Location page enrichment** | Add unique content per location (not just templated) |
| 23 | **Backlink building** | Contractor directories, industry publications, local business listings |
| 24 | **SSR migration** | Consider Next.js/Astro for key pages (products, blog, locations) |
| 25 | **Google Search Console monitoring** | Regular checks for coverage issues, manual actions |

---

## Technical Notes

### What's Working Well
- Clean URL structure
- Proper robots.txt configuration
- Comprehensive sitemap (auto-generated, 545 URLs)
- Good heading hierarchy across all pages
- Strong structured data on product pages (minus the fake ratings)
- Excellent code splitting (53+ lazy routes)
- Image lazy loading on most components
- Good alt text practices
- Route-based Helmet meta tags on most pages
- FAQPage schema on FAQ page
- LocalBusiness schema on location pages
- Security headers and HTTPS

### Tools for Ongoing Monitoring
- **Google Search Console** — Coverage, performance, Core Web Vitals
- **Google Rich Results Test** — Validate structured data after changes
- **Lighthouse** — Performance, accessibility, SEO scores
- **Screaming Frog** (with JS rendering) — Full crawl analysis
