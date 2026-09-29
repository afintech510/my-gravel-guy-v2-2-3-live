# DFW Partner Due Diligence — Silver Creek Materials, Lowery Sand & Gravel, Soil Building Systems

Status: research, 2026-09-28. Docs/research only — no outreach has happened yet (see
`README.md` for the recommended call order). Every external claim below is cited; unknowns
are marked **unverified — ask on call**, not invented.

**Inputs used:** `docs/metro/research/external-llm-competitor-synthesis.md` (§4 partner
shortlist), `docs/metro/research/external-llm-synthesis-2.md` (§2 P5 social-listening —
the SBS Reddit complaint), `docs/metro/research/dfw-pricing-v2.md` (yard-class pricing),
`src/metro/config/dallasFortWorth.ts` + `src/metro/config/data/dfwZips.ts` (zone
definitions), plus fresh WebSearch/WebFetch against each yard's own site, BBB, Birdeye,
Yelp, and Reddit this pass (2026-09-28).

---

## 1. Zone mapping

All three shortlisted yards sit inside **`dfw-core`** (Dallas + Tarrant county ZIPs, per
`dfwZips.ts`), the metro's lowest-loadCost zone ($85/load). None are natively positioned
to anchor `dfw-north` (Collin/Denton, $100) or `dfw-outer` (Rockwall/Kaufman/Ellis/Johnson,
$130) — those two zones remain unaddressed by this shortlist and should be a factor in
metro #1's node sequencing, not assumed solved by these three signings.

| Yard | Address | ZIP | Zone | Sub-region |
|---|---|---|---|---|
| Silver Creek Materials | 2251 Silver Creek Rd, Fort Worth, TX | 76108 | `dfw-core` | West Fort Worth / Tarrant |
| Lowery Sand & Gravel | 520 Avenue H East Suite 114, Arlington, TX | 76011 | `dfw-core` | Central / Mid-Cities (Arlington) |
| Soil Building Systems | 2101 Walnut Hill Ln, Dallas, TX | 75229 | `dfw-core` | North Dallas |

Geographically these three still give reasonable west/central/north-Dallas coverage
*within* `dfw-core` (Fort Worth west side, Arlington mid-cities, north Dallas), even
though none sits in Collin, Denton, Rockwall, Kaufman, Ellis, or Johnson county.

---

## 2. Silver Creek Materials

- **Address:** 2251 Silver Creek Rd, Fort Worth, TX 76108. **Phone:** (817) 246-2426.
  [silvercreekmaterials.com](https://silvercreekmaterials.com/)
- **Hours:** Mon–Fri 6:30am–5:00pm, Sat 7:00am–1:00pm (some sources show a later Saturday
  close, e.g. 3pm — **unverified — ask on call**), closed Sunday. [Search snippets,
  business.fwhcc.org, silvercreekmaterials.com]
- **Ownership / years in business:** Family-owned, founded **1983** (42+ years) by
  **Robert Dow**, a Fort Worth native. [silvercreekmaterials.com/about]
- **Operation type:** Vertically integrated — mining (sand/gravel aggregates),
  large-scale composting (diverting "tens of millions of tons" of organics from
  landfill, company claim, not independently quantifiable), recycling (brush/yard
  compostables, liquid/organic recycling, mud-water recycling). [silvercreekmaterials.com/about]
- **Materials:** Aggregates, landscaping/organic soils, mulch, compost — full catalog on
  their site. [silvercreekmaterials.com/landscaping/landscaping-products]
- **Delivery:** Pickup at the Fort Worth yard, or delivery "priced by distance and
  volume" (call for quote) — **no published delivery fee schedule, no confirmed radius,
  no confirmed minimum load — all unverified — ask on call.**
- **Trucks / capacity:** Not published — **unverified — ask on call.**
- **Reviews / sentiment:** 4.3★ across ~300 reviews (Birdeye aggregate), 88% Facebook
  recommend rate. [reviews.birdeye.com, facebook.com/silvercreekmaterials] Yelp shows 11
  reviews (lower sample, not independently re-read this pass). Not BBB Accredited; no
  specific BBB complaint count surfaced this pass (**unverified — pull the full BBB
  complaint history on the call, don't rely on this doc's search-snippet read**).
  Search-synthesized sentiment: "consistently reliable... professional staff... some
  reports of delivery-timing delays and occasional material-cleanliness variability
  (rocks/debris in a shipment)" — **this is an AI-search-engine paraphrase of aggregate
  review sentiment, not a quoted review; treat the "cleanliness variability" note as a
  soft, unconfirmed signal, not a documented complaint.**
- **Certifications:** A `external-llm-synthesis-2.md` note earlier claimed Silver Creek's
  compost holds the US Composting Council **Seal of Testing Assurance (STA)** — a
  WebSearch snippet this pass repeated that claim, but a direct fetch of
  silvercreekmaterials.com/about did **not** surface STA language. **STA certification
  status: unverified — ask on call / check compostingcouncil.org's member directory
  directly before citing this in outreach.**
- **Awards:** Governor's Award for Environmental Excellence, Forte Award (Manufacturing
  & Distribution), Texas Mutual Platinum Safety Award (company-published, not
  independently re-verified). [silvercreekmaterials.com/about]
