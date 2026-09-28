# AI Advertising + Google Local Shopping — MyGravelGuy

_Status: COMPLETE. Research-only document; read-only on all repo code. Author: AI-ADS+SHOPPING research agent, 2026-09-27. Current as of late September 2026._

**How to read this document**
- **[FACT]** — verifiable, sourced to an official page or a live search result, with URL and access context.
- **[INFERENCE]** — our judgment applied to MyGravelGuy's specific situation. Not a fact, not guaranteed.
- **[NEEDS_REAL_NUMBER]** — a figure that matters but that we could not verify from an official source; never invented.
- Nothing here invents a statistic, a price, or a policy detail. Where a platform doesn't publish something (e.g. exact self-serve minimums), that gap is stated, not guessed.

---

## 0. Executive summary

1. **Urgent, non-metro issue found first**: Google's Content API for Shopping (v2.1) — which `src/services/googleShopping/merchantCenter.ts` still calls directly — began progressive errors on 2026-09-01 and is heading to blanket HTTP 410; today is 2026-09-27. This is likely already broken in production and blocks all Shopping work regardless of metro strategy.
2. The current repo feed generator computes **one flat national price** (3-ton minimum baked into `price`) and has **zero concept of metro or delivery zone** — it structurally cannot represent "price by delivery zone" today.
3. Google's own **Merchant API `regions` + `regionalInventories`** primitive is exactly the "metro → zone (ZIP set) → regional price" model this project needs, and is the sanctioned exception to Google's "never vary price by location" rule — build on it rather than inventing a workaround.
4. `unit_pricing_measure` does **not** support "ton" or "cubic yard" — leave it unset and keep per-unit pricing in free text, as the repo already does.
5. **Local Inventory Ads require a real, GBP-verified storefront.** MGG-brand DFW (partner yards, no MGG storefront) does not qualify; Long Island qualifies through **ELM's own** storefront/GBP, run as ELM's listing, not MGG's.
6. The Merchant Center OAuth token is currently exposed in the browser (`GoogleShoppingManager.tsx`); move the integration into a (currently-missing) `google-shopping-feed` edge function.
7. **ChatGPT ads** are now self-serve with no minimum spend, ZIP-level geo targeting, and local-services/household-goods is a permitted vertical — the one clear new paid channel worth a controlled DFW test.
8. **ChatGPT Instant Checkout** is not a near-term fit: reportedly pulled back in March 2026, and its flat-price checkout model doesn't suit zone-priced, truck-minimum bulk orders — pursue the free product feed only.
9. **Google AI Overviews/AI Mode ads** ride automatically on MGG's existing Search/Shopping/PMax campaigns (`AW-8424526917`) — no new campaign needed, only feed/creative quality.
10. **Perplexity has no ads today** (discontinued Feb 2026, subscription-only) — only its free Merchant Program is actionable; Microsoft Copilot ads are real but under-documented for our purposes and lower priority.
11. Recommended sequence: fix the Content API sunset and edge-function/regions architecture first (Part B) → free listings (Google, ChatGPT feed, Perplexity Merchant Program, GBP Products) everywhere they're cheap → controlled ChatGPT paid test in DFW once zone pricing is live in the feed → revisit Microsoft/Perplexity/Instant Checkout later.
12. Several figures in Part A (ChatGPT bid guidance, the March-2026 Instant-Checkout pullback, Microsoft Copilot pricing) rely on secondary sources because every direct fetch of `openai.com` and Microsoft's ad blog returned HTTP 403/was unavailable in this pass — flagged inline as [NEEDS_REAL_NUMBER] or "secondary-sourced" and worth re-verifying first-hand before committing budget.

---

## Part A — ChatGPT / AI ads & commerce

### A1. OpenAI ChatGPT Ads — status, targeting, buying, measurement, policy

**Status.** [FACT] OpenAI first acknowledged advertising plans on **2026-01-16** ("Our approach to advertising and expanding access to ChatGPT"), then began a **pilot on 2026-02-09** in the US: ads shown only to **logged-in adults (18+)** on the **Free** and paid-but-cheap **ChatGPT Go ($8/mo)** tiers. Plus, Pro, Business, Enterprise, and Edu remain ad-free. [FACT] Expanded in May 2026 to the **UK, Mexico, Brazil, Japan, and South Korea**. Source page `openai.com/index/testing-ads-in-chatgpt/` blocked our fetch tool with HTTP 403 (likely bot-protection on openai.com generally — every direct openai.com fetch in this research hit the same wall); the facts above are corroborated across multiple independent secondary write-ups of that post (CNBC, tech-insider.org, others) rather than read first-hand, so treat exact wording as paraphrase, not quotation.

**Who sees them / where they appear.** [FACT] Ads render as a clearly labeled **"Sponsored"** block **below** the model's answer — not inside the generated response — so ad content is visually and structurally separate from organic answers.

**Formats.** [FACT] Two ad units exist today: (1) a **`chat_card`** — advertiser-authored text unit: 3–50 character title, up to 100 characters of body copy, one image, a favicon, and a destination URL; (2) a **product feed ad** that OpenAI auto-builds from an advertiser's product catalog, shown as a single product or (in testing) a **multi-product carousel** at the bottom of a conversation.

