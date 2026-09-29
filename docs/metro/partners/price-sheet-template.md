# DFW Partner Price Sheet — Template

Status: template, 2026-09-28. Send `price-sheet-template.csv` (same 22 rows, plain CSV —
easier to open in Excel/Google Sheets) to a partner yard to fill in. This `.md` version
documents what each column means and shows the filled EXAMPLE row for reference. **No
row below except the row marked EXAMPLE contains a real number — every blank is what the
partner needs to supply.**

## How to use this

1. Copy `price-sheet-template.csv`, rename it `<yard-name>-price-sheet.csv`, delete the
   EXAMPLE row, and send it to the partner (email attachment, or walk through it on the
   call — see `call-script.md`'s qualification questions, which map 1:1 to these
   columns).
2. Ask the partner to fill in only the columns that apply to what they actually stock —
   leave rows blank for materials they don't carry rather than guessing.
3. `mgg_name` and `common_local_aliases` exist so the partner can match MGG's SKU names
   to whatever they call the same product on their own price list — **the partner should
   fill `partner_product_name` with their own name for it**, not just check a box, so we
   can catch mismatches (e.g. MGG's "Decomposed Granite" vs. a yard selling a colored/
   "Black DG" variant at a different price — see `dfw-pricing-v2.md`'s caveat on this
   exact mixing risk).
4. Once returned, the numbers feed `docs/metro/research/dfw-pricing-v2.md`'s node-price
   table and, eventually, replace the placeholder `nodePricePerUnit` values in
   `src/metro/config/data/dfwCatalog.ts` (regenerated via
   `scripts/metro/catalog-from-proposal.mjs` — do not hand-edit that file).

## Column glossary

| Column | What it means |
|---|---|
| `category` / `slug` / `mgg_name` | MGG's own catalog identity for this SKU (`src/metro/config/data/dfwCatalog.ts`) — do not change these three columns. |
| `common_local_aliases` | What DFW yards commonly call the same material, so the partner can confirm they're quoting the right product. |
| `mgg_unit` | The unit MGG sells this SKU in (`ton` for gravel/sand, `yd` for mulch/soil) — ask the partner to convert if they price differently (e.g. some yards quote gravel per yard). |
| `partner_product_name` | The partner's own name/SKU for this material on their price list. |
| `price_per_unit_pickup` | Their counter/pickup price per `mgg_unit`, no delivery. |
| `delivered_price_or_fee_dfw_core` / `_dfw_north` / `_dfw_outer` | Either a fully delivered price per unit, or a flat/graduated delivery fee added to the pickup price, for each of MGG's three DFW zones (see `src/metro/config/data/dfwZips.ts` for the ZIP lists — `dfw-core` = Dallas & Tarrant, `dfw-north` = Collin & Denton, `dfw-outer` = Rockwall/Kaufman/Ellis/Johnson). If the partner prices by distance/mileage instead of by zone, have them write the formula in `notes` instead of forcing a single number per zone. |
| `truck_sizes_and_max_per_load` | What trucks they run for this material and the max tons/yards per load (drives MGG's truck-size picker and whether a large order needs multiple trucks). |
| `minimum_load` | Smallest order they'll deliver (and whether there's a small-order surcharge below some threshold — see Soil Building Systems' real, confirmed $35-under-6-yd surcharge as a live example of this pattern, in `partner-due-diligence.md` §4). |
| `saturday_surcharge` | Flat fee or % added for Saturday delivery, if offered at all. |
| `lead_time` | Same-day cutoff time, standard turnaround, and whether it's guaranteed or "optimal conditions" (SBS explicitly states delivery times are *not* guaranteed — worth asking every partner the same question, not assuming). |
| `availability_seasonality` | Any material that sells out or has longer lead times in spring (all three shortlisted yards operate in a market where 55%+ of ELM's comparable annual volume lands April–June, per `METRO-STRATEGY.md` §1a — ask directly whether they see the same seasonality). |
| `notes` | Anything that doesn't fit elsewhere — contamination/QC process, color/grade variants (river rock and DG both have wide legitimate price spreads by grade per `dfw-pricing-v2.md`'s caveats), trade/contractor pricing tiers, etc. |

## EXAMPLE row (illustrative only — not a real partner quote)

Built from `docs/metro/research/data/dfw/slug-stats.json`'s pea-gravel yard-class median
($71.43/ton, n=6 DFW sellers) and the same $110.50 delivery-cost placeholder used in
`economics.md` (`dfw-core` loadCost $85 × 1.3 medium-truck factor) — **both numbers are
research placeholders, not a quote from any specific yard, and are clearly not to be
reused as if they were.**

| category | slug | mgg_name | common_local_aliases | mgg_unit | partner_product_name | price_per_unit_pickup | delivered_price_or_fee_dfw_core | truck_sizes_and_max_per_load | minimum_load | saturday_surcharge | lead_time | availability_seasonality | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gravel | pea-gravel | Pea Gravel (3/8") | 3/8" pea gravel; pea rock | ton | EXAMPLE: 3/8" Pea Gravel | EXAMPLE: $71.43/ton (DFW yard median — not a real quote) | EXAMPLE: +$110 delivery fee (placeholder — not a real quote) | EXAMPLE: tandem, 15t max | EXAMPLE: 3 tons | EXAMPLE: none | EXAMPLE: next-day if ordered by noon | EXAMPLE: year-round | EXAMPLE row — delete before sending to a real partner |

## The 22 SKUs (blank — for the partner to fill)

See `price-sheet-template.csv` for the working copy. Full slug list, grouped by
category (MGG unit in parens):

**Gravel (ton):** pea-gravel, 57-limestone, flex-base, decomposed-granite, rip-rap,
river-rock.

**Sand (ton):** mason-sand, bank-sand, concrete-sand, play-sand, washed-sand.

**Mulch (yd):** native-hardwood, black-dyed, brown-dyed, dyed-red, cedar, pine-bark,
playground-mulch.

**Soil (yd):** sandy-loam, garden-mix, compost, select-fill.

## Change log
- 2026-09-28: Created. 22 rows match `src/metro/config/data/dfwCatalog.ts` exactly
  (verified slug-for-slug); common local aliases drawn from DFW materials terminology
  and `dfw-pricing-v2.md`'s product-name mapping notes; EXAMPLE row built from
  `slug-stats.json`'s pea-gravel yard median and the same delivery-cost placeholder used
  in `economics.md`, clearly labeled as illustrative only.