- **Cross-source confirmation:** 4/4 external LLM engines (ChatGPT, DeepSeek, Gemini,
  Grok) independently listed Silver Creek as a partner candidate in the prior research
  pass — the single most cross-confirmed yard in the whole shortlist. [`external-llm-
  competitor-synthesis.md` §4]
- **Small-load flexibility:** Grok's social-listening pass (P5) found organic Reddit
  praise specifically for Silver Creek's willingness to load a truck bed/trailer for
  small, sub-minimum orders — a concrete differentiator for MGG's likely order sizes,
  though not independently re-verified this pass (see §5 caveat on Reddit access).
  [`external-llm-synthesis-2.md` §2 P5]

**Read:** Real, established, well-reviewed, most cross-confirmed. Biggest open items are
mundane (delivery fee schedule, radius, trucks, minimum load, STA status) — all
"ask on call," none disqualifying.

---

## 3. Lowery Sand & Gravel

- **Address:** 520 Avenue H East Suite 114, Arlington, TX 76011. **Phone:**
  (817) 265-5572. **Dispatch:** dispatch@lowerysand.com.
  [lowerysand.com](https://www.lowerysand.com/)
- **Hours:** Office Mon–Fri 7am–5pm; Saturday delivery available **by appointment**.
  [lowerysand.com/about]
- **Ownership / years in business:** Locally owned and operated since **1978** (47+
  years). [lowerysand.com/about]
- **Operation type:** **Delivery-only — no pickup at all.** Already behaves like a
  wholesale dispatcher rather than a walk-in yard, which is structurally close to what
  MGG needs from a fulfillment partner. [lowerysand.com/about, confirmed by
  `external-llm-competitor-synthesis.md` §4]
- **Materials:** Sand, gravel, rock, soil, stone, aggregate, topsoil, dirt, limestone,
  granite aggregates, recycled concrete, mulch-compost mixes. [lowerysand.com/about]
- **Delivery:** Same-day "in most cases if ordered by noon"; Saturday by appointment.
  No published delivery radius or minimum load — **unverified — ask on call** (prior
  research flagged a real weakness here: ~$200 delivery fee reported on smaller orders,
  see `external-llm-competitor-synthesis.md` §4 — **not independently re-confirmed this
  pass, ask directly**).
- **Trucks / capacity:** Not published — **unverified — ask on call.**
- **Payment terms:** Cash, checks, Zelle, all major credit cards; **net 10–30 day credit
  terms available to approved customers** — a real, useful signal that they already do
  business on invoice terms with commercial accounts, relevant to negotiating MGG's own
  net-7/weekly-ACH payment structure. [lowerysand.com/about]
- **Online ordering:** Quote-request form + a size/quantity calculator on the site; no
  self-serve checkout. [lowerysand.com]
- **Reviews / sentiment:** 5.0★ on Angi and Yellow Pages (small samples). Representative
  quotes surfaced this pass: *"Always the best price, delivers on time and very
  professional!"* and *"VERY pleased with the professionalism, price and general quality
  of the product."* [angi.com, yellowpages.com] One outlier negative comment surfaced in
  a general search — a reviewer calling it "a very bad company" over driver conduct — a
  single anecdote among many positive reviews, not independently traced to a specific
  platform/date this pass. **BBB: not accredited, "BBB does not have sufficient
  information to issue a rating"** — i.e. BBB has essentially no file on them either way.
  [bbb.org/us/tx/arlington/profile/quarries/lowery-sand-gravel-0825-1000253392]
- **Cross-source confirmation:** On ChatGPT's, DeepSeek's, and Grok's partner-candidate
  lists independently (3/4 engines). [`external-llm-competitor-synthesis.md` §4]

**Read:** Real, long-tenured, delivery-only (a structural fit), thin-but-positive review
base, existing credit-terms practice is a good sign for payment-terms negotiation. Weakest
point is the unverified $200-small-order delivery fee claim from prior research — worth
asking directly and pricing into `dfw-core`'s $85 loadCost assumption before signing.

---

## 4. Soil Building Systems (SBS) — including the Reddit complaint investigation

- **Address:** 2101 Walnut Hill Ln, Dallas, TX 75229. **Phone:** 972-831-8181.
  [soilbuildingsystems.com](https://www.soilbuildingsystems.com/)
- **Ownership:** **Baron Ablon**, President & CEO. [zoominfo.com/p/Baron-Ablon]
- **Years in business:** Founded **1972** — the oldest of the three shortlisted yards.
  Texas A&M "Aggie-100" honoree (fastest-growing Aggie-owned/-led businesses).
  [aggie100.com/honoree/soil-building-systems-inc, soilbuildingsystems.com/aboutsbs]
- **Operation type:** Manufacturer, not just reseller — "the largest composting facility
  in North Texas" per multiple listings; produces bagged and bulk organic compost, soil
  mixes, mulches, specialty products. Accepts grass, leaves, wood chips, logs, brush,
  limbs, flowers, clean dirt as compost feedstock. [industrynet.com, timetorecycle.com
  locator]
- **TCEQ / regulatory status:** SBS appears in a TCEQ-associated composting-facility
  locator (timetorecycle.com), consistent with operating as a registered/permitted
  Texas composting facility, but this pass could **not** independently pull SBS's
  specific TCEQ registration or permit number, nor confirm current compliance status —
  **unverified — check TCEQ's public facility search directly, or ask on call.**
- **US Composting Council STA certification:** **Not confirmed.** No source found this
  pass shows SBS holding the USCC Seal of Testing Assurance. (Contrast: Silver Creek's
  STA status is also unconfirmed but at least claimed in a search snippet — SBS has no
  such claim anywhere in this pass's results.) **This absence, combined with the QC
  complaint below, is the single most actionable due-diligence gap on SBS — ask directly
  whether they participate in STA or any third-party compost testing program, and ask to
  see a recent batch test/COA (certificate of analysis) for their flagship "Ready to
  Plant Soil" blend before signing.**
- **Delivery/ordering:** Real online order page
  (soilbuildingsystems.com/services/productdelivery) — schedule online or call.
  Deliveries Mon–Sat, daylight hours, typically a 2-hour window, optional call-ahead.
  **Delivery fee**: auto-calculated by destination + a **$35 surcharge under 6 cubic
  yards** + a fuel surcharge on every delivery — i.e. SBS effectively has a **6-yd soft
  minimum** before the small-order penalty kicks in. **Delivery radius:** "100+ cities
  from Shreveport to Waco" — the widest stated radius of the three. **Lead time:** not
  guaranteed ("optimal driving and scheduling conditions"). **Trucks:** tandem/bobtail
  dumps (14–25 yd), 18-wheel end-dump trailers (22–40 yd), belly dumps, live-bottom
  trailers, blower trucks — the most detailed published fleet description of the three
  yards. [soilbuildingsystems.com/services/productdelivery]
- **Reviews / aggregate sentiment:** 4.2★ across 185–189 reviews (Birdeye), A+ BBB
  rating, **0 BBB complaints closed in the last 3 years**, 0 BBB reviews on file.
  [reviews.birdeye.com, bbb.org/us/tx/dallas/profile/soil-conditioner/soil-building-
  systems-inc-0875-90042052] A direct fetch of SBS's Birdeye page this pass surfaced
  only positive reviews in the visible content (no 1–3★ complaints appeared on the
  fetched page — this does not mean none exist, only that none were visible in what
  was fetched). Yelp's SBS page (29 photos, Walnut Hill location) returned a 403 to
  WebFetch this pass and was not independently re-read.
  - One general-search snippet surfaced a secondhand account of a customer who
    "spent almost $900 on soil for raised beds (their signature 'Ready to Plant'
    product)" and reported "something was wrong with the soil and it would not grow
    anything, not even weeds" — **this could not be traced to a specific platform,
    reviewer, or date this pass; treat as a second, independent, low-confidence signal
    pointing the same direction as the Reddit complaint below, not as a separately
    confirmed incident.**

### The Reddit topsoil-contamination complaint — investigation result

**Source of the claim:** `docs/metro/research/external-llm-synthesis-2.md` (§2, "P5 —
Social listening") reports a quotable complaint sourced from Grok's social-listening
pass over Reddit: *"Absolutely DO NOT go to Soil Building Systems Inc. on Walnut Hill. I
got 'ready to plant soil'… 25% gravel, 25% uncomposted clumps of horse manure and 50%
sand"* (attributed to **r/Dallas**). That doc treats this as a real, citable complaint
and flags it as new evidence not reflected in the earlier partner shortlist.

**This pass's independent verification attempt:** I made a genuine effort to locate the
original Reddit thread directly — via WebSearch (multiple phrasings: the exact quoted
fragments "uncomposted clumps of horse manure," "25% gravel"/"50% sand," "ready to plant
soil" + "Walnut Hill," `site:reddit.com "Soil Building Systems"`, and general "reddit
Soil Building Systems complaint" queries) and via WebFetch against reddit.com and
old.reddit.com search URLs directly. **Result: WebFetch is blocked from both
reddit.com and old.reddit.com in this environment (hard tool error, not a 403), and none
of the WebSearch queries surfaced the original thread, its author, its date, or its
URL.** I was not able to independently re-confirm this complaint's existence, wording,
date, or authenticity this pass.

**What this means for the recommendation:**
- The complaint is **not a fabrication risk in the usual sense** — it was reported by a
  prior research pass as a real Reddit thread found via a live social-listening tool run
  (Grok), not invented by this agent. But it is **currently a second-hand, single-source
  claim with no independently verified URL, date, or author**, and this pass's own tools
  could not close that gap (Reddit access is blocked to WebFetch; WebSearch didn't
  surface it under several phrasings).
- **Corroboration found this pass:** one other, separately-worded, also-untraceable
  account (the "$900 raised-bed soil, wouldn't grow anything" complaint above) points in
  the same direction — both describe SBS's flagship "Ready to Plant Soil" product
  specifically, not SBS's compost or mulch generally. Two independently-surfaced,
  same-product complaints is a real pattern signal even though neither is individually
  pinned down to a verifiable source this pass.
- **Contradicting signal:** SBS's aggregate review picture is otherwise strong — 4.2★/185+
  (Birdeye), A+ BBB with 0 complaints in 3 years, Aggie-100 honoree, oldest and largest
  of the three shortlisted operations. If the contamination complaint were representative
  of a systemic QC failure, it would be surprising not to see it reflected anywhere in
  the BBB complaint record or in the visible Birdeye reviews (though see caveat: Birdeye
  page content is curated/paginated and this pass only fetched what rendered).
  - **No confirmed third-party compost testing program (STA or otherwise)** — this is
    the real, independently-confirmable gap. A yard without a published, testable QC
    program is structurally more exposed to exactly this kind of complaint (organic
    material that hasn't been through a controlled compost cycle can plausibly contain
    unfinished manure clumps), whether or not this specific Reddit thread is genuine.

**Recommendation: proceed with QC conditions, not proceed unconditionally and not
deprioritize.**
- **Why not deprioritize:** SBS is the most cross-confirmed manufacturer-class partner
  (4/4 engines in the prior shortlist), has the widest delivery radius, the most
  detailed published fleet, an existing real order-and-delivery page MGG could integrate
  with, and an otherwise-strong aggregate review record. One unconfirmed anecdote (even
  with a second, also-unconfirmed, same-direction data point) is not sufficient grounds
  to drop the single best-documented partner candidate.
- **Why not proceed unconditionally:** the underlying risk category (a garden/topsoil
  blend, not a commodity aggregate) is exactly the kind of product where a bad batch
  reaches a customer's yard and becomes an MGG support/refund/reputation problem, and
  SBS has no confirmed third-party QC certification to point to as a mitigant.
- **Conditions before signing SBS as a live-order fulfillment partner for soil/compost
  SKUs specifically** (their aggregate/gravel/sand-adjacent lines, if any, carry less of
  this specific risk):
  1. Ask directly on the call whether they hold USCC STA or run any third-party batch
     testing (§ above) — request a current certificate of analysis for "Ready to Plant
     Soil" and their compost line.
  2. Ask about their internal QC process for screening unfinished/uncomposted material
     out of finished blends, and how they handle a substantiated bad-batch complaint.
  3. Write SBS's contamination/wrong-material remedy explicitly into the partner
     agreement (see `partner-agreement-one-page.md` §Quality) — re-delivery or credit,
     not just a general damages clause.
  4. Consider ordering one or two live test loads of the soil/garden-mix SKUs
     specifically (not just gravel/aggregate) before routing real customer orders to
     them for that category, and photograph what arrives.
  5. Re-run a live Reddit search closer to launch (a human with direct Reddit access, or
     a future pass once WebFetch access to reddit.com is available) to see if the
     original thread can be located and dated — this doc's inability to verify it is a
     tooling limitation this pass, not proof the complaint doesn't exist.

---

## 5. Backup yards (one line each, from the wider shortlist)

| Yard | Rating / signal | Read |
|---|---|---|
| **Select Sand & Gravel** (Colleyville, 8508 Precinct Line Rd) | BBB A+ (accredited since 2015), 4.6★/19 Google reviews, employee-owned since early 1980s, quote-only, 5-yd/6-ton minimum per prior research | Solid, smaller review sample — good North/East Tarrant backup. |
| **Texas Sand & Gravel** (Alvarado, 11311 FM 917) | BBB A+ (accredited since 2022), positive Yellow Pages reviews ("great company," "delivery was on time"), woman-owned DBE/HUB certified since 2004 | Good South/Southwest DFW backup, useful for HOA/municipal bid eligibility. |
| **Texas Hardscape Materials** (Lewisville, 1057 E State Hwy 121) | Strongest prior-research reputation claim (4.9★/125, per `external-llm-competitor-synthesis.md`) but this pass could not independently re-surface a specific rating/review count — **unverified this pass** | Promising NW Dallas/Flower Mound backup pending a direct re-check. |
| **Earth Haulers** (Euless, 11500 Mosier Valley Rd) | Not independently re-checked this pass; prior research: ~50-year hauling operation, 24–48h (occasional same-day) | Mid-Cities/Northern DFW backup, not re-verified this pass. |
| **Big Tex Stone** (Fort Worth, 5820 Old Hemphill Rd) | Not independently re-checked this pass; prior research: established since 2005, 3–5 day peak-season lead times | Fort Worth backup; MGG's guaranteed-date promise is a real differentiator against their stated lead-time gap. |
| **JBS Express McKinney** | Not independently re-checked this pass | Only backup candidate reaching toward `dfw-north` (McKinney/Frisco/Allen) — worth prioritizing if `dfw-north` needs a node before a 4th/5th primary signing. |

---

## 6. Net read for `README.md` / outreach sequencing

1. **Silver Creek Materials** — sign first. Most cross-confirmed, longest published
   fleet-and-hours detail, strongest visible review base, no red flags found.
2. **Lowery Sand & Gravel** — sign second. Delivery-only structure is the closest
   existing fit to how MGG needs a partner to operate; verify the small-order delivery
   fee and get their credit-terms practice working in MGG's favor.
3. **Soil Building Systems** — sign third, **with the QC conditions in §4** attached
   specifically to soil/compost/garden-mix SKUs. Their gravel/aggregate lines carry
   materially less of this specific risk category and could be onboarded on the normal
   track if the owner wants to decouple the two.

All three sit in `dfw-core` — `dfw-north` and `dfw-outer` remain unaddressed by this
shortlist; JBS Express McKinney (north) is the most promising already-identified
candidate to close that gap in a later pass.

## Change log
- 2026-09-28: Created. WebSearch/WebFetch due diligence on Silver Creek Materials,
  Lowery Sand & Gravel, and Soil Building Systems (location, hours, ownership,
  materials, delivery, trucks, reviews, certifications); zone-mapped all three to
  `dfw-core` via `dfwZips.ts`; investigated the SBS Reddit topsoil-contamination
  complaint (could not independently re-locate the source thread — reddit.com/
  old.reddit.com blocked to WebFetch, WebSearch did not surface it under multiple
  phrasings — documented as an unresolved second-hand claim with one corroborating,
  also-unverified signal, and a confirmed, independently-checkable gap: no USCC STA or
  other third-party compost-testing certification found for SBS); gave a
  proceed-with-QC-conditions recommendation on SBS; rated 6 backup yards from the wider
  shortlist.