**Targeting, including geo granularity.** [FACT] Ad selection is relevance/outcome-based, weighing conversation context and intent, the ad's own landing page/title/copy, advertiser-supplied "context hints," explicit targeting selections, and (if the user has ads personalization on) broader ChatGPT-account signals. [FACT] A May 2026 Ads Manager update added **geographic targeting by US state, DMA (Nielsen media market, ~210 nationwide), or ZIP code** — ZIP is the finest grain available. [FACT, secondary-sourced] As of that update there is **no radius/service-area targeting**, which matters for a delivery-zone business since our zones aren't state/DMA/ZIP-clean shapes; ZIP-code targeting is the closest fit and is exactly what our metro ZIP-set config (`src/metro/config/data/dfwZips.ts`) can drive directly.

**Buying, minimums, pricing.** [FACT] The initial closed pilot required a reported **$250,000 minimum spend** (Feb 2026), which dropped to **$50,000** by around April 2026, before OpenAI opened a **self-serve Ads Manager beta to all US advertisers in May 2026 with no minimum spend** and **CPC bidding**. [NEEDS_REAL_NUMBER] A commonly repeated "recommended starting bid of $3–$5/click" appears across secondary sources but is not an official published rate card — do not plan a DFW budget around that figure without confirming it live in Ads Manager at signup.

**Measurement.** [FACT] Alongside the self-serve launch, OpenAI shipped a **Conversions API** plus **pixel-based measurement**, intended to connect an in-ChatGPT ad click to downstream purchases/leads/signups on the advertiser's own site — the standard server-side-conversion pattern, useful for closing the loop back to GA4 (`G-VWSWTSDH99`) the same way Google Ads conversions already do.

**Home-improvement / local-services policy.** [FACT, secondary-sourced from `openai.com/policies/ad-policies/`, also 403-blocked to direct fetch] The initial pilot's permitted consumer verticals explicitly included **"local services"** and **"household goods"** — trades like plumbing, HVAC, roofing, electrical, and landscaping are named as runnable without extra eligibility hurdles. Excluded categories: adult content, alcohol/tobacco, counterfeit goods, gambling, political content, recreational drugs, scams/fraud, and weapons. Regulated categories (financial, health, legal services) can require licensure verification or manual review. [INFERENCE] Bulk construction-materials e-commerce (MGG's actual category) is not named explicitly in any source found; it most plausibly sits inside the permitted "local services"/"household goods" bucket alongside landscaping trades, but this should be confirmed at application time, not assumed.

**Advertiser API.** [FACT] `developers.openai.com/ads` documents a REST **Advertiser API** at `https://api.ads.openai.com`, Bearer-token auth (key created in Ads Manager → Settings), hierarchical resources (**Ad Account → Campaign → Ad group → Ad**), idempotency-key support, and rate limits of **600 requests/min per endpoint**, **1,200/min overall**, and **10 bulk-job-creation requests per 10 seconds** per account. It covers campaigns, ad groups, ads, product feeds, conversion tracking, and reporting conceptually; granular product-feed-specific mechanics live in the separate Commerce/product-feed spec (A2), not in the Ads API reference itself.

### A2. ChatGPT shopping / Instant Checkout / Agentic Commerce Protocol (ACP) / merchant feeds

**ACP itself.** [FACT] The **Agentic Commerce Protocol** is an open standard (Apache 2.0), co-developed by OpenAI and Stripe, released **2025-09-29**. Its core payment primitive is Stripe's **Shared Payment Token (SPT)**, the first implementation of a "Delegated Payment Spec": ChatGPT collects buyer/fulfillment/payment info and calls the **merchant's own** checkout-session endpoints; the merchant computes tax, validates fulfillment, runs risk checks, and accepts/declines the order on its own systems — OpenAI/Stripe pass a tokenized payment credential capped by a **maximum chargeable amount and expiry**, never a raw card number. [INFERENCE] This matters for MGG specifically: because the *merchant's own server* still computes the final price and accepts/declines the order, a zone-priced, minimum-quantity checkout is architecturally compatible with ACP's checkout-session model — the constraint is elsewhere (see below).

**Instant Checkout rollout.** [FACT] At launch, ChatGPT's in-chat Instant Checkout worked with **Etsy** merchants, with **Shopify** support announced to follow. [Reported, not first-party-confirmed — flag as NEEDS_REAL_NUMBER] Multiple secondary sources describe OpenAI **pulling back in-chat Instant Checkout around March 2026**, re-emphasizing product *discovery* over in-chat purchase completion, with only on the order of "~30" Shopify merchants reportedly live with full in-chat checkout as of mid-2026; for everyone else, ChatGPT surfaces products and hands the buyer off to the merchant's own site to finish the purchase. We could not verify this shift against an OpenAI first-party page (every openai.com URL we tried returned HTTP 403 to our fetch tool); treat the "retired/paused" characterization as directionally credible but unconfirmed, and re-check `developers.openai.com/commerce` directly before making it load-bearing for a go/no-go decision.

**Merchant onboarding (non-Shopify/Stripe/PayPal).** [FACT] Merchants outside the Shopify/Etsy fast lane apply at `chatgpt.com/merchants` with business details, SKU-count, and payment-provider info; OpenAI reviews and onboards "on a rolling basis" with no published SLA. Full custom integration means implementing the open-source ACP REST spec from scratch.

