# External-LLM Competitor Synthesis — DFW (Prompt P2, 4 Engines)

**Author:** COMPETITOR-SYNTHESIS agent. **Status:** COMPLETE (first pass), 2026-09-28.
**Inputs:** `prompt-responses.md` P2 answers (ChatGPT L1664-2433, DeepSeek L2434-2739, Gemini L2740-2852, Grok L2853-3234); P1 ChatGPT executive takeaway (L4-60); our own `docs/metro/research/competitive-analysis.md`, `dfw-competitor-catalog.md`, `dfw-low-cost-gtm-and-tiktok.md`, `data/dfw/competitors.csv`. Companion file: `data/dfw/competitors-merged.csv` (40 deduped rows, all sources).
**Convention:** every claim is tagged **[FACT — url]** (independently verified this pass via WebSearch/WebFetch), **[FACT — engine, unverified]** (an engine stated it as fact but this pass could not independently confirm or deny it), or **[INFERENCE]**. No invented numbers.

---

## 0. LLM reliability scorecard

This is the single most load-bearing section — it tells you how much to trust each engine's *specific factual claims* (not just its overall vibe) before using P2 for decisions.

| Engine | Confirmed this pass | Contradicted / needs correction | Unverifiable / low-confidence |
|---|---|---|---|
| **ChatGPT** | EarthMove: 26 materials **[FACT — earthmove.io/dallas-fort-worth]**, 50-mi radius **[FACT]**, same-day-if-ordered-before-noon **[FACT]**, real online checkout **[FACT]**. Hello Gravel: 3-ton minimum **[FACT]**, ZIP-based instant pricing **[FACT]**, ~1,754-1,792 reviews range **[FACT — BBB/search snippets]**. American Rock Supply: ZIP-regional delivered pricing on Dallas-area pages **[FACT]**. My Gravel Buddy: 1-ton/4-ton minimums **[FACT]**. | **Conflated two distinct real companies**: attributed Soil Depot's Plano address and 4,000-CY minimum to "Soil Direct" (soildirect.com) — these are two separate businesses; DeepSeek correctly kept them distinct (see §1 below). **Preston Hollow Mulchachos** was positioned as a peer "digital-first competitor" to Hello Gravel/EarthMove; it is actually a small student-run (Cistercian Prep School) seasonal side business with a Nextdoor page — real, but not a scaled threat at that tier. | EarthMove's claimed "MSA/NET-30 support, tonnage tickets, photo-on-drop" — plausible marketing copy but not independently confirmed on the fetched page (the page we fetched showed no contractor-account language at all). |
| **DeepSeek** | Living Earth: 100-mi delivery radius **[FACT]**, phone/quote-only, no online cart **[FACT]**. Soil Depot (soil-depot.com, correctly kept distinct from Soil Direct): Plano HQ, 4,000-CY minimum for common fill dirt **[FACT]**. Correctly flagged DFW Stone Supply's bait-and-switch/undelivered-order complaints (matches Birdeye's mixed 3.2-4.7 rating pattern). | Called Soil Building Systems "quote/phone" only with no online ordering; SBS actually has a live `/services/productdelivery` order page with an auto-calculated fuel surcharge **[FACT — soilbuildingsystems.com]** — Grok's "online + calculator" characterization was closer to correct here. | Individual Google-rating figures for smaller yards (Caballero 4.7/72, Chippers "not surfaced") were not independently re-verified this pass — plausible but not re-checked. |
| **Gemini** | Directionally correct that Living Earth/SBS/big-box require quote-driven ordering with friction (matches independently-confirmed pattern). | **No named competitor table at all** — unlike the other three engines, Gemini's answer skipped straight to a generic UX-bar/gaps/threats framework without ever naming Hello Gravel, EarthMove, Mulch Mound, or Gravel Monkey specifically, despite the prompt asking for a competitive landscape. Its "wholesale fulfillment partner" list includes **"Texas Landscape Material" (Mansfield)** and **"DFW Dirt & Aggregates" (Rockwall/Collin)** — neither returned any result in this pass's searches; treat both as unverified/likely-generic placeholder names, not confirmed businesses. | **The entire "Unit Economics & Margin Blueprint" table** (wholesale costs $18-32/unit, retail $42-68/unit, 52-58% gross margins, $207 net contribution/order) has **zero source citations** and reads as invented illustrative numbers, not researched figures — this is the clearest hallucination risk of the four engines and should not be used for MGG's actual pricing decisions. |
| **Grok** | Hello Gravel figures match other engines (4.9/~1,792). Gravel Monkey: confirmed real self-serve payment checkout with delivery-stage SMS updates **[FACT — reviews.io/scamadviser search snippets]** (contradicts ChatGPT's more conservative framing of Gravel Monkey elsewhere in our own research, but matches our own `competitors.csv` "instant-delivered-price" tag). Soil Building Systems "online order + calculator + auto fee" — **confirmed correct** against SBS's real productdelivery page (see DeepSeek row above). The large priced CSV dump (Aggregate Markets, DFW Materials, Denton Materials, Big City Crushed Concrete) traces to real municipal bid-tabulation PDFs and real Shopify-style product pages — these look like genuinely scraped/sourced numbers, not invented ones. | **"The Outdoor Company Company" (theoutdoorcompanycompany.com, Crowley TX)** returned **zero results** in an independent domain/business search — likely a hallucinated or garbled business name (possibly a duplicated-word artifact). Do not treat this as a real competitor or partner candidate. | Several small-yard Google ratings in the big comparison table (e.g. "Silver Creek ~3.7-4+") were given as ranges/approximations rather than exact figures — acknowledged by Grok itself as approximate, so lower-stakes than a false-precision claim. |

**Net read:** ChatGPT and Grok's *specific, checkable* claims (minimums, radii, review counts, URLs) held up well under verification — both are usable as primary sources with spot-checks. DeepSeek was the most careful about keeping similarly-named entities distinct (Soil Direct vs. Soil Depot) but understated one competitor's (SBS) digital maturity. Gemini is the outlier: it produced no verifiable named-competitor table and its most specific numbers (the margin blueprint) are unsourced and should be treated as illustrative fiction, not research. **Rule going forward: any Gemini dollar figure needs independent verification before use; ChatGPT/Grok/DeepSeek named-competitor claims are usable with the specific corrections noted above.**

---

## 1. Where the 4 engines agree / disagree

### Agreement (high-confidence, cross-engine + independently verified)
- **Hello Gravel is the UX benchmark and biggest single threat.** All four engines that named specific competitors (ChatGPT, DeepSeek, Grok; ours) put Hello Gravel at or near the top: ZIP → instant delivered price → date picker → checkout → SMS updates, 3-ton minimum, ~4.9★ across 1,700+ reviews, extensive city-page SEO, BBB A+. **[FACT, independently confirmed]**
- **The DFW market has three tiers**: (1) traditional phone/quote yards with real inventory and weak digital presence, (2) SEO-heavy digital brokers/marketplaces (Hello Gravel, EarthMove, My Gravel Buddy, American Rock Supply, Gravel Monkey, Mulch Mound) that have already built the "ZIP → instant price → date → pay" flow, (3) big-box (Home Depot/Lowe's) as a brand-trust default for the unshopped buyer. ChatGPT, DeepSeek, and Grok all converge on this structure independently.
- **"Dead-simple ordering" is table stakes, not a differentiator anymore.** ChatGPT explicitly says this ("you cannot enter with 'we're like Hello Gravel, but in Dallas'"); our own `competitive-analysis.md` §3.2 reaches the identical conclusion independently; Grok's UX-bar section (b) lists the same seven-step flow. This is the strongest cross-source consensus in the whole research set.
- **Phone-only/quote-based traditional yards are framed as fulfillment partners, not competitors**, by every engine that addressed the question (ChatGPT §10, DeepSeek §5, Gemini (d), Grok (d)) — Silver Creek Materials, Lowery Sand & Gravel, Select Sand & Gravel, Texas Sand & Gravel, Soil Building Systems, and Earth Haulers appear on **at least 3 of 4** engines' partner-candidate lists, which is a strong independent signal for the shortlist in §4.
- **Truck/delivery economics, not website UX, is the real risk.** ChatGPT's "Threats #4" (truck economics — a $400 order can look great and be terrible after material+truck+driver+fuel+deadhead+failed-delivery costs) and Gemini's "Trucking & Fuel Freight Inflation" threat make essentially the same point independently, without either citing the other.

### Disagreement / contradiction (resolved above where possible)
- **EarthMove's existence and scale**: named prominently and accurately by ChatGPT (both P1 and P2) but **completely absent** from DeepSeek, Gemini, and Grok's answers, despite being a real, verifiable, already-live DFW competitor **[FACT — earthmove.io/dallas-fort-worth]**. This is a coverage gap in 3 of 4 engines, not a ChatGPT hallucination — EarthMove is real and matches ChatGPT's specifics closely.
- **Soil Direct vs. Soil Depot**: ChatGPT conflated these two real, distinct companies (see scorecard). DeepSeek correctly treated them as separate. Gemini and Grok didn't name either specifically enough to judge.
- **SBS's online-ordering maturity**: DeepSeek says quote/phone-only; Grok says online + calculator + auto-fee. Independently verified: Grok is closer to correct — SBS has a real order-and-delivery page with an auto-calculated fuel surcharge.
- **Gravel Monkey's checkout completeness**: our own `competitors.csv` and Grok describe genuine self-serve payment + SMS-updates; ChatGPT P2's table is more conservative about Gravel Monkey generally (it doesn't rate Gravel Monkey highly enough to include it in its own top comparison table at all, an omission given it's a named naming-collision risk in our own `competitive-analysis.md` §3.4). Independently verified this pass: Gravel Monkey does have real online payment and proactive delivery-stage texts — closer to Grok's characterization.

---

## 2. Ordering-flow walkthrough — top 3 digital competitors

Landing → price → checkout, as far as observable without submitting real data or payment. Screenshots not taken (per scope); described from live-fetched pages, search snippets, and guide pages.

### Hello Gravel (hellogravel.com) — main app blocked to WebFetch (403); reconstructed from guide pages + search snippets
1. **Landing**: city/product page (e.g. `/locations/texas/fort-worth-76101/gravel/`) shows material photos and a ZIP-entry prompt.
2. **ZIP → price**: entering a ZIP surfaces an "all-in delivered price" per ton/yard for that material — no separate quote step. **[FACT — search snippet of hellogravel.com]**
3. **Quantity**: tonnage selector, with a length×width×depth calculator offered as an alternative if the customer doesn't know how much they need (10-15% overage guidance built in).
4. **Date**: a date picker appears at checkout; next-business-day delivery available if ordered before noon CST for an added fee; otherwise standard is 2+ business days.
5. **Checkout**: exact price shown before payment is taken — Hello Gravel's own stated selling point ("see the full price before you pay").
6. **Post-order**: SMS delivery communication; tailgate spreading available but "at the driver's discretion" (i.e., not guaranteed even if requested).
7. **Friction points found**: BBB complaints describe a quote that doubled between initial contact and order weeks later, a promised-morning delivery that didn't happen, and one no-show on the scheduled day **[FACT — bbb.org profile]** — i.e. the UX is polished but execution-after-purchase is where trust breaks, exactly as ChatGPT's P2 answer independently concluded.

### EarthMove (earthmove.io/dallas-fort-worth) — directly fetched
1. **Landing**: a dedicated DFW page stating "26 materials in stock," 50-mile radius, same-day delivery, and "Order online in minutes."
2. **Material + quantity**: priced per ton or per cubic yard depending on material; two materials carry explicit minimums (fill dirt 20 CY, flex base 10 CY) — others unspecified on the page.
3. **Price**: delivery fees start "from $175.00" — this reads as a per-load floor rather than a distance-graduated fee, though the page doesn't fully disambiguate.
4. **Checkout**: "Secure checkout" is advertised; login/signup exist in the nav, suggesting an account-based flow (closer to an e-commerce SaaS pattern than Hello Gravel's guest-friendly flow).
5. **Date/scheduling**: same-day is emphasized for orders placed before noon; no explicit date-picker UI could be confirmed from the fetched content (search results describe the value prop — "one quote delivered to the curb" — but not the literal scheduling widget).
6. **Friction points**: too new to have a public review base — this is the single biggest unknown about EarthMove; its UX claims are unverified in execution, only in stated capability.
7. **Positioning language**: "dispatched, not brokered" — explicitly claims to remove the broker layer that Hello Gravel/Gravel Monkey/My Gravel Buddy represent, matching real-load/real-ETA/real-dispatch language found in search snippets.

### My Gravel Buddy (mygravelbuddy.com/delivery/tx/fort-worth/) — directly fetched
1. **Landing**: prominent ZIP-entry box ("Delivery ZIP — Set your ZIP") with an "Update" button; materials priced by ton (stone/gravel) or yard (topsoil/mulch) update instantly once a ZIP is set. **[FACT — direct fetch]**
2. **Calculator**: length × width × depth fields → estimated cubic yards/tons, with a 10-15% compaction/waste note.
3. **Price display**: genuinely instant per-SKU pricing is shown on the page itself — this part matches the "instant delivered price" claim made by several engines.
4. **The gap**: there is **no self-serve payment checkout or date-picker widget** on this page — the actual next step is "Get a free quote" or "See my prices," which routes to a quote form or phone call; scheduling happens only after that quote is confirmed. **[FACT — direct fetch, contradicts the "full instant checkout" framing some sources apply to this company]**
5. **Minimums**: 1-ton bag-drop minimum, 4-ton tandem-truck minimum, confirmed directly on the page.
6. **Speed**: same-day if confirmed by 11am, else 24-48h; Saturday delivery +$50-100.
7. **Friction points**: the ZIP-instant-pricing display creates an expectation of a fully self-serve checkout that the actual flow doesn't deliver — a real, observable "promise vs. delivery" gap in the UX itself, distinct from Hello Gravel's after-the-sale execution gap.

**Read across all three:** Hello Gravel is the only one of the three with a confirmed full self-serve payment+date-picker checkout AND a large public review base to judge post-purchase execution against. EarthMove has the most complete stated *capability* set but zero track record. My Gravel Buddy's front-end promises instant self-serve pricing but reverts to a quote-and-call model at the exact moment of conversion — a real, concrete UX gap MGG could close by actually finishing the checkout flow these competitors advertise but don't fully deliver.

---

## 3. Consolidated threat matrix

| Competitor | Threat level | Why |
|---|---|---|
| Hello Gravel | **High** | Full self-serve checkout + largest review base (1,700+) + BBB A+ + extensive city-page SEO already covering DFW. Real execution gaps exist (BBB complaints on schedule/quote reliability) — MGG's wedge is guaranteeing what Hello Gravel only promises. |
| EarthMove | **High** | Matches or exceeds Hello Gravel on stated capability (26 materials, 50-mi radius, same-day, secure checkout) and is explicitly positioning against the broker model MGG would also use ("dispatched, not brokered"). No track record yet — this is a window, not a moat. |
| My Gravel Buddy | **High** | Same-naming-pattern risk (My + Gravel + noun) plus a real, if incomplete, ZIP-instant-pricing front end and the largest confirmed programmatic-SEO footprint of the three (per `competitive-analysis.md` §3.4: 209-city river-rock network). Its confirmed checkout gap (quote-and-call, not true self-serve) is a specific, exploitable weakness. |
| Gravel Monkey (mygravelmonkey.com) | **High** | Third leg of the naming collision, confirmed real self-serve payment checkout + proactive SMS at every stage — closer to Hello Gravel's UX completeness than My Gravel Buddy's. Genuine brand-confusion and reputation-bleed risk given the name. |
| Mulch Mound | **High** | Highest SKU-per-city-page density found (3+ distinct ranking URLs per Dallas alone) — an SEO threat more than a UX threat; real cart + date picker; contaminated-soil complaints are a live quality-control wedge for MGG. |
| American Rock Supply | **Medium** | Confirmed real ZIP-regional delivered pricing on Dallas pages; "free delivery" framing suggests it's built for paid acquisition; less reviewed/less scaled than the top tier. |
| Soil Direct (soildirect.com) | **Medium** | Real, statewide (487 TX cities), but commercial/sitework-oriented positioning (address-based supplier comparison, not a single fixed consumer price) makes it a different segment, not a head-to-head UX competitor. |
| Home Depot / Lowe's | **Medium** | Not a UX threat (no instant bulk pricing, 24-72h vendor contact for real bulk), but the default "safe choice" for an unshopped buyer and a price anchor at the low end. |
| Gravelshop.com | **Medium** | Directory/marketplace layer across 32 states including TX — an SEO/aggregator threat for "gravel [city]" queries, not a direct fulfillment competitor. |
| Living Earth | **Medium (as price anchor, not UX threat)** | 100-mile radius, ~10 DFW yards, real scale and brand trust with contractors, but phone/quote-only — no online cart. Useful as a "what local cost really is" anchor, not a UX competitor. |
| Soil Depot (soil-depot.com) | **Low** | Real, but its 4,000-CY minimum puts it in a wholesale/job-site segment MGG isn't targeting. |
| Preston Hollow Mulchachos | **Low** | Real business, but a small seasonal student-run operation, not a scaled digital threat despite ChatGPT's framing. |
| Silver Creek Materials, Soil Building Systems, Lowery, Select S&G, Texas S&G, Big Tex Stone, Earth Haulers, Fort Worth Grass & Stone, Outdoor Warehouse Supply, JBS Express, SiteOne Stone Center, and the smaller quote-only yards | **Low (as competitors) / High (as partner candidates)** | Confirmed real, phone/quote-first, no meaningful self-serve digital ordering — exactly the "supply chain, not customer-facing" profile every engine independently recommends targeting for wholesale fulfillment (see §4). |
| The Outdoor Company Company | **Unknown / likely non-existent** | Zero independent confirmation of this domain or business — do not act on this Grok claim without further verification. |

---

## 4. Partner-node shortlist (phone-only / traditional yards, by DFW sub-region)

Businesses appearing on **at least 2 of the 4 external engines'** partner-candidate lists (or on 1 engine's list plus our own prior research), all phone/quote-first with no meaningful self-serve digital ordering — i.e., genuine "supply chain, not competitor" candidates:

| Partner | Address | Sub-region | Why (cross-source support) |
|---|---|---|---|
| **Lowery Sand & Gravel** | 520 Avenue H East Suite 114, Arlington, TX 76011 | Central/Mid-Cities | Delivery-only (no pickup) since 1978 — already behaves like a wholesale dispatcher. On ChatGPT's, DeepSeek's, and Grok's partner lists independently. Real weakness: ~$200 delivery fee on smaller orders, zero online presence — an easy digital-front-end wedge for MGG. |
| **Silver Creek Materials** | 2251 Silver Creek Rd, Fort Worth, TX 76108 | West Fort Worth / Tarrant | Vertically integrated (mines + composts + recycles), 600-acre facility. On ChatGPT's, DeepSeek's, Gemini's, and Grok's lists — the single most cross-confirmed partner candidate in this research. Real weakness: inconsistent product-quality complaints and multi-stop delivery logistics — MGG's QC/single-drop promise could differentiate. |
| **Select Sand & Gravel** | 8508 Precinct Line Rd, Colleyville, TX 76034 | North/East Tarrant | Employee-owned since 1983, 4.7-4.8★. On ChatGPT's and DeepSeek's lists. 5-yd/6-ton minimum, quote-only — ready for API/digital-front-end integration per DeepSeek. |
| **Texas Sand & Gravel** | 11311 FM 917, Alvarado, TX 76009 | South/Southwest DFW | Woman-owned DBE/HUB certified since 2004 — a real bonus for HOA/municipal bid eligibility. On ChatGPT's and DeepSeek's lists. Same-day capability confirmed by multiple sources. |
| **Soil Building Systems** | 2101 Walnut Hill Ln, Dallas, TX 75229 | North Dallas | Manufacturer since 1972 — soil/compost/mulch production, not just resale. On ChatGPT's, DeepSeek's, Gemini's, and Grok's lists. Already has a productdelivery order page — a partner MGG could integrate with rather than build from zero. |
| **Earth Haulers** | 11500 Mosier Valley Rd, Euless, TX | Mid-Cities / Northern DFW | ~50-year hauling operation, 24-48h (occasional same-day) capability. On ChatGPT's, Gemini's, and Grok's lists. |
| **Texas Hardscape Materials** | 1057 E State Hwy 121 Business, Lewisville, TX | NW Dallas / Flower Mound | Strongest Google reputation of any traditional yard found (4.9★/125). On ChatGPT's and DeepSeek's lists. |
| **Tex-Art Stone** | 8900 Davis Blvd, Keller, TX | Keller / Southlake / North Tarrant | Large established masonry/landscape supplier. On ChatGPT's and DeepSeek's lists. |
| **JBS Express McKinney** | 4011 W University Dr, McKinney, TX 75071 | North DFW (McKinney/Frisco/Allen) | Existing city pages, wholesale+retail split, no instant checkout confirmed — natural North-DFW digital-front-end partner. On our own research, DeepSeek's, and Grok's lists. |
| **Big Tex Stone** | 5820 Old Hemphill Rd, Fort Worth, TX | Fort Worth | Large established inventory since 2005. On ChatGPT's, DeepSeek's, and Grok's lists. Peak-season lead times (3-5 days) are a real gap MGG's guaranteed-date model could close. |

**Regional coverage read**: this shortlist already spans west (Silver Creek, Fort Worth), north/northeast Tarrant (Select S&G, Tex-Art, Texas Hardscape), north Dallas/Collin (SBS, JBS Express), south/southwest (Texas Sand & Gravel), and Mid-Cities (Lowery, Earth Haulers, Big Tex) — i.e., a genuine hub-and-spoke covering most of the metro without needing every quote-only yard in the merged CSV.

---

## 5. The corrected UX gap — what MGG can still own

ChatGPT's key claim (echoed independently by our own `competitive-analysis.md` §3.2 and by Grok's UX-bar section) is that **the UX gap is real but no longer empty**: Hello Gravel, EarthMove, and (partially) Gravel Monkey already do instant delivered pricing with self-serve checkout. Independently verified this pass, that claim holds — with one important nuance: **My Gravel Buddy's checkout does not actually finish the flow it advertises** (instant pricing, then a quote-and-call handoff), which means even inside the "already solved" tier, execution is uneven.

Given that, MGG's defensible ground is not "put a price on a website" — it's a bundle none of the four verified competitors combine:

1. **Actually finish the self-serve checkout that competitors only partially deliver.** My Gravel Buddy shows instant pricing then reverts to quote-and-call; Hello Gravel finishes the flow but has real post-purchase execution complaints (BBB: quote doubled, no-show). A guaranteed date + guaranteed price + guaranteed drop-photo, backed by a real complaint-resolution process, is a specific, provable claim none of the three verified digital leaders currently back up with a public guarantee.
2. **Trust/photo proof + texted windows as an explicit guarantee, not just a feature.** Every competitor already has *some* SMS/photo mechanism; none frame it as an accountability guarantee against a track record of complaints (Hello Gravel's own BBB profile is the evidence to point to, carefully and factually, not as an attack ad).
3. **One store for all 4 categories in a single delivery.** Confirmed gap: DeepSeek explicitly notes no single platform lets a homeowner order mulch + gravel + soil in one cart with one delivery; Hello Gravel is gravel/aggregate-led, Mulch Mound is mulch/soil-led. This is a genuine, independently-identified white space.
4. **Local-yard provenance as a stated wedge against broker models**, not just against big-box. Gravel Monkey's own negative review ("rep was not local") and the generic "broker" framing of Hello Gravel/EarthMove/My Gravel Buddy/Gravel Monkey all give MGG room to say "sourced from named DFW yards you can verify" — especially now that Silver Creek/SBS/Lowery are confirmed real, addressable, and open to fulfillment relationships.
5. **Price transparency including no-surprise-fees, positioned against EarthMove's ambiguous "$175 minimum delivery fee" language and Hello Gravel's post-purchase quote-doubling complaint** — both are real, checkable examples of exactly the "surprise cost" anxiety MGG's guaranteed-price model is built to remove.
6. **Specific underserved suburbs**: this pass did not re-run the Hamptons-style hyperlocal query test for DFW, but the fast-growing-suburb thesis already in `dfw-low-cost-gtm-and-tiktok.md` (Celina, Princeton, Prosper, Forney, Anna) remains unaddressed by any of the four verified digital leaders' city-page networks as a *dedicated* new-construction-mud-pit angle, as distinct from generic city pages.
7. **AI-answer visibility**: still unresolved by this pass (out of scope — owned by the AEO agent's document) but worth noting that none of the four verified digital competitors were observed to have any distinct AI-Overview/ChatGPT-citation strategy either, per the AEO doc's own findings — a shared blank canvas, not a MGG-specific gap.
8. **Contractor accounts / NET-30**: EarthMove claims this (unverified on the fetched page — no contractor-account language was visible); if EarthMove hasn't actually shipped it yet, this remains open for MGG to claim credibly for HOA/builder-punch-list customers (see the partnership tactics already ranked #2-3 in `dfw-low-cost-gtm-and-tiktok.md`).

**Caution, consistent with the rest of this research effort:** these are positioning hypotheses built from verified competitor gaps, not validated customer demand — they should be pressure-tested against real DFW order data before being treated as settled, exactly as `competitive-analysis.md` §3.5 already cautions for the broader premium-positioning claim.

---

## 6. Implications for MGG pricing and positioning

- **Pricing:** the DFW-SCRAPER doc's own cross-check already flags MGG as inconsistent — at/below local-yard cost on #57 stone and pea gravel, already above a +35%-over-median target on mulch/topsoil (`dfw-competitor-catalog.md` §4). This synthesis adds one more data point: EarthMove's "$175 minimum delivery fee" and Hello Gravel's 3-ton minimum both sit at a scale well above MGG's typical residential order — meaning MGG's real pricing competition for small residential loads (1-3 tons/yards) is **My Gravel Buddy's 1-ton minimum and Gravel Monkey's flexible 1+ ton minimum**, not Hello Gravel or EarthMove, which are effectively priced for larger loads. MGG's pricing ladder should be benchmarked against the small-load broker tier, not the 3+ ton tier, for its core residential SKUs.
- **Positioning:** none of the four verified digital-broker competitors (Hello Gravel, EarthMove, My Gravel Buddy, Gravel Monkey) publicly frame their value proposition as "we cost more because the experience is guaranteed" — every one of them competes on speed/price/free-delivery language. This confirms `competitive-analysis.md` §3.3's finding independently: the premium-for-simplicity message is still unclaimed territory, even though the underlying UX (ZIP → price → date → pay) is not.
- **Brand/naming risk is now a three-to-four-way collision** (MyGravelGuy / Gravel Monkey / My Gravel Buddy, plus Mulch Mound's similar "aggregator with a friendly brand name" pattern) — this raises, not lowers, the urgency of the trademark-counsel check already flagged in `competitive-analysis.md` §3.4.

---

## 7. Ten highest-value actions

1. **Finish a checkout flow that actually completes end-to-end self-serve** (price → date → pay → confirmation) for MGG's DFW launch — this is the one place a verified competitor (My Gravel Buddy) demonstrably fails to deliver on its own promise; matching Hello Gravel's completeness plus beating its post-purchase execution record is the single highest-leverage move.
2. **Sign fulfillment relationships with the 3 most cross-confirmed partner yards first**: Silver Creek Materials (4/4 engines), Soil Building Systems (4/4 engines), and Lowery Sand & Gravel (3/4 engines) — these give west, north-Dallas, and central/Mid-Cities coverage with the least outreach effort per the cross-source confirmation in §4.
3. **Build the single "one cart, all 4 categories, one delivery" flow** — an independently-confirmed, still-open gap (DeepSeek explicitly, and implicit in every other engine's competitor list splitting gravel-led vs. mulch-led players).
4. **Publish an explicit no-surprise-fee / guaranteed-date policy**, directly contrastable against EarthMove's ambiguous "$175 minimum" language and Hello Gravel's own BBB-documented quote-doubling and no-show complaints — factual, citable contrast points, not attack-ad language.
5. **Get trademark counsel to review "MyGravelGuy" registrability** given the confirmed three-way naming collision with Gravel Monkey and My Gravel Buddy (both real, both live, both DFW-present) — this was already flagged in prior research; this pass adds confirmation that both collision risks are real, not hypothetical.
6. **Do not rely on Gemini's margin/pricing figures for real financial planning** — verify the DFW-SCRAPER doc's own scraped numbers and the $45 Fort Worth Grass & Stone delivery fee instead, per the reliability scorecard in §0.
7. **Verify EarthMove's actual execution track record via a real test order or a call to their support line before treating it as equal in maturity to Hello Gravel** — its capability claims are the closest match to MGG's own vision, but it has no public review history yet to confirm claims are delivered in practice.
8. **Watch Gravel Monkey specifically for reputation-bleed risk** — it has the most complete confirmed self-serve checkout among the "My/Gravel/[noun]" collision set, meaning customer confusion is now a two-way live-UX risk, not just a naming risk.
9. **Use SiteOne Stone Center's published $45 delivery fee / 4-CY minimum and Fort Worth Grass & Stone's $45/trip flat fee as the two independently-confirmed real DFW delivery-fee data points** for cost-basis modeling, rather than blending in broker-bundled prices (Gravel Monkey/My Gravel Buddy) that reflect national, not DFW-specific, economics — this reinforces the DFW-SCRAPER doc's own caveat #2.
10. **Re-run this synthesis's ordering-flow walkthrough quarterly** — EarthMove is a 2026 launch with no track record yet, and Gravel Monkey/My Gravel Buddy's checkout completeness could change quickly; the competitive picture here is less stable than the traditional-yard partner list in §4, which should hold for longer.

---

## Change log (this doc)
- 2026-09-28: Created. Consolidated 40-row `competitors-merged.csv` (ours + ChatGPT P1/P2 + DeepSeek + Gemini + Grok, deduped); built LLM reliability scorecard from 15+ WebSearch/WebFetch verification queries (EarthMove, Hello Gravel, My Gravel Buddy, Soil Direct/Soil Depot conflation, Preston Hollow Mulchachos, SiteOne, Living Earth, American Rock Supply, Gravel Monkey, Soil Building Systems, "The Outdoor Company Company"); walked the actual ordering flow of Hello Gravel (search-snippet-reconstructed, main app 403s to WebFetch), EarthMove, and My Gravel Buddy (both directly fetched); wrote consolidated threat matrix, partner-node shortlist (10 cross-confirmed yards with addresses), corrected UX-gap analysis, pricing/positioning implications, and 10 ranked actions.
