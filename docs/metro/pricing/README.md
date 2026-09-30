# DFW & Long Island pricing heatmap

A full price-surface view built for the owner's minimum-order-size decision on DFW's
new $250 gross-profit floor (`docs/metro/research/dfw-pricing-v3-floor.md`). Read-only
visualization — no pricing code or config was touched to build this.

## What's in it

- **`pricing-heatmap-data.json`** — every (metro × zone × category × variant ×
  quantity) cell: delivered total, price/unit, partner cost (material + delivery),
  gross profit after Stripe fees, margin %, whether the $250 floor set the price,
  truck-load plan, and broker/yard comparisons where data exists.
- **`pricing-heatmap.csv`** — the same data flattened to one row per cell, for
  spreadsheet analysis.
- **`pricing-heatmap.html`** — a single self-contained, offline HTML page (no
  external requests; the JSON data is inlined). Controls: **Metro** (DFW / Long
  Island), **Zone**, **Metric** (six views — delivered total $, $/unit, gross profit
  $, margin %, vs-broker-median % (diverging), floor-applied). Includes stat tiles,
  a legend with the active scale, sticky row/column headers, a "Show values" toggle,
  a "Table view" toggle (plain accessible table, same data, no color), hover/focus
  tooltips with every field, a subtle outline on the recommended 8–10 unit columns,
  and dark mode via `prefers-color-scheme`.
- **`screenshots/`** — rendered PNGs for visual QA (see below).

Coverage: **DFW** (3 zones × 22 SKUs) and **Long Island** (5 zones × 15 SKUs), each
at quantities {3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30}. Quantities below a zone's
`minUnits` are still computed and shown (hatched, "below zone minimum order") rather
than dropped, so the column grid stays consistent across zones with different
minimums.

## How to regenerate

```bash
npx tsx scripts/metro/pricing-heatmap.ts        # writes the JSON, CSV, and HTML
node scripts/metro/pricing-heatmap-screenshots.mjs  # re-renders the PNGs (requires the HTML above)
```

The generator imports the real `quote()` engine and the real
`dallasFortWorth.ts` / `longIsland.ts` configs directly — it never hardcodes a
price. The HTML is produced by substituting the generated data into
`scripts/metro/pricing-heatmap.template.html` (the template holds all CSS/JS; only
the data blob is templated in, to keep the ~700KB inlined JSON out of hand-edited
source).

## Method notes

- **Broker/yard comparison method** mirrors `scripts/metro/margin-scenarios.ts`
  exactly, so every number here matches
  `docs/metro/research/dfw-pricing-v3-floor.md`: broker comparison = delivered
  total vs. `slug-stats.json`'s `broker_delivered_median × quantity` ("no broker
  data" when `broker_delivered_n_sellers === 0`, e.g. brown-dyed mulch); yard
  comparison = delivered total vs. `yard_median × quantity` (the undelivered,
  self-pickup yard price — i.e. what the floor's cost basis actually is — with the
  same bank-sand fallback margin-scenarios.ts uses: `nodePricePerUnit / 1.0` when
  `slug-stats.json` has no yard median). Long Island has neither: ELM's own yard
  prices are used directly (not a scraped market median), so both comparisons read
  "no data" / "n/a" there.
- **Gross profit** = delivered total (`basePrice`, everyday price, no Saturday/rush
  surcharge) − partner cost (material + delivery) − Stripe fee (2.9% + $0.30 of the
  charged total). For DFW this equals `quote()`'s own `estimatedGrossProfit`
  (verified identical); Long Island doesn't configure a margin floor so `quote()`
  reports no such field there — the heatmap computes the same formula manually for
  parity, so margin %/gross profit are comparable across both metros.
- **Floor applied** = `quote()`'s `marginFloorApplied` (DFW only; always `false` for
  Long Island, which has no `minMarginPerOrder` configured).
- **Diverging color clamp**: the "vs broker median %" view clamps at ±60% (stated
  in the legend) — a handful of cells exceed that (e.g. select-fill at 3 units is
  +96% above broker) and render at full saturation rather than off-scale.

## Palette validation

Per the `dataviz` skill: sequential = one hue (blue, `#cde2fb → #0d366b`, the exact
named steps in `references/palette.md`), diverging = blue↔red with a neutral gray
midpoint, red arm derived by solving for OKLab lightness matched to the blue steps
(same hue angle as the palette's categorical red slot, chroma tuned to stay in
gamut) then validated. `validate_palette.js` only has categorical/ordinal modes —
per `color-formula.md`, sequential/diverging ramps are checked via `--ordinal`
(monotonic lightness, one hue, adjacent step separation, light-end contrast vs.
surface), run on a representative subset of each ramp/mode/arm (the full continuous
gradients used in the HTML reuse the same validated stops, extended to the
documented endpoints per the sequential ramp's own "recede toward the surface"
rule for the near-zero end):

```
node validate_palette.js "#86b6ef,#5598e7,#2a78d6,#1c5cab,#104281" --mode light --ordinal
  → ALL CHECKS PASS (light-end #86b6ef 2.06:1)
node validate_palette.js "#184f95,#256abf,#3987e5,#6da7ec,#9ec5f4,#cde2fb" --mode dark --surface "#1a1a19" --ordinal
  → ALL CHECKS PASS (light-end #184f95 2.15:1)
node validate_palette.js "#fd8c84,#e26c65,#c64946,#a92126,#8c0000" --mode light --ordinal
  → ALL CHECKS PASS (light-end #fd8c84 2.21:1) — red arm, matched-lightness to the blue light steps
node validate_palette.js "#a61b23,#cd524e,#ee7a73,#ff968e,#ffc2b9" --mode dark --surface "#1a1a19" --ordinal
  → ALL CHECKS PASS (light-end #a61b23 2.32:1) — red arm, matched-lightness to the blue dark steps
```

