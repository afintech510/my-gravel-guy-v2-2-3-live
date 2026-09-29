# DFW 90-Day Go-to-Market Plan v2 — MyGravelGuy

_Status: COMPLETE (v2, post-GBP). Research-only document; read-only on all repo code except this file. Author: B-GTM-REFRESH agent. Current as of 2026-09-28._

**This is the current, authoritative DFW 90-day go-to-market plan** — it supersedes the budget/calendar/top-5-tactics sections of `docs/metro/research/dfw-low-cost-gtm-and-tiktok.md` and the merged plan in `docs/metro/research/external-llm-synthesis-2.md` §5b, both of which are kept for their underlying research (TikTok mechanics, partnership detail, competitor sourcing) but are marked superseded inline. Built from those two docs plus `docs/metro/research/ai-ads-and-google-shopping.md` (Part A/B), `docs/metro/research/aeo-plan.md`, and `docs/metro/METRO-STRATEGY.md`, minus every GBP/map-pack/GBP-dependent-LSA tactic per the owner decision below.

**How to read this document**
- **[FACT — url]** — verifiable, sourced to a cited URL, checked this pass via WebSearch.
- **[FACT — carried]** — verified in a prior research pass (cited doc), not re-verified here.
- **[INFERENCE]** — judgment applied to MGG's specific DFW launch. Not a fact, not guaranteed.
- **[NEEDS_REAL_NUMBER]** — a figure that matters but could not be verified from a citable source; never invented.

---

## 0. Owner decision this plan implements (2026-09-28)

**No Google Business Profile / Google Maps listing for DFW.** MGG has no DFW physical presence, and GBP's own rules forbid virtual-office listings. Every GBP and map-pack tactic (GBP setup, service-area GBP, GBP primary category, GBP posts/reviews/photos velocity, GBP-dependent Local Services Ads, "rank in the map pack," Local Inventory Ads under the MGG-DFW brand) is removed from the DFW plan. Replacements, detailed in §4 below: Google Shopping regional listings, Google Search + ChatGPT ads with ZIP targeting, AEO/organic content, partner-yard co-marketing, Nextdoor and Facebook, pile signs and truck QR codes, and permit/Certificate-of-Occupancy-based subdivision targeting.

- A partner yard's **own** GBP may mention MGG ordering (e.g. "order delivery online via MyGravelGuy") — only with the partner's **explicit consent** and within Google's rules. It is the partner's real, verified listing at the partner's real address, never an MGG-branded DFW listing.
- **Reviews** for DFW are collected on-site (first-party) and on Facebook/Nextdoor/BBB-style platforms that don't require a storefront — not via a DFW GBP. See §4.9 for the review-schema-eligibility nuance (verified this pass).
- **Long Island/ELM is unaffected** — ELM has a real yard with its own GBP; LI's GBP/Local Inventory Ads mentions elsewhere in the docs stay as-is, scoped to ELM's real storefront.
- **Twilio 10DLC is already registered and approved — done ✓.** No SMS-tactic-blocking action item remains; every "register 10DLC" line in prior docs is historical.
- **Metro Stripe checkout is in progress (2026-09-28).** Live-site Stripe checkout already works today; metro-specific (zone-priced, truck-minimum) checkout is being built now, not yet shipped. This plan gates paid-traffic launch on it (§1).

---

## 1. Assumptions

**Order economics — use the real numbers, not the $85 error.** `docs/metro/research/external-llm-synthesis-2.md` §2/§4 flagged that two of four external-LLM 90-day plans built their entire CAC/ROI math on an assumed **$85 AOV**, which is wrong by roughly 12–17× against MGG's actual order data:

| Figure | Value | Source |
|---|---|---|
| MGG nationwide AOV | **$1,473** | `docs/01-business-overview.md` (Mar 2026 snapshot), also cited in `docs/metro/METRO-STRATEGY.md` §0 |
| MGG Texas orders to date | 6 orders, **$1,055 avg** | `docs/metro/METRO-STRATEGY.md` §0 |
| Typical order size (context given to every research pass) | 5–20 cubic yards / 5–25 tons, **$300–$1,500** | `docs/metro/prompts/external-llm-prompts.md` context block |

**Use $300–$1,500 as the planning range, ~$1,000+ as the realistic AOV once DFW is live** — not $85. Every CAC/kill-rule number below is sized against this, not the erroneous low figure two external engines used.

**DFW 10-unit delivered prices (from `docs/metro/research/dfw-pricing-v2.md`, the price-book-v2 in-progress doc — confirmed-target figures, not yet `priceBookConfirmed`):**

| Material | 10-unit delivered price |
|---|---|
| Pea gravel (10 ton) | **$900** |
| #57 crushed limestone (10 ton) | **$825** |
| Flex base / crusher run (10 ton) | **$635** |
| Hardwood mulch (10 yd) | **$575** |
| Sandy loam / topsoil (10 yd) | **$620** |

