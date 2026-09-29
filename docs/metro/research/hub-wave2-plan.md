# Gravel Driveway Hub — Wave 2 Plan

_Author: C1-HUB-WAVE2 agent, 2026-09-28. Companion to `docs/metro/research/aeo-plan.md` (read-only source of the question universe — this doc does not modify it)._

## 1. Question universe → coverage status

Source: aeo-plan.md §3.2's numbered table (rows 1–20, explicit) plus the row 21 catch-all describing city-name variants, contractor/B2B variants, and mulch/sand/soil parallels (~80–90 more rows, out of scope for the *gravel driveway* hub — those belong to per-metro material pages, not this hub, and are excluded from the count below by design).

| # | Question (aeo-plan row) | Wave 1 status | Wave 2 resolution |
|---|---|---|---|
| 1 | How much does a gravel driveway cost? | **Answered** — hub + `/cost` | — |
| 2 | Cost in Dallas–Fort Worth? | **Answered** — `/dallas-fort-worth` spoke + `/cost` FAQ | — |
| 3 | Best gravel for a driveway? | **Answered** — `/best-gravel` | — |
| 4 | How much gravel do I need? | **Answered** — `/how-much-gravel` | — |
| 5 | How deep should it be? | **Answered** — `/depth-and-layers` | — |
| 6 | Crusher run vs #57? | **Answered** — `/crusher-run-vs-57-vs-flex-base` | — |
| 7 | Flex base vs crushed limestone (TX)? | **Answered** — same spoke (flex base *is* crushed limestone per TxDOT spec) + `/dallas-fort-worth` | — |
| 8 | Cost per sq ft in Texas? | **Answered** — `/dallas-fort-worth` + `/cost` | — |
| 9 | Gravel vs concrete, Dallas? | **Partial** — no dedicated comparison page | **New spoke:** `/gravel-vs-asphalt-cost` (merged with #15 — same comparison intent, one page beats two thin ones) |
| 10 | How do I maintain it? | **Answered** — `/maintenance` (HowTo) | — |
| 11 | Tons for 100 ft driveway? | **Answered** — `/how-much-gravel` FAQ | — |
| 12 | #57 vs #8 stone? | **Not answered** | **New spoke:** `/57-vs-8-stone` |
| 13 | How much does a ton cover? | **Answered** — `/how-much-gravel` FAQ | — |
| 14 | Drainage — fixing pooling water? | **Not answered** (only a brief mention in `/maintenance`) | **New spoke:** `/gravel-driveway-drainage` (HowTo; also absorbs "driveway on a slope" — same underlying fix: crown/cross-slope) |
| 15 | Cheaper than asphalt? | **Not answered** | Merged into `/gravel-vs-asphalt-cost` (see #9) |
| 16 | Pea gravel pros/cons? | **Partial** — one FAQ line in `/best-gravel` | **New spoke:** `/pea-gravel-driveway-pros-cons` |
| 17 | Best gravel in Texas? | **Answered** — `/dallas-fort-worth` + `/best-gravel` FAQ | — |
| 18 | How much crusher run do I need? | **Answered** — `/how-much-gravel` (material-agnostic calculator math) | — |
| 19 | DIY or hire delivery + spreading? | **Not answered** | **New spoke:** `/diy-vs-hire-gravel-delivery` |
| 20 | Do you deliver to [DFW town]? | **Answered** — `/dallas-fort-worth` FAQ + hub FAQ | — |
| 21+ | City-name variants, contractor/B2B, mulch/sand/soil parallels | Out of scope — belongs to `/dallas-fort-worth/*` and future metro material pages, not the gravel-driveway content hub | Not built here |

**Explicit rows answered: 16 of 20 fully, 2 of 20 partially (now fully resolved by Wave 2), 2 of 20 unanswered (now resolved).** All 20 rows are covered after Wave 2 ships (16 already + 2 merged/completed + 2 new dedicated spokes = 20/20).

## 2. Gaps beyond the numbered table (from the brief's example list + common long-tail intent not itemized as its own numbered row in aeo-plan, but real search demand per its §1.6 synthesis and the brief's own examples)

These don't map 1:1 to a numbered aeo-plan row but are real, distinct query clusters worth their own page rather than being crammed into an existing spoke as an FAQ (thin-content rule: an FAQ answers a related question in 1–3 sentences; these need a full 40–60-word direct answer plus their own FAQ set because the intent is genuinely different):

- Step-by-step installation (HowTo) — distinct from "how much do I need" (quantity) and "how deep" (spec); this is procedural, matches Google's HowTo rich-result support.
- How long a gravel driveway lasts — lifespan is a distinct commercial-investigation query from "maintenance" (maintenance is upkeep tasks; lifespan is "is this worth it long-term").
- Weeds growing through gravel / erosion control — extremely common real-world complaint query, not covered by `/maintenance`'s general regrading advice.
- Decomposed granite driveways — a materially different product (binds when compacted, different look/feel) that "best gravel" doesn't cover since DG isn't a "gravel" in the crushed-stone sense.
- Recycled concrete (RCA) / asphalt millings — budget/eco-conscious alternative materials; DFW and LI catalogs both stock a real recycled-aggregate product (`rca-state` on Long Island), so this has real first-party backing, not a generic aggregator topic.
- Gravel parking pads / RV pads — different load case (static parked weight, larger vehicles) than a standard driveway; deserves its own depth/base guidance rather than being folded into `/depth-and-layers`.
- Snow, ice and plowing a gravel driveway — regional (Long Island winters), and plowing a loose-aggregate surface without displacing material is a genuinely distinct how-to.
- Permits and HOA rules — a purchase-blocker question with no home in any existing spoke.
- Truckload coverage / delivery minimums — distinct from the calculator (`/how-much-gravel` answers "how much do I need"; this answers "how does that translate into truck trips and MGG's 3-ton minimum" — real first-party operational detail, good E-E-A-T fit).

## 3. Wave 2 spoke list (13 new spokes)

Merging gravel-vs-concrete (#9) and gravel-vs-asphalt (#15) into one page keeps the count at 13 rather than 14 while still covering both comparisons in full — avoids two thin, overlapping pages per the brief's explicit merge instruction.

| # | Slug | Path | Primary query | Format |
|---|---|---|---|---|
| 1 | `gravel-vs-asphalt-cost` | `/gravel-driveways/gravel-vs-asphalt-cost` | Is gravel cheaper than asphalt or concrete? | Article + comparison table |
| 2 | `installation-steps` | `/gravel-driveways/installation-steps` | How do I install a gravel driveway step by step? | HowTo |
| 3 | `gravel-driveway-drainage` | `/gravel-driveways/gravel-driveway-drainage` | How do I fix pooling water / drainage on a gravel driveway, incl. sloped lots? | HowTo |
| 4 | `57-vs-8-stone` | `/gravel-driveways/57-vs-8-stone` | What's the difference between #57 and #8 stone? | Article + comparison table |
| 5 | `pea-gravel-driveway-pros-cons` | `/gravel-driveways/pea-gravel-driveway-pros-cons` | Is pea gravel good for a driveway? | Article |
| 6 | `how-long-gravel-driveway-lasts` | `/gravel-driveways/how-long-gravel-driveway-lasts` | How long does a gravel driveway last? | Article |
| 7 | `weeds-and-erosion-control` | `/gravel-driveways/weeds-and-erosion-control` | How do I stop weeds growing through my gravel driveway? | HowTo |
| 8 | `decomposed-granite-driveways` | `/gravel-driveways/decomposed-granite-driveways` | Is decomposed granite good for a driveway? | Article |
| 9 | `recycled-concrete-and-millings` | `/gravel-driveways/recycled-concrete-and-millings` | Can I use recycled concrete or asphalt millings for a driveway? | Article |
| 10 | `gravel-parking-pad-rv-pad` | `/gravel-driveways/gravel-parking-pad-rv-pad` | What gravel/depth do I need for a parking pad or RV pad? | Article |
| 11 | `snow-ice-plowing-gravel-driveway` | `/gravel-driveways/snow-ice-plowing-gravel-driveway` | How do I plow or de-ice a gravel driveway without ruining it? | Article |
| 12 | `permits-and-hoa-gravel-driveway` | `/gravel-driveways/permits-and-hoa-gravel-driveway` | Do I need a permit or HOA approval for a gravel driveway? | Article |
| 13 | `truckload-coverage-and-delivery-minimums` | `/gravel-driveways/truckload-coverage-and-delivery-minimums` | How much gravel fits on a truck, and what's the delivery minimum? | Article |

Plus registering the Cost Index route (`/gravel-driveways/cost-index`, C2's page) in App.tsx, extra-routes.json, and linking it from the hub and `/cost`.

## 4. Build approach (unchanged from Wave 1)

Each spoke: typed `GuideContent` module in `src/content/guides/pages/*.ts` → thin page component in `src/pages/guides/*.tsx` using `GuidePageShell` (+ `ComparisonTable`/`StepList` where useful) → lazy route added to `src/App.tsx` → path added to `scripts/prerender/extra-routes.json`. Reuses `DirectAnswerBlock`/`FaqSection`/`breadcrumbJsonLd` exactly as Wave 1 did; no new shared components required except an optional `group` field on `GuideContent` (backward-compatible, optional) so the hub page can render spokes under headed sections instead of one flat 20-item grid.

Every price/quantity figure reuses `src/metro/lib/pricing.ts` math conventions already established in Wave 1 (1.3–1.5 tons per cubic yard for gravel; delivered pricing only via the live pricing engine, never hardcoded) and is labeled estimated where `priceBookConfirmed` is false. No new dollar figures are invented; comparison-page cost ranges (gravel/asphalt/concrete) reuse the same national ranges already cited in Wave 1's `/cost` and `/dallas-fort-worth` spokes for consistency.