**Product feed spec (discoverability, independent of Instant Checkout).** [FACT] `developers.openai.com/commerce/product-feeds/spec` defines a schema of Required/Recommended/Optional attributes (basic data, media, pricing, shipping, variants). Accepted formats: **CSV, TSV, XML, JSON**, or compressed **JSONL (gzip), CSV (gzip), TSV (gzip), Parquet (zstd)**. Delivery is a **push model over SFTP** to an OpenAI-provisioned endpoint set up during onboarding — there is no self-serve upload UI equivalent to Merchant Center. Updates can be sent as often as **every 15 minutes** for pricing/inventory freshness. The schema encodes one price + one shipping charge per offer; it has **no documented regional-pricing primitive** analogous to Google's `regions`/`regionalInventories` (Part B).

**Feasibility for MGG's zone-priced delivered bulk goods.** [INFERENCE]
- **Product feed / discovery**: worth pursuing now — free, no minimum spend, and largely the same data discipline MGG already needs for Google Shopping. The open question is how to represent "price varies by delivery zone" in a schema built for one flat offer price; the safest near-term approach is a metro-level "starting at" price with the true zone price resolved on MGG's own landing page (same pattern recommended for the general web funnel), rather than trying to publish every zone as a separate feed row until OpenAI's schema documents a regional-price mechanism.
- **Instant Checkout**: not a near-term priority, for two independent reasons — (1) the reported March-2026 pullback means it may not even be broadly available right now regardless of category fit, and (2) even where available, ACP's checkout model assumes a knowable, tokenizable "maximum chargeable amount" for a catalog item, which fits flat-price SKUs far better than $300–$1,500 truck-minimum, zone-and-gate-fee-dependent bulk deliveries. Recommend: apply for the free product feed only; defer Instant Checkout until ACP publishes a variable/zone-pricing primitive or MGG's metro checkout is mature enough to test it explicitly.

### A3. Google AI Mode / AI Overviews ads, Microsoft Copilot ads, Perplexity ads/merchant program

**Google Ads in AI Overviews.** [FACT, from `support.google.com/google-ads/answer/16297775`] **Text and Shopping ads from existing Search, Shopping, and Performance Max campaigns** are automatically eligible to appear **inside** AI Overviews if they win the auction and are judged relevant to both the query *and* the AI Overview's generated content — there is no separate campaign type, no manual placement targeting, and **no opt-out**. Local and app ads can appear **above/below** (not inside) Overviews. In-Overview ad eligibility is currently limited to English-language markets: **Australia, Canada, India, Indonesia, Kenya, Malaysia, New Zealand, Nigeria, Pakistan, Philippines, Singapore, and the US**; above/below-Overview ads run in 200+ markets. Shopping ads need the usual feed hygiene (accurate price/availability/shipping, sufficient image/video diversity) to qualify. [FACT] There is **no segmented reporting** for in-Overview placements — they're folded into standard "Top ads" metrics, so we won't be able to isolate AI-Overview-specific performance in Google Ads/GA4 today.