These sit inside the $300–$1,500 range above and are the numbers to use in any ad copy, landing-page price, or AEO content — **never the placeholder-era or the $85 figure.**

**Launch gates — do not spend paid budget until all three are true:**
1. `src/metro/config/dallasFortWorth.ts`'s `priceBookConfirmed` flag is `true` (currently `false` — confirmed by reading the file this pass. Header comment: *"Do not surface priceBookConfirmed = true, and do not treat any number here as real"* until it flips).
2. At least one DFW partner yard is signed (price sheet + capacity commitment — `docs/metro/METRO-STRATEGY.md` §2A/§8).
3. Metro Stripe checkout is live (in progress as of 2026-09-28 — §0 above).

Free/near-zero-cost tactics (AEO content foundations, robots.txt/IndexNow, Merchant API regional-listing plumbing, partnership outreach, permit-data pulls) can and should start before all three gates clear — see the Week 1–2 phase in §5. **Paid spend (Search, ChatGPT ads, Nextdoor Local Deals, TikTok Spark Ads) should not go live until the gates clear**, so ad traffic never lands on a page with a placeholder price or a checkout that doesn't work yet.

**Goal, unchanged from v1: first 100 paid DFW orders, <$5,000 total marketing spend.**

---

## 2. What changed vs v1