**Result: 4/4 ramps PASS** (lightness monotone, adjacent ΔL ≥ 0.06, light-end
contrast ≥ 2:1, single hue) in both light and dark mode. Text in cells uses ink
tokens (`#0b0b0b` / `#ffffff`) chosen per-cell by contrast ratio against that cell's
own fill, never the series/ramp color, per the skill's ink rule. The `$250 floor`
metric and the "below zone minimum" state use no color coding at all (outline +
diagonal hatch texture + a neutral wash), so nothing there depends on hue
perception.

## Key findings

- **Small orders are the least competitive tier under the new floor.** At **3
  units** in `dfw-core`, only river-rock prices below the broker median (1 of 21
  comparable SKUs); every other SKU is above broker, and per-unit price is brutal —
  pea-gravel is **$190/ton at 3 units** vs. **$111.50/ton at 10 units** (a 70%
  per-unit premium for ordering below the recommended minimum). This is the
  strongest data point for raising the minimum.
- **The floor stops binding for most SKUs somewhere between 10 and 15 units.** In
  `dfw-core`, the $250 floor sets the price on 22/22 SKUs at 3–5 units, drops to
  20/22 at 10 units, falls off a cliff at 12 units (13/22) and 15 units (6/22), and
  is essentially gone by 20 units (1/22). The recommended 8–10 unit minimum sits
  right at the front edge of that transition, not past it — most SKUs are *still*
  floor-bound at 8–10 units, they're just no longer at the extreme per-unit
  premiums 3-unit orders show.
- **10 of 21 comparable SKUs never price below broker at any quantity (3–30), in
  any DFW zone:** #57 crushed limestone, decomposed granite, all five sands (mason,
  bank, concrete, play, washed), cedar mulch, pine bark mulch and compost (brown-dyed
  mulch has no broker data). Pea gravel only dips below broker in `dfw-core` (at 15
  and 30 units, by <1%) and never in North/Outer. These are the everyday driveway
  staples, so under the $250 floor and the ×1.00 cost basis MGG is above the online
  brokers on its core products. *(Corrected by orchestrator 2026-09-30: an earlier
  draft of this bullet had the direction inverted.)*
- **The SKUs that DO beat broker are the high-headroom ones**, and each has a clear
  crossover quantity (dfw-core): river rock from 3 units, playground mulch from 4,
  black-dyed mulch from 6, native hardwood and red-dyed mulch from 8, rip rap and
  garden mix from 10, flex base and sandy loam from 12, select fill from 20. At 30
  units they're 10–45% below broker. These are the SKUs `dfw-margin-scenarios.md`
  flagged with the most broker-price headroom.
- **Per-unit price is not perfectly monotonic in quantity** — it can tick *up* as
  quantity grows, when the truck-load plan changes. Pea-gravel dfw-core:
  $106.67/ton at 15 units → **$107.00/ton at 20 units** (single small dump →
  tandem → end dump; the end dump's higher `deliveryCostFactor`, 1.8× vs. the
  tandem's 1.3×, briefly outweighs the extra volume) → **$108.20/ton at 25 units**
  (a second, partial small-dump load added at only a 25% additional-load discount)
  → back down to $106.33/ton at 30. The bumps are small (a few dollars/unit) but
  real, and worth knowing about if the owner ever eyeballs "bigger order = better
  unit price" as a hard rule.
- **DFW-outer (higher delivery cost) is very slightly less broker-competitive than
  DFW-core** at the same quantity: 26.8% of comparable cells clear broker in
  `dfw-outer` across all quantities vs. 30.3% in `dfw-core`. River rock only clears
  broker from 4 units in `dfw-outer` (vs 3 in core), and pea gravel never clears it
  outside `dfw-core`.
- **Long Island's economics look structurally different, as expected** — no floor
  ever binds (0/825 cells), median margin is materially thinner (17.3% in
  `li-core`, its cheapest zone, vs. 28.3% in `dfw-core`), and the lowest-profit cell
  in the entire dataset is Long Island's **Clean Fill at 3 yards, $16 gross
  profit** — a real illustration of why the owner deferred the floor there rather
  than transplanting DFW's structure directly.
- **Median margin % is nearly flat across DFW zones** (28.3% core, 28.2% outer)
  despite `dfw-outer`'s materially higher delivery cost — the floor is doing its
  job of holding gross profit steady regardless of zone, which is exactly what it
  was designed to do.

## Screenshots

Rendered with Playwright at 1600×1100 (desktop) and 390×844 (mobile), one dark-mode
shot via `colorScheme: 'dark'` emulation:

- `dfw-core-vs-broker.png` — DFW, dfw-core, "vs broker median %" (diverging)
- `dfw-core-gross-profit.png` — DFW, dfw-core, "Gross profit $" (sequential)
- `dfw-outer-delivered-total.png` — DFW, dfw-outer, "Delivered total $"
- `li-first-zone-delivered-total.png` — Long Island, li-core, "Delivered total $"
- `dark-mode-dfw-core-gross-profit.png` — dark mode
- `mobile-dfw-core-delivered-total.png` — 390px mobile viewport

All six were reviewed for label collisions, overflow, and clipping before
finishing; one real issue was found and fixed — the stat tiles wrapped mid-value
("148 /" / "242") on the 390px mobile layout because the 4-column tile grid had no
mobile breakpoint. Fixed with a `max-width: 640px` media query (2-column tiles,
smaller value font) and non-breaking spaces around the "count / total" separator.