**Google Ads in AI Mode.** [FACT] Google is **testing ads inside AI Mode** responses in the US (a further extension of the Overviews model to Google's conversational search surface), including a pilot called **"Direct Offers"** (exclusive offers surfaced to bottom-of-funnel AI Mode shoppers) and a beta campaign type, **"AI Max for Shopping,"** built specifically to keep Shopping/PMax inventory eligible across AI Overviews and AI Mode. [INFERENCE] Because eligibility for both surfaces rides on *existing* Search/Shopping/PMax campaigns (already running for MGG under `AW-8424526917`), there is no new platform to set up here — the leverage is entirely in feed quality and creative assets (Part B), not a new campaign to build.

**Microsoft Copilot ads.** [FACT, secondary-sourced — no first-party `about.ads.microsoft.com` post was retrievable in this pass, so treat as directional] Microsoft moved Copilot-native ad placements from a late-2024 limited test to **general availability in 2025**. Formats are described as native to the conversational surface rather than repurposed search ads: contextual in-answer recommendations, and a distinct **"Showroom Ads"** format — a split-view brand environment that opens alongside the live Copilot conversation. Microsoft Advertising's stated surface set for 2026 spans Bing, Edge, Outlook, Windows Start, Microsoft 365 apps, and Copilot. We did not find pricing, minimums, or a confirmed geo-targeting granularity for Copilot ad placements specifically in this pass — flag as an open item if Microsoft becomes a priority after Google/ChatGPT.

**Perplexity ads / merchant program.** [FACT] Perplexity ran **sponsored follow-up questions** from late 2024 through 2025, then **discontinued advertising in February 2026**, going subscription-only (a stated target of $500M ARR from subscriptions alone). [FACT] The separate **Perplexity Merchant Program** — a free product feed that lets retailers surface in Perplexity Shopping results — **continues** and is explicitly **not paid promotion**; results are described as "driven purely by data quality." [FACT] Adobe Analytics (cited via secondary source) reported AI-shopping-sourced traffic to US retail sites grew **693%** over the 2025 holiday season. [INFERENCE] Net effect: there is currently **no Perplexity ads line item** to test — only a free merchant-feed listing opportunity in the same family as Google's free listings and ChatGPT's product feed.

### A4. DFW AI-ads test plan

**Priority order** (highest leverage first, per the facts above): (1) **Google** — AI Overviews/AI Mode ad eligibility is automatic on our existing Search/Shopping/PMax campaigns (`AW-8424526917`); the only work is feed/creative quality (Part B), zero new platform to stand up. (2) **ChatGPT self-serve ads** — no minimum spend, ZIP-level geo targeting, a permitted vertical (local services/household goods) — the one genuinely new paid channel worth a controlled test. (3) **Free listings everywhere** — ChatGPT product feed + Perplexity Merchant Program + Google free Shopping listings + GBP Products tab entries: no ad spend, pure feed/catalog hygiene. (4) **Microsoft Copilot** — smaller share of DFW search volume and unconfirmed self-serve mechanics; revisit after (1)–(3) are running. (5) **Perplexity paid** — not available; no action. (6) **ACP Instant Checkout** — deferred per A2.

**Budget.** [INFERENCE] Because ChatGPT's self-serve tier has **no platform-imposed minimum**, the floor is whatever daily budget we choose to set, not a platform rule — so start with a small, easily-paused test budget sized against DFW order economics ($300–$1,500 AOV) rather than the stale $50k/$250k pilot-era figures, which no longer apply to self-serve. We deliberately do not commit to a specific dollar figure in this document (no invented numbers); size it against actual DFW conversion data once the metro landing page exists.

**Geo.** Target the Dallas–Fort Worth DMA, refined with **ZIP-code targeting using the exact same ZIP set already encoded in `src/metro/config/data/dfwZips.ts`** (per METRO-CORE's work referenced in `docs/metro/HANDOFF-LOG.md`) — this keeps ad spend confined to ZIPs MGG can actually fulfill in DFW, and avoids paying for clicks from outside the delivery footprint (there is no radius targeting to lean on instead, per A1).

**Creative.** Use the `chat_card` format: a 3–50 character title (e.g., "Bulk Gravel Delivered — DFW"), ≤100-character body naming delivery and speed rather than a specific price (since the real price is zone-dependent — see B2's price-accuracy discussion, which is a Google-specific rule but good discipline to reuse here too), one image, destination URL = the DFW metro landing page (not the homepage).

**Landing page.** Must be the DFW metro page, not the homepage — a ZIP-targeted ad sending traffic to a page that doesn't yet reflect that ZIP's zone price/availability undermines trust and wastes the geo-targeting investment.

**UTMs.** `utm_source=chatgpt`, `utm_medium=cpc`, `utm_campaign=dfw-launch` (or a metro-scoped convention consistent with existing Google Ads campaign naming), `utm_content=<creative variant>` — so GA4 (`G-VWSWTSDH99`) can separate ChatGPT-sourced traffic from Google Ads and organic within the metro funnel.

**KPIs.** Cost per quote request (via the existing `sendQuoteRequestEmail` interim conversion path noted in `docs/metro/HANDOFF-LOG.md`, pending metro Stripe checkout), cost per paid order once metro checkout ships, DFW landing-page conversion rate, and — since OpenAI's Conversions API exists (A1) — server-side conversion upload rather than relying on client-side pixel alone.

**Priority vs. Google.** Google requires no new platform work, only feed fixes (Part B) — those come first because they're both higher-leverage and, per B3/B4, urgently blocking regardless of ad strategy. ChatGPT is the incremental new channel to layer on once DFW metro pages and zone pricing exist, precisely because it can be started and stopped without a spend commitment.

---

## Part B — Google local Shopping for every metro

### B1. Options: Shopping ads + free listings, regional availability, Local Inventory Ads, Performance Max, GBP catalog

**The two Shopping tracks.** [FACT] Google Shopping has (a) **paid Shopping ads** (Standard Shopping campaigns, and Shopping inventory inside Performance Max) and (b) **free listings** (organic placement in the Shopping tab and related surfaces) — both driven off the **same Merchant Center product feed**. Neither requires a storefront; both work for a delivery-only online business like MGG.

**Local Inventory Ads (LIA) + free local listings — hard storefront requirement.** [FACT, from `support.google.com/merchants/answer/3271956` and `/answer/13869896`] LIA and free local listings require the advertiser to have **at least one physical, brick-and-mortar store open to the public**, plus a **verified Google Business Profile per location**, and a **`store_code`** attribute in the local-inventory data source that **matches the store code on that Business Profile** (case-sensitive). Ads/listings serve to shoppers Google judges to be within reasonable driving distance of that specific store — the radius is Google-determined and cannot be manually set. [FACT] LIA/free-local-listing policy explicitly waives the general Shopping-ads shipping and online-transaction requirements, because the transaction model assumed is in-store pickup, not delivery — a structural mismatch with MGG's "delivered only" model at the brand level.
- **DFW**: MGG operates through **partner yards with no MGG-branded storefront**. [INFERENCE] MGG itself does not qualify for LIA/free local listings in DFW under its own brand — there is no MGG storefront or MGG-controlled GBP location to verify. A DFW partner yard *could* run LIA under its **own** Merchant Center account and **own** verified GBP (i.e., "buy from [Partner Yard]" local ads), but that is a listing for the partner's business, not a "MyGravelGuy" listing riding on someone else's building; Google's local-inventory model ties the ad to the account/GBP pair that actually match, and no "broker lists another business's store" pattern is documented anywhere we found.
- **Long Island / ELM**: Eastern LM has an actual storefront **and** a Google Business Profile. [INFERENCE] LI is therefore the metro where LIA/free local listings are genuinely eligible — but the practical path is running that program out of **ELM's own** Merchant Center account/GBP (a "buy from Eastern LM" local presence), with MGG's online, zone-priced listing running in parallel on the non-local track described below, not merged into one listing.

**Regional availability and pricing (RAAP) — the correct track for a no-storefront, price-by-zone business.** [FACT, from `support.google.com/merchants/answer/9698880`, `/answer/16782229`, `/answer/16786149`] RAAP lets a merchant show **different price and/or availability by customer location** without a storefront, via two linked resources: `regions` (a named area defined by a set of postal codes, or a predefined geotarget in supported countries) and `accounts.products.regionalInventories` (a price/availability override for one product in one region). **The same `region` definitions are reusable for shipping settings** (regional shipping rates/speeds), so one postal-code taxonomy drives both price and delivery-cost logic — this is essentially Google's own version of "metro → zone (ZIP set) → regional price," already built. Eligibility requires an active Merchant Center account with at least one active product and one claimed URL; Google's crawlers spot-check regional price/availability for consistency, and mismatches can cause item- or account-level disapproval.

**Performance Max "store goals."** [FACT] A separate PMax variant focused on driving in-store visits/actions (calls, direction requests, store sales) from a **linked Google Business Profile** plus a local inventory feed plus geo-targeting; it uses driving-radius targeting around the linked/affiliate location(s). [INFERENCE] Not relevant to MGG's brand-level DFW model (no storefront to link); potentially relevant to ELM's own account in LI, orthogonal to MGG's zone-priced online listings.

**GBP product catalog.** [FACT] The "Products" tab on a Google Business Profile is a separate, lightweight catalog (name, image, price, description, CTA button) from Merchant Center Shopping feeds, manageable manually or via API, and now **also feeds Google's AI Overviews/Maps AI answers** for "where can I buy X" style queries. [INFERENCE] For any metro where a partner yard or sister brand (ELM) holds a verified GBP, adding its material catalog to that profile's Products tab is a near-zero-cost, no-ad-spend way to be surfaced in local AI answers — worth doing regardless of LIA eligibility, and independent of the Merchant Center feed work in B3.

### B2. Units & minimums (unit_pricing_measure, 3-ton minimum, price-includes-delivery, price parity)

**Allowed `unit_pricing_measure` units.** [FACT, from `support.google.com/merchants/answer/6324455`] The complete allowed unit list is: weight — `oz, lb, mg, g, kg`; volume — `floz, pt, qt, gal, ml, cl, l, cbm`; length — `in, ft, yd, cm, m`; area — `sqft, sqm`; count — `ct, sheet, item`. **Neither "ton" nor "cubic yard" is on this list** — `cbm` (cubic meter) is the only cubic/volume-adjacent unit, and `yd` is linear yards only. Since MGG and ELM price bulk materials by the ton and by the cubic yard, the attribute as designed cannot natively express "$X per ton" or "$X per cubic yard."
- [INFERENCE] `unit_pricing_measure`/`unit_pricing_base_measure` are **optional in the US** (only legally mandated for certain categories in the EU/EFTA/UK/AU/NZ), so the lowest-risk path is to **leave them unset** and continue expressing "per ton" / "per cubic yard" only as free text in title/description — exactly what `feedGenerator.ts` already does today. Forcing a unit conversion (e.g., 1 ton ≈ 907.18 kg) to fit the allowed list would technically populate the field but would display a unit the checkout doesn't actually use, which risks more confusion than benefit.

**Minimum order quantity.** [FACT] Merchant Center has dedicated attributes for this that the repo does not use: **`min_order_quantity`/`max_order_quantity`** (an explicit order-quantity range) and **`bulk_price`** (which carries its own `min_quantity` sub-attribute), plus a separate **`minimum_order_value`** (minimum spend to ship to a given country). [FACT — repo gap] `feedGenerator.ts` instead **hardcodes the 3-ton minimum into the `price` field** by pre-multiplying (`calculateProductExponentialPrice(product, 3)` × 3 tons) and never emits `min_order_quantity` or `bulk_price` at all — the minimum is invisible to Google as structured data, only implicit in the total shown.

**Delivery-included pricing and price parity.** [FACT, from Google's price-accuracy policy pages] The feed price and the landing-page price **must match exactly**, and a merchant **must not vary the displayed price by visitor location, cookie, browser, or device** — *except* through the sanctioned RAAP mechanism (`regions` + `regionalInventories`), which is precisely the documented exception to that rule. Logistics fees should be carried in the `shipping` attribute (labeled "shipping," "delivery," "handling," etc.) rather than silently folded into `price` if they need to vary. [INFERENCE] `feedGenerator.ts`'s current approach — one flat delivery-inclusive `price`, one flat `shipping: 'US:Continental US:0 USD:1-3 business days'` for the whole continental US — is compliant *only* because it currently shows one price to everyone; it is **not** a legitimate way to show genuinely different DFW-zone-A vs. DFW-zone-B prices. For MGG's actual "price by delivery zone" model, RAAP is the compliant mechanism: one base product + a `regionalInventories` override per zone, each carrying that zone's own delivery-inclusive price — the base price shown nationally can be a clearly-lower "starting at" reference, and each zone's regional override is what a shopper in that zone actually sees, without violating the no-price-by-location rule (because RAAP *is* that rule's built-in exception).

### B3. Merchant API / Content API sunset; per-metro feed architecture

**Sunset timeline — urgent.** [FACT] Google requires migration off **Content API for Shopping v2.1** to the **Merchant API** by **2026-08-18**. Starting **2026-09-01**, Content API v2.1 calls return **progressively more errors**, ultimately **HTTP 410 Gone**; short extensions to Oct 15, or Dec 31 for "exceptional cases," are available via a Google request form. **Today is 2026-09-27** — i.e., we are already past the Sept 1 error-escalation start, and `src/services/googleShopping/merchantCenter.ts` in this repo still calls `https://shoppingcontent.googleapis.com/content/v2.1/...` directly. **This is very likely a live production break right now, not a future risk** — see B4 for the exact lines.

**Merchant API shape.** [FACT] The replacement lives under `developers.google.com/merchant/api`, organized as resource-oriented services rather than one flat endpoint: `accounts` (account/business config, including `regions`), `products` — split into **`ProductInput`** (what you write, tied to a specific data source) versus **`Product`** (a read-only, merged/processed result built from one primary input plus zero or more supplemental inputs) — `accounts.products.regionalInventories` (region-scoped price/availability overrides), a parallel local-inventory resource, and `datasources`. OAuth 2.0 remains the auth model (as with Content API), but endpoint host, resource names, and request/response shapes have all changed — this is a rewrite of `merchantCenter.ts`, not a base-URL swap.

**Regions as the metro/zone primitive.** [FACT] A `region` is defined once as a set of postal codes (or, in supported countries, a predefined geotarget), and **the same region definitions are reused for both `regionalInventories` (price/availability) and shipping settings (regional rates/speed)** — Google's own data model already matches the "metros → zones (ZIP sets) → regional prices" shape this project needs, natively. [FACT, inconsistent across Google's own docs — flag as NEEDS_REAL_NUMBER] Reported postal-code quotas vary across Google's pages: some cite **25,000** postal-code entries per Merchant Center account, others **50,000**; there is also a **2 MB hard cap** on combined regions + shipping-settings data per account, and batch region-management calls handle **up to 100 regions per call**. Confirm the actual figure against the account's live quota page before scaling to many metros.

**Recommended Supabase edge-function feed architecture.** [INFERENCE — our design, not a Google specification]
1. **Source of truth**: the existing metro/zone/price-book tables from METRO-CORE's work (`src/metro/types.ts`, `src/metro/lib/pricing.ts`, `src/metro/config/data/dfwZips.ts`) — one row per (metro, zone, product, price) — rather than duplicating zone/ZIP data inside the Shopping feed code.
2. **New `google-shopping-feed` edge function** (named in project docs but absent from `supabase/functions/` today — confirmed by directory search) should mirror Merchant API's own split into two feed responsibilities:
   - A **primary product feed**: one row per SKU/material, metro-agnostic (title, description, images, `google_product_category`, and a base `price` = the metro's lowest/"starting at" zone price, clearly labeled as such) — submitted via a scheduled Merchant API `products`/`datasources` push.
   - A **regional inventory feed** keyed by `(offerId, region)`: one row per (product × zone), each carrying that zone's real delivery-inclusive price and availability, pushed via `accounts.products.regionalInventories` insert/list calls — one `region` per metro zone, generated directly from the same ZIP sets already encoded in `dfwZips.ts` (and its Long Island equivalent), so the Shopping feed and the metro pricing engine never drift apart.
3. **Auth moves server-side**: the edge function holds the OAuth2 credential; the browser never sees a Merchant Center access token (see B4 #5 for why today's implementation is a problem).
4. **Scaling to metro N** becomes: add the metro's ZIP set to the metro-config source of truth → generate one Merchant API `region` per zone from it → generate `regionalInventories` rows from that metro's price book → (only if a storefront + verified GBP exists there) optionally layer LIA/free local listings for that one location. None of that depends on a storefront except the last, optional step.

### B4. Current repo implementation review + gaps

Reviewed: `src/components/admin/GoogleShoppingManager.tsx`, `src/services/googleShopping/feedGenerator.ts`, `src/services/googleShopping/merchantCenter.ts`, `src/services/googleShopping/usTargeting.ts`, `src/services/googleShopping/index.ts`. No `google-shopping-feed` edge function exists in `supabase/functions/` (confirmed by directory listing) despite being referenced in project docs.

1. **On a sunsetting API, past the error-escalation date.** `merchantCenter.ts` calls `https://shoppingcontent.googleapis.com/content/v2.1/{merchantId}/products` (and `/products/batch`, `/productstatuses`) — the legacy Content API for Shopping. Per B3, that API is already past its Sept 1, 2026 error-escalation start and heading to blanket HTTP 410. This needs a Merchant API rewrite, not a URL edit — resource paths, request bodies (e.g., `ProductInput` vs. `Product`), and batch semantics all differ.
2. **No metro/zone pricing model in the feed at all.** `feedGenerator.ts`'s `convertToGoogleShoppingProduct()` computes exactly **one** national price per product, pinned to a hardcoded 3-ton quantity (`calculateProductExponentialPrice(product, 3)`), and one flat `shipping` string (`'US:Continental US:0 USD:1-3 business days'`) for the entire continental US. There is no concept of metro, zone, or per-ZIP price anywhere in this file — it directly contradicts "price by delivery zone" and needs the `regions`/`regionalInventories` layer from B3 before Google Shopping can show correct DFW-zone or LI-zone prices.
3. **No region-aware API calls anywhere in the service.** `merchantCenter.ts` implements only `uploadProduct`, `batchUploadProducts`, `getProductStatus`, `getAllProductStatuses`, `deleteProduct` against the flat products endpoint — none of `regions`, `regionalInventories`, or local-inventory endpoints exist in the codebase today.
4. **Feed generation runs entirely client-side.** `GoogleShoppingManager.tsx` calls `feedGenerator.generateFeed()` / `generateXMLFeed()` directly in the browser (admin UI), and `merchantAPI.batchUploadProducts()` is invoked from the same client component — there is no server-side feed pipeline, which is also why:
5. **The Merchant Center OAuth access token lives in the browser.** `GoogleShoppingManager.tsx` stores `config.accessToken` in React state, exposed via a plain `<Textarea>` field in the admin "Configuration" tab, and `merchantCenter.ts` sends `Authorization: Bearer ${accessToken}` from client-side `fetch()` calls. Anyone with devtools access to that admin page can read a live Merchant Center credential. This should move behind the edge function proposed in B3.
6. **No `unit_pricing_measure`, `min_order_quantity`, or `bulk_price` fields emitted.** The 3-ton minimum is only implicit in the pre-multiplied `price`; Google's purpose-built minimum-order attributes (B2) are unused.
7. **`google_product_category` uses old numeric IDs (`1279`, `1278`).** Not independently verified as broken in this pass — worth a one-time check against Google's current product taxonomy file, flagged as a to-do rather than a confirmed defect.
8. **`usTargeting.ts`'s allow-list is a national filter, not a metro/zone filter.** Its continental-US ZIP-range validation is sound for `excluded_destination` (correctly excludes AK/HI/territories), but it has no concept of DFW or Long Island zones and cannot drive `regions` definitions on its own — the metro ZIP sets already built by METRO-CORE (`src/metro/config/data/dfwZips.ts`) should be the single source of truth both the metro pricing engine and the Shopping feed read from, rather than adding a second, parallel zone definition here.
9. **No Local Inventory Ads / GBP linkage code exists.** No `store_code`, no Business Profile API calls, nothing local-inventory-shaped anywhere in the repo — building the ELM pilot's LIA path (B5) is a from-scratch integration, not an extension of existing code.

### B5. Step-by-step setup: DFW, Long Island, and scaling to metro N

**DFW (partner yards, no MGG storefront).**
1. Fix the sunset issue first, independent of metro strategy: migrate `merchantCenter.ts` off Content API v2.1 onto Merchant API before more of it 410s (B3/B4 #1) — this blocks all Google Shopping work regardless of metro plans.
2. Move the integration server-side: build the `google-shopping-feed` edge function referenced in docs but missing from the repo; hold the OAuth credential there, not in `GoogleShoppingManager.tsx` (B4 #4–5).
3. Define one Merchant API `region` per DFW pricing zone, generated from the ZIP sets already in `src/metro/config/data/dfwZips.ts` — reuse that file, don't fork a second zone definition.
4. For each product × DFW zone, push a `regionalInventories` entry carrying that zone's delivery-inclusive price (source: `src/metro/lib/pricing.ts` / the metro price book), leaving the base `Product`/`ProductInput` price as a metro-wide "starting at" reference.
5. Encode the minimum order via `min_order_quantity`/`bulk_price.min_quantity` (B2) instead of only pre-multiplying it into `price`.
6. **Skip LIA/free local listings for the MGG-DFW brand itself** — no MGG storefront in DFW means no eligibility (B1). Revisit only if a specific DFW partner yard wants to run LIA under its **own** verified GBP and Merchant Center account — a reseller/broker relationship, not an "MGG local listing."
7. **Do** add each willing DFW partner yard's own GBP "Products" tab entries where a GBP exists — no ad spend, and it's the entity Google actually associates with a physical DFW location.
8. Layer DFW into the AI-ads test plan (A4) once steps 1–5 are live, so paid-ad landing pages reflect the same zone prices Google Shopping is now showing.

**Long Island (ELM has a storefront + verified GBP).**
1. Same Content-API-sunset fix and edge-function move apply first — shared infrastructure, not LI-specific.
2. Because ELM has a real storefront and verified GBP, LI is the metro where **LIA + free local listings are actually eligible** — but run that listing out of **ELM's own** Merchant Center account/GBP (matched by `store_code`), not as a separate "MyGravelGuy" listing pointing at someone else's building (B1).
3. In parallel, run the regional/non-local track (steps 3–5 from the DFW plan) for LI's online, no-storefront-required, price-by-zone listings — so LI ends up with both an "buy from Eastern LM's store" local presence and a "buy from MyGravelGuy online, delivered to your ZIP" regional presence.
4. Add ELM's material catalog to its GBP Products tab (B1) — cheapest possible win since ELM's GBP already exists and is verified.

**Scaling to metro N.**
1. Add the metro's ZIP set to the same metro-config source of truth pattern (`src/metro/config/data/*.ts`) used by DFW and LI.
2. Generate one Merchant API `region` per zone in that metro from that ZIP set; generate `regionalInventories` rows from that metro's price book — by the time DFW's build establishes the pattern, this becomes a function of `metro` rather than DFW-specific code.
3. Only add LIA/free local listings for a metro if a storefront + verified GBP exists there (partner yard or sister brand) — otherwise the metro runs on the regional (non-local) track alone, same as DFW.
4. Layer the metro into the AI-ads test plan (A4) once its metro landing pages exist, reusing the same UTM/KPI framework validated in DFW.

---

## Appendix — sources log

**OpenAI / ChatGPT (Part A)** — direct `openai.com` fetches returned HTTP 403 in this session; facts sourced via search-result summaries of these pages plus secondary corroboration:
- https://openai.com/index/testing-ads-in-chatgpt/ (ads pilot announcement — fetch blocked, summarized via search)
- https://openai.com/policies/ad-policies/ (ad category policy — fetch blocked, summarized via search)
- https://developers.openai.com/ads/api-overview (Advertiser API — fetched directly)
- https://developers.openai.com/ads/api-quickstart
- https://developers.openai.com/ads/api-reference/campaigns
- https://developers.openai.com/commerce/guides/key-concepts (ACP key concepts — fetched directly)
- https://developers.openai.com/commerce/product-feeds/spec (product feed schema)
- https://developers.openai.com/commerce/specs (feed specs index)
- https://stripe.com/newsroom/news/stripe-openai-instant-checkout (Stripe/OpenAI ACP announcement)
- https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce
- https://chatgpt.com/en-en/merchants/ (merchant application)
- Secondary corroboration used for pilot dates, minimums, CPC guidance, geo-targeting grain, and the reported March-2026 Instant Checkout pullback: CNBC (2026-03-20), tech-insider.org, the-decoder.com, ppc.land, searchengineland.com, freeagency.ai, ready2geo.com, digiday.com, seroundtable.com, naridon.com — treat as directional, not first-party-confirmed, per inline flags.

**Google Ads / AI Overviews / AI Mode (Part A3)**
- https://support.google.com/google-ads/answer/16297775 (About ads and AI Overviews — fetched directly)
- https://blog.google/products/ads-commerce/ai-creativity-google-marketing-live/
- https://blog.google/products/ads-commerce/google-lens-ai-overviews-ads-marketers/
- https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/
- https://support.google.com/google-ads/answer/17091277 (AI Max for Shopping, beta)

**Microsoft Copilot ads (Part A3)** — no first-party `about.ads.microsoft.com` post retrieved directly; summarized via secondary sources: stackmatix.com, spaceads.agency, gruenberg-digital.de, 1digitalagency.com.

**Perplexity (Part A3)** — summarized via secondary sources: digiday.com, dataslayer.ai, alhena.ai, webfx.com, almcorp.com (original Adobe Analytics 693% figure cited via these, not fetched from Adobe directly).

**Google Merchant Center / Merchant API (Part B)** — all fetched directly unless noted:
- https://developers.google.com/merchant/api/guides/compatibility/overview (Content API → Merchant API migration)
- https://developers.google.com/merchant/api/guides/accounts/regions (regions — fetched directly)
- https://developers.google.com/merchant/api/guides/inventories/add-regional-inventory (fetched directly)
- https://developers.google.com/merchant/api/guides/inventories/update-regional-inventory
- https://developers.google.com/merchant/api/reference/rest/inventories_v1/accounts.products.regionalInventories
- https://developers.google.com/merchant/api/guides/products/overview (products/ProductInput vs Product — fetched directly)
- https://support.google.com/merchants/answer/3271956 (LIA and free local listings policies — summarized via search)
- https://support.google.com/merchants/answer/13869896 (store_code)
- https://support.google.com/merchants/answer/14819809 (local inventory data spec)
- https://support.google.com/google-ads/answer/16241616 (implement LIA and free local listings)
- https://support.google.com/merchants/answer/9698880 / /answer/16782229 / /answer/16786149 / /answer/16785141 (regional availability and pricing — summarized via search)
- https://support.google.com/merchants/answer/6324455 (unit_pricing_measure — fetched directly)
- https://support.google.com/merchants/answer/6324490 (unit_pricing_base_measure)
- https://support.google.com/merchants/answer/15077041 / /answer/15072435 (order-quantity range errors, referencing min_order_quantity/max_order_quantity/bulk_price)
- https://support.google.com/merchants/answer/16989009 / /answer/14955659 (minimum_order_value)
- https://support.google.com/merchants/answer/9773429 / /answer/12159029 (price/landing-page consistency policy)
- https://support.google.com/merchants/answer/12577710 (account-wide shipping settings)
- https://support.google.com/merchants/answer/15406457 (set up regions)
- https://support.google.com/google-ads/answer/12971048 / /answer/13717300 (Performance Max for store goals)
- Google Business Profile "Products" tab: summarized via secondary sources (digitalapplied.com, replyonthefly.com, digitalxacademy.com, flento.io) — no first-party `business.google.com` help page fetched directly in this pass.

**Repo code reviewed directly** (read in full, not web sources):
- `src/components/admin/GoogleShoppingManager.tsx`
- `src/services/googleShopping/feedGenerator.ts`
- `src/services/googleShopping/merchantCenter.ts`
- `src/services/googleShopping/usTargeting.ts`
- `src/services/googleShopping/index.ts`
- `supabase/functions/` (directory listing — confirmed no `google-shopping-feed` function exists)
- `docs/metro/HANDOFF-LOG.md` (project context: DFW ZIP config, ELM figures, decisions log)