| # | v1 item (removed) | Why | v2 replacement |
|---|---|---|---|
| 1 | Google Business Profile, service-area business (`dfw-low-cost-gtm-and-tiktok.md` §2b.1, ranked #1 tactic) | Owner decision 2026-09-28: no DFW physical presence; GBP forbids virtual offices | Google Shopping regional listings (§4.1) + AEO/organic content (§4.4) fill the "high-intent, near-zero-cost" slot |
| 2 | Google Local Services Ads, $800 budget reserve (`dfw-low-cost-gtm-and-tiktok.md` §2b.12, §3d) | LSA's "Google Guaranteed" badge runs on a screened local-business profile in the same family as GBP; moot once no DFW GBP exists. Confirmed this pass: delivery/bulk-materials-supply is still not a documented LSA-eligible category as of 2026 — lawn care/landscaping is eligible, general delivery is not **[FACT — primelsa.ai, bluegridmedia.com, 2026]** | $800 reallocated to Search ads ($400) + ChatGPT ads test ($300) + Nextdoor ($100) — see §3 |
| 3 | GBP review-generation flow (v1 §2b.7: "review link to GBP") | No DFW GBP to link to | On-site (first-party) review collection + Facebook/Nextdoor/BBB-style platforms (§4.9) |
| 4 | GBP Products-tab entries under the MGG-DFW brand | Same as #1 | Partner yards' **own** GBP Products tab, with the partner's consent if MGG is named (§4.5) |
| 5 | "Register A2P 10DLC" as a Week-1 to-do (appeared in 3 of 4 external P6 plans and `external-llm-synthesis-2.md` §5a item 1) | Already done | Removed from every checklist below; noted done ✓ in §0 |
| 6 | "Stripe checkout for metro orders" as an unscheduled future item | Now has a real status | Marked **in progress (2026-09-28)** and used as an explicit launch gate (§1) |
| 7 | (New, not a removal) "Target fast-growing suburbs" generic framing | Two external P6 engines (DeepSeek, unlabeled-ChatGPT-style) independently proposed permit/CO-based targeting as sharper than city-growth-rate targeting | Named DFW permit-data sources + a concrete ZIP/subdivision targeting method (§4.7) |

---

## 3. $5,000 budget split (reallocated)

| Bucket | Amount | Rationale |
|---|---|---|
| TikTok paid test (Spark Ads, hard-capped, organic-first) | $1,000 | Unchanged from v1 (`dfw-low-cost-gtm-and-tiktok.md` §1d) — ceiling, not a target; spend less if the 3-week organic filter shows no signal. |
| Nextdoor Local Deals (post-delivery neighborhoods) | $700 | +$100 vs v1's $600, funded by the LSA reallocation — Nextdoor is one of the two best-demographic-fit channels for a $300–$1,500 homeowner purchase (`dfw-low-cost-gtm-and-tiktok.md` §1c). |
| Print: pile signs, truck magnets, door hangers (subdivision-targeted) | $700 | Unchanged from v1; see §4.6–4.7 for exact specs and targeting. |
| Facebook/Instagram paid boost | $500 | Unchanged — small paid amplification once organic Facebook/Marketplace activity shows signal. |
| Google Search ads (ZIP-targeted, DFW ZIP set) | $400 | **New — replaces part of the removed $800 LSA reserve.** Standard Search campaigns aren't GBP-dependent; target `src/metro/config/data/dfwZips.ts`'s ZIP set directly. |
| ChatGPT ads test (ZIP-targeted) | $300 | **New — replaces part of the removed $800 LSA reserve.** Self-serve, no minimum spend, ZIP-level geo targeting, landscaping/home-improvement is a permitted vertical [FACT — carried, `ai-ads-and-google-shopping.md` A1/A4]. |
| PR/content production (photography, minor video gear) | $400 | Unchanged — makes the SMS-photo-of-drop and TikTok/AEO content look professional from day one. |
| Reserve / contingency | $1,000 | Unchanged — deployed toward whichever channel's measured cost-per-order is winning by week 8–10. |
| **Total** | **$5,000** | Google Shopping regional listings (§4.1) run at **$0** — the Merchant API sync is already built (`docs/metro/research/merchant-api-implementation.md`) — so no line item is needed for it; it's the single largest "free" lever in this plan. |

---

## 4. Tactic detail sheets

Each sheet: why · first steps · KPI · kill/scale rule.

### 4.1 Google Shopping regional listings (free, replaces the GBP-driven "gravel delivery [suburb]" intercept)

**Why:** Google's `regions` + `regionalInventories` primitive is the sanctioned exception to "never vary price by location" and matches MGG's metro → zone → price model exactly [FACT — carried, `ai-ads-and-google-shopping.md` B3]. It surfaces MGG's real, zone-priced DFW SKUs in the Shopping tab, Search, Images, and Gemini — without needing any physical presence or GBP. The edge function (`google-merchant-sync`) and price-book export pipeline are **already built** on this branch (`docs/metro/research/merchant-api-implementation.md`) — this is a configuration/launch task, not new engineering.
**First steps:** (1) confirm `priceBookConfirmed = true` on `dallasFortWorth.ts` (§1 gate); (2) run the edge function in `dryRun:false` mode once a Google Merchant Center account + OAuth service account are provisioned; (3) verify each DFW zone's `regionalInventories` price matches the live storefront price exactly (Google spot-checks this and can disapprove mismatches).
**KPI:** Shopping-tab impressions/clicks (Merchant Center reporting), free-listing-attributed sessions in GA4.
**Kill/scale rule:** this is a $0 tactic with no meaningful downside — there's no "kill," only a launch-readiness gate (price book confirmed, feed live).

### 4.2 Google Search ads, ZIP-targeted

**Why:** Not GBP-dependent — standard Search campaigns can target by ZIP code directly, and MGG already has an active Google Ads account (`AW-8424526917`, per `docs/metro/METRO-STRATEGY.md` §11). This is the direct replacement for LSA's removed $800.
**First steps:** (1) build a Search campaign geo-targeted to the exact ZIP set in `src/metro/config/data/dfwZips.ts`; (2) ad copy naming real DFW delivered prices from §1's table (e.g. "#57 crushed limestone, delivered $825/10-ton — DFW"); (3) landing page = the DFW metro page, not the homepage.
**KPI:** cost per quote request (interim, pre-metro-checkout) or cost per paid order (once metro Stripe checkout ships), DFW landing-page conversion rate.
**Kill/scale rule:** pause any ad group with CPA > 2× the $50/order all-in target (per the $5,000/100-orders goal) after $150 spend with no conversions; scale a winning ad group in 25–40% budget increments.

### 4.3 ChatGPT ads, ZIP-targeted

**Why:** Self-serve since May 2026, no minimum spend, CPC bidding, ZIP-level geo targeting (finest grain available — no radius targeting), and "local services"/"household goods" is a permitted vertical [FACT — carried, `ai-ads-and-google-shopping.md` A1]. Genuinely new paid channel, not previously reachable at MGG's budget size before the self-serve launch.
**First steps:** (1) apply for Ads Manager access; (2) `chat_card` creative (3–50 char title, ≤100 char body naming delivery + speed, not a specific price since price is zone-dependent); (3) ZIP-target the same `dfwZips.ts` set; (4) land on the DFW metro page.
**KPI:** cost per quote/order via OpenAI's Conversions API (server-side) once metro checkout exists; UTM `utm_source=chatgpt&utm_medium=cpc&utm_campaign=dfw-launch`.
**Kill/scale rule:** pause if CPC exceeds the general-market planning range with zero landing-page engagement after ~$100 spend; this channel can be started/stopped with no spend commitment, so bias toward testing early and cheap.

### 4.4 AEO / organic content (Gravel Driveway Hub, metro + town pages)

**Why:** MGG currently appears in **zero of 20** live searches across the exact driveway-question set (`docs/metro/research/aeo-plan.md` §2) — this is the free, compounding, highest-leverage lever, and it's the one intercept that doesn't depend on any local-business profile at all.
**First steps:** ship the Wave-1 hub + spokes per `aeo-plan.md` §3.2/§4 Weeks 3–6 — cost overview, best gravel, calculator, depth guide, crusher-run-vs-#57, DFW-specific delivered pricing (gated on `priceBookConfirmed`), served-town lookup.
**KPI:** the 50-prompt weekly AI-visibility panel (`aeo-plan.md` §3.8); GSC impressions/clicks on new metro/hub URLs.
**Kill/scale rule:** not a paid tactic — no kill rule; re-prioritize content topics based on which Wave-1 spokes earn citations first (`aeo-plan.md` §4 Weeks 11–13).

### 4.5 Partner-yard co-marketing

**Why:** Zero/near-zero marginal cost, highest intent-per-contact of any tactic evaluated (`dfw-low-cost-gtm-and-tiktok.md` §2a) — a landscaper or partner yard that already has recurring DFW gravel demand converts far more cheaply than a cold impression.
**First steps:** (1) build target lists — landscapers/pool builders/fence companies (`dfw-low-cost-gtm-and-tiktok.md` §2b.2), HOA/builder punch-list teams (§2b.3); (2) offer a wholesale/reseller rate or referral fee with a unique promo code/SMS keyword per partner; (3) **ask each signed partner, separately and explicitly, for consent** to mention MyGravelGuy ordering on their own GBP/website/socials — never assume consent, and never create an MGG-branded listing under a partner's identity.
**KPI:** partner-referred orders (via unique promo code), number of signed partners with an active consent-based MGG mention.
**Kill/scale rule:** not a paid tactic — a partnership that produces zero referred orders after 6 weeks of active outreach gets deprioritized in favor of a fresh target list.

### 4.6 Pile signs + truck QR codes

**Why:** Piles sit in driveways for days; neighbors ask. Near-zero cost, compounds per delivery (`docs/metro/METRO-STRATEGY.md` §4 idea #1). Verified costs from v1: yard signs **$0.83–$7 each**, QR-coded signs from **~$34**, reported QR scan rates **8–12%** (up from ~2% pre-2020), signs near a recent job site convert **4× better** than cold placements [FACT — carried, `dfw-low-cost-gtm-and-tiktok.md` §2b.8].
**Spec:**
- **Size:** standard 18"×24" corrugated-plastic yard sign (readable from the street, fits a single wire H-stake).
- **Copy:** "Delivered by MyGravelGuy — order yours in 60 seconds" + a prominent QR code + the SMS keyword as a fallback for anyone who can't scan.
- **QR destination:** `mygravelguy.com/dallas-fort-worth?utm_source=pile_sign&utm_medium=offline&utm_campaign=<subdivision>` — `<subdivision>` swapped per print batch (e.g. `celina`, `princeton`, `prosper`) so cost-per-order is trackable down to the subdivision.
- **Truck QR:** a magnetic panel on the delivery truck/trailer, same QR pattern, `utm_campaign=truck`.
**Permission:** ask every delivered customer for explicit permission before staking a sign in their yard; offer the existing $25–$50 stay-up credit (`dfw-low-cost-gtm-and-tiktok.md` §2b.8) in exchange for leaving it up 1–2 weeks. Never place a sign without the homeowner's consent — this is private property, not a right-of-way placement.
**HOA/city sign-rule caveat [FACT, verified this pass]:** a pile sign staked *inside* a customer's own yard with their permission is a private-property sign, not a "bandit sign," and is a different legal category from the roadside/right-of-way signs Texas HB 3611 (effective 2026-09-01) targets. HB 3611 imposes tiered fines up to **$5,000** for signs placed in public rights-of-way (road medians, sidewalk strips, utility easements) — Dallas alone removed **13,000** such signs in the prior year, Fort Worth **1,100** in a single month [FACT — dallasexpress.com, legiscan.com/TX/supplement/HB3611, nbcdfw.com]. **Do not place any sign in a road median, utility strip, or public right-of-way** — yard-only placement with homeowner consent avoids this exposure entirely. Separately, many DFW HOAs have their own sign-placement covenants (even on private property) — check the specific subdivision's HOA rules before printing a batch for that subdivision, since an HOA violation is a different (civil, covenant-based) risk than the state bandit-sign statute.
**KPI:** QR scans by `utm_campaign` (subdivision), cost per order attributed via the SMS-keyword/promo-code backbone.
**Kill/scale rule:** a subdivision batch with <2% scan-to-visit conversion after 90 days of live signs gets deprioritized for the next print run in favor of higher-performing subdivisions.

### 4.7 Permit / Certificate-of-Occupancy-based subdivision targeting

**Why:** Sharper than "target fast-growing cities" — permit/CO data identifies *actively-building* lots and freshly-occupied new homes specifically, which is exactly the mud-pit/fresh-landscaping-need window this plan's door-hanger and pile-sign spend should hit. Two of four external P6 engines (DeepSeek, unlabeled-ChatGPT-style) independently proposed this over city-growth-rate targeting alone (`external-llm-synthesis-2.md` §2 P6 "genuinely new tactics" #4).
**Named DFW data sources [FACT, verified this pass]:**
- **Dallas:** Dallas OpenData's Building Permits dataset, `dallasopendata.com/Services/Building-Permits/e7gq-4sah` — queryable/exportable (OData/CSV), city-wide permit records [FACT — dallasopendata.com].
- **Fort Worth:** Fort Worth Open Data, `data.fortworthtexas.gov` — Development Permits datacard and dashboard views; also a direct residential-permitting info page at `fortworthtexas.gov/departments/development-services/permits/residential-information` [FACT — data.fortworthtexas.gov].
- **Celina:** city permit/CO pages at `celina-tx.gov/1982/Residential-Permits` and `celina-tx.gov/920/Building-Permits-and-Inspections`; Celina requires a Certificate of Occupancy within a 180-day active-permit window [FACT — celina-tx.gov].
- **Princeton:** permits tracked through **EnerGov**, a self-service online portal (`princetontx.gov/604/Permitting`), plus monthly Building & Occupancy Reports listing permits issued and COs issued (`princetontx.gov/176/Monthly-Building-Occupancy-Reports`) [FACT — princetontx.gov].
- **Prosper:** Certificate of Occupancy permit records published on the city site (e.g. `prospertx.gov/Archive/ViewFile/Item/696`-style monthly CO lists) [FACT — prosper Tex.gov].
- **Frisco, McKinney, Forney, Anna:** not individually verified this pass beyond the general finding that DFW-metroplex cities commonly run their own GIS/open-data or Accela/EnerGov-style permit portals — **[NEEDS_REAL_NUMBER: confirm each city's specific portal before the Week-1 pull]**; check `<city>.gov` "permits" or "development services" first, then the county appraisal district's new-construction records as a fallback.
- Regional/aggregated alternative if a per-city pull is too slow: commercial building-permit databases (e.g. BuildZoom-style lookup tools) that aggregate multiple Texas city permit feeds — useful for a first pass, but verify against the city's own portal before committing print spend to a specific address list.
**First steps:** (1) pull the current month's new-residential-permit and CO list for each priority suburb (Celina, Princeton, Prosper, Forney, Anna, Frisco, McKinney); (2) geocode to ZIP + subdivision name; (3) cross-reference against `dfwZips.ts`'s served ZIP set; (4) feed the resulting subdivision list into both the pile-sign/door-hanger print run (§4.6) and the Search/ChatGPT ads ZIP targeting (§4.2/4.3) — a subdivision with active permits this month is a stronger signal than a city's overall growth rate.
**KPI:** door-hanger/pile-sign response rate by subdivision (via the UTM convention in §4.6), cross-checked against permit-pull recency (freshly-permitted subdivisions should outperform older ones).
**Kill/scale rule:** re-pull permit data monthly; drop a subdivision from the active target list once its permit volume falls off (construction wave has passed) and add newly-active ones.

### 4.8 Nextdoor + Facebook

**Why:** Both are the closest demographic fit for the actual $300–$1,500 buyer — Facebook reaches 80% of the 30–49 age band and 57% of 65+; Nextdoor's user base skews homeowner by platform design [FACT — carried, `dfw-low-cost-gtm-and-tiktok.md` §1c, sourced to Pew Research 2025].
**Nextdoor — verified caveat this pass [FACT]:** Nextdoor Business Pages generally require a **verifiable physical address** to complete verification, and online-only businesses without a physical location "typically see limited results" on the platform [FACT — broadly.com/blog/how-to-create-a-nextdoor-business-page-for-your-service-area-business, business.nextdoor.com]. MGG has no DFW physical address, so **a full, verified MGG-DFW Nextdoor Business Page may not be achievable the same way a GBP-style local listing wouldn't be** — this is a real, not cosmetic, constraint. **[NEEDS_REAL_NUMBER: whether Nextdoor's paid Local Deals/ad products specifically require the same physical-address verification as the free organic Business Page — not confirmed either way by this pass; verify directly with Nextdoor's business support before committing the $700 Nextdoor line in §3.]** Until confirmed, treat Nextdoor spend as contingent on that verification, and lean on partner-yard co-marketing (§4.5) — a partner yard's own, address-backed Nextdoor presence — as the fallback if MGG's own page can't be fully verified.
**Facebook:** no comparable address constraint found; a Marketplace listing, city-specific Facebook groups (per each group's self-promotion rules), and a standard Business Page are all viable without a physical DFW location.
**First steps:** (1) attempt Nextdoor Business Page verification early (Week 1–2) to resolve the open question above before budgeting further; (2) stand up the Facebook Business Page + Marketplace listings per priority suburb in parallel; (3) once a real DFW delivery has happened in a neighborhood, target that neighborhood specifically (Nextdoor Local Deal or a small Facebook boost).
**KPI:** cost per order by platform (UTM/promo-code attribution), Nextdoor verification outcome (go/no-go signal for the rest of the Nextdoor budget).
**Kill/scale rule:** if Nextdoor verification fails outright, reallocate its $700 (§3) to Facebook and print; otherwise deploy Local Deals only in neighborhoods with a completed delivery, same as v1.

### 4.9 Reviews (on-site + Facebook/Nextdoor/BBB — not GBP)

**Why:** Reviews compound the credibility of every other channel, but DFW has no GBP to route them to.
**Review-schema eligibility, verified this pass [FACT]:** Google stopped showing star-rating rich-snippet results for **"self-serving" reviews** — reviews an entity collects and displays about itself, using `LocalBusiness`/`Organization`-type structured data on its own site — as of a 2019 policy change; this is still the standing rule [FACT — developers.google.com/search/docs/appearance/structured-data/review-snippet; developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful; brightlocal.com/learn/review-schema]. **Practical implication for MGG:** on-site first-party reviews (real, visible on the page, tied to real orders) are still valuable for on-page trust/conversion and are the honest, storefront-independent alternative to a GBP review flow — but do **not** expect them to produce Google star rich-snippets at the `Organization`/`LocalBusiness` level the way a genuine third-party aggregator (or a GBP listing, which MGG isn't pursuing) can. Pair on-site collection with posting to Facebook, Nextdoor, and BBB-style platforms that aren't self-hosted and don't require a storefront, for the reach a self-hosted review can't provide alone.
**First steps:** (1) after the existing delivery-confirmation SMS (photo-of-drop), send a follow-up SMS 24–48h later asking for a review; (2) route the review to the on-site review collection flow first, then prompt for a second post to Facebook/Nextdoor/BBB; (3) route unhappy replies (simple 1–5 scale) to a private follow-up instead of a public ask.
**KPI:** on-site review count/rate per completed order, cross-platform (FB/Nextdoor/BBB) review count.
**Kill/scale rule:** not a paid tactic — if response rate to the review-ask SMS falls below industry-typical ranges after the first 20 completed orders, test send-timing/copy variants rather than abandoning the tactic.

### 4.10 TikTok — organic-first, $1,000 hard cap (unchanged verdict)

**Why:** No bulk-materials business (DFW or national) has a proven viral TikTok playbook; TikTok has the weakest buyer-demographic fit of any channel evaluated (~24% of US adults are daily users, collapsing sharply past age 50) [FACT — carried, `dfw-low-cost-gtm-and-tiktok.md` §1a–1c, sourced to Pew Research 2025]. This verdict is independently confirmed by 5 sources total across both research passes (`external-llm-synthesis-2.md` §5c) and is **unaffected by the GBP decision** — carried forward unchanged.
**First steps / KPI / kill-scale rule:** unchanged from `dfw-low-cost-gtm-and-tiktok.md` §1d — Phase 0 organic ($0, weeks 1–3) → Phase 1 Spark Ads (~$400) → Phase 2 Lead Gen (~$400) → Phase 3 reserve (~$200), inside the $1,000 total from §3. Kill rule (refined per `external-llm-synthesis-2.md` §5c): CTR <0.5% + poor watch-through + no landing-page engagement after ~$50–75 spend, or clicks-but-no-quote-activity after ~$100–150 — stop and reallocate to Nextdoor/print.

---

## 5. 13-week calendar

| Week | Phase | Item | Owner | Time | $ |
|---|---|---|---|---|---|
| 1 | Pre-launch | Finalize/sign DFW partner yard price sheet + capacity commitment (launch gate #2) | Owner/Ops | 5–8h | $0 |
| 1 | Pre-launch | Pull current-month permit/CO data for Celina, Princeton, Prosper, Forney, Anna (§4.7); confirm Frisco/McKinney portals | Ops | 4h | $0 |
| 1 | Pre-launch | Confirm Merchant API `google-merchant-sync` edge function is deployable; provision Google Merchant Center account + OAuth service account (§4.1) | Eng | 3–4h | $0 |
| 1 | Pre-launch | `public/robots.txt` explicit AI-crawler `Allow` block; create IndexNow key file (per `aeo-plan.md` §3.1) | Eng | 2h | $0 |
| 1 | Pre-launch | Attempt Nextdoor Business Page verification (§4.8) — resolve the address-requirement open question | Marketing | 2h | $0 |
| 1 | Pre-launch | SMS keyword + first-order coupon config in Twilio (10DLC already done ✓ — no registration step needed) | Ops | 2h | $0 |
| 2 | Pre-launch | Owner action: verify Google Search Console + Bing Webmaster Tools; enable IndexNow in Bing | Owner | 1h | $0 |
| 2 | Pre-launch | Ship build-time prerendered HTML for DFW metro routes (per `aeo-plan.md` §3.1.2) | Eng | 8–12h | $0 |
| 2 | Pre-launch | Design + order first pile-sign/QR and door-hanger print batch, targeted at Week 1's permit-pull subdivisions (§4.6/4.7) | Marketing | 3h | $700 (batch 1 of the §3 print budget) |
| 2 | Pre-launch | Draft partner-yard co-marketing agreements, including the explicit-consent GBP-mention ask (§4.5) | Owner | 3h | $0 |
| 2 | Pre-launch | Confirm metro Stripe checkout ship date with engineering (launch gate #3, §1) | Owner | 1h | $0 |
| 3 | Launch | Flip `priceBookConfirmed = true` once partner pricing is signed (launch gate #1) | Eng | 1h | $0 |
| 3 | Launch | Push live `regionalInventories` to Google Merchant Center (§4.1) | Eng | 2h | $0 |
| 3 | Launch | Ship Gravel Driveway Hub wave-1 content (non-DFW-price-gated rows, per `aeo-plan.md` §3.2) | Content | 12–16h | $0 |
| 3 | Launch | Begin landscaper/pool-builder/fence-company + HOA/builder partnership outreach (§4.5) | Owner/Ops | 6h/wk | $0 |
| 4 | Launch | Metro Stripe checkout live (launch gate #3 clears) — confirm before any paid spend below | Eng | — | $0 |
| 4 | Launch | Launch Google Search ads, ZIP-targeted (§4.2) | Marketing | 3h | $400 (full §3 line) |
| 4 | Launch | Launch ChatGPT ads test, ZIP-targeted (§4.3) | Marketing | 3h | $300 (full §3 line) |
| 4 | Launch | Ship DFW-specific AEO spokes now that pricing is confirmed (§4.4) | Content | 8h | $0 |
| 4 | Launch | Begin TikTok organic Phase 0 filming (§4.10) | Marketing | 6h | $0 |
| 5 | Launch | Distribute first pile-sign/door-hanger batch in permit-confirmed subdivisions (§4.6/4.7) | Ops | 8h | $0 (printed in wk 2) |
| 5 | Launch | Launch on-site + Facebook/Nextdoor/BBB review flow on every completed order (§4.9) | Ops | 2h setup | $0 |
| 5 | Launch | First DFW deliveries expected; begin review-ask SMS | Ops | ongoing | $0 |
| 6 | Launch | Evaluate Week 1–5 Search/ChatGPT ads CPA against the kill/scale rules (§4.2/4.3) | Marketing | 2h | — |
| 6 | Launch | Nextdoor Local Deals live in any neighborhood with a completed delivery, contingent on §4.8's verification outcome | Marketing | 2h | up to $700 (§3 line, deployed as deliveries land) |
| 6 | Launch | Facebook/Instagram paid boost begins if organic Marketplace/group activity shows signal | Marketing | 2h | up to $500 (§3 line) |
| 7 | Scale | TikTok Spark Ads Phase 1 (~$400) if Phase 0 organic shows a completion-rate winner (§4.10) | Marketing | 2h | $400 |
| 7 | Scale | Second pile-sign/door-hanger print batch, re-targeted using Week-7 permit-pull refresh (§4.7 kill/scale rule) | Ops | 3h | (within §3 print line) |
| 8 | Scale | Evaluate TikTok Phase 1 kill/scale rule; proceed to Lead Gen Phase 2 or reallocate to Nextdoor/print | Marketing | 2h | $400 (Phase 2) or reallocated |
| 8 | Scale | Begin Reddit genuine-participation phase (no promotion yet), first local PR pitch | Marketing | 4h/wk | $0 |
| 9 | Scale | Referral-credit program launches once ~15–20 completed DFW orders exist | Ops | 3h | $0 (credit cost against margin) |
| 9–10 | Scale | Second-wave partnership outreach to non-responders with a revised pitch | Owner/Ops | 4h/wk | $0 |
| 10 | Scale | Monthly permit-data refresh; retire subdivisions with fading permit volume, add newly-active ones (§4.7) | Ops | 3h | $0 |
| 11 | Scale | First full cost-per-order rollup by channel (UTM/promo-code/SMS-keyword attribution) | Marketing | 4h | — |
| 11 | Scale | PR/content production spend deployed if not yet used — photography/video gear (§3) | Marketing | — | $400 |
| 12 | Scale | Decide which 3–5 channels get the remaining reserve for the next 90-day cycle | Owner | 2h | up to $1,000 (§3 reserve) |
| 12 | Scale | AEO 50-prompt panel monthly rollup — compare week-1 baseline vs. week-12 citation share | Content | 2h | $0 |
| 13 | Scale | Consolidate: orders-to-date vs. $5,000 spend-to-date vs. 100-order goal; identify highest-performing Wave-1 AEO spokes and double down | Owner | 4h | — |

---

## 6. Measurement

- **UTM convention:** `utm_source=<channel>&utm_medium=<cpc|offline|organic>&utm_campaign=<dfw-launch|subdivision-name|truck>` — e.g. `utm_source=pile_sign&utm_medium=offline&utm_campaign=celina` (§4.6), `utm_source=chatgpt&utm_medium=cpc&utm_campaign=dfw-launch` (§4.3). Every offline tactic (signs, door hangers, PR) routes through this same convention plus the SMS keyword, so cost-per-order is comparable across paid, organic, and print.
- **GA4 channels:** configure a custom channel grouping to separate `google / cpc` (Search ads), `chatgpt / cpc`, `(direct)` from QR scans, `nextdoor`, `facebook`, `tiktok`, and an "AI assistants" bucket for `chat.openai.com`/`perplexity.ai`/`gemini.google.com` referral traffic (per `aeo-plan.md` §3.8) — so AEO-driven traffic is visible even though it's not a paid channel.
- **CAC target vs. AOV/gross margin:** the $5,000/100-orders goal implies an all-in CAC ceiling of **$50/order** — trivially affordable against a **$300–$1,500 AOV** (realistically ~$1,000+, per §1's corrected assumption). This is the number every kill/scale rule in §4 should be checked against, not the erroneous $85-AOV math two external engines used. **[NEEDS_REAL_NUMBER: real DFW gross margin per order — not established in this pass; once known, tighten the CAC ceiling to a percentage of margin rather than a flat $50, since $50 is a spend-cap artifact of the $5,000 budget, not a margin-derived target.]**
- **Cadence:** weekly channel-performance check-in against §3's budget lines; monthly permit-data refresh (§4.7); monthly AEO citation-panel rollup (§4.4, per `aeo-plan.md` §3.8).

---

## Appendix — sources verified this pass (2026-09-28)

- Google self-serving reviews / review-snippet policy: [Google Search Central — Review Snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/review-snippet); [Google Search Central Blog — Making Review Rich Results more helpful (2019)](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful); [BrightLocal — Can local businesses use review schema?](https://www.brightlocal.com/learn/review-schema/)
- Nextdoor business-page address requirements: [Broadly — How to create a Nextdoor Business Page for your service-area business](https://broadly.com/blog/how-to-create-a-nextdoor-business-page-for-your-service-area-business/); [Nextdoor for Business](https://business.nextdoor.com/en-us/getting-started/business-page)
- Texas bandit-sign law / HB 3611: [Dallas Express — Bandit Signs Beware: Texas Throws $5K Fines At Roadside Clutter](https://dallasexpress.com/state/bandit-signs-beware-texas-throws-5k-fines-at-roadside-clutter/); [LegiScan — Texas HB3611, 89th Legislature](https://legiscan.com/TX/supplement/HB3611/id/596236); [NBC 5 DFW — Fort Worth Cracking Down on Bandit Signs](https://www.nbcdfw.com/news/local/fort-worth-tackles-bandit-signs-issue/117104/); [NineBP — Are Bandit Signs Legal in Dallas?](https://www.ninebp.com/post/legalities-of-bandit-signs-in-dallas-you-need-to-know)
- DFW permit/CO data portals: [Dallas OpenData — Building Permits](https://www.dallasopendata.com/Services/Building-Permits/e7gq-4sah); [City of Fort Worth Open Data](https://data.fortworthtexas.gov/); [Fort Worth Residential Permitting](https://www.fortworthtexas.gov/departments/development-services/permits/residential-information); [Celina, TX — Residential Permits](https://www.celina-tx.gov/1982/Residential-Permits); [Celina, TX — Building Permits and Inspections](https://www.celina-tx.gov/920/Building-Permits-and-Inspections); [Princeton, TX — Permitting](https://princetontx.gov/604/Permitting); [Princeton, TX — Monthly Building & Occupancy Reports](https://princetontx.gov/176/Monthly-Building-Occupancy-Reports); [Prosper, TX — Certificate of Occupancy Permits](https://prospertx.gov/Archive/ViewFile/Item/696)
- Google Local Services Ads eligible categories (2026): [PrimeLSA — Google Local Services Ads Eligible Categories](https://www.primelsa.ai/post/what-industry-categories-can-advertise-on-google-local-services); [BlueGrid Media — Every Industry Eligible for Google LSA in 2026](https://bluegridmedia.com/every-industry-eligible-google-local-services-ads)
- Carried from prior research passes (not re-verified this pass, cited inline above): `docs/metro/research/dfw-low-cost-gtm-and-tiktok.md`, `docs/metro/research/ai-ads-and-google-shopping.md`, `docs/metro/research/aeo-plan.md`, `docs/metro/research/external-llm-synthesis-2.md`, `docs/metro/research/merchant-api-implementation.md`, `docs/metro/METRO-STRATEGY.md`, `docs/metro/research/dfw-pricing-v2.md`.

## Change log (this doc)
- 2026-09-28: Created by B-GTM-REFRESH agent per the 2026-09-28 owner decision (no DFW GBP/map-pack/GBP-dependent-LSA; 10DLC done; metro Stripe checkout in progress). Verified 6 new claims via WebSearch (Google self-serving review-schema rule, Nextdoor address requirement, Texas bandit-sign law/HB 3611, DFW/Celina/Princeton/Prosper permit portals, current LSA eligible-category list). Reallocated the $5,000 budget's removed $800 LSA reserve to Search ads ($400), ChatGPT ads ($300), and Nextdoor (+$100). Wrote the 13-week calendar, tactic sheets, and "what changed vs v1" table.
