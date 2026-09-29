# DFW Margin Scenarios — Partner Cost × MGG Pricing Structure

## Owner decision: $250 floor (2026-09-28)

The owner reviewed this doc's findings and decided: **"Let's bump pricing. We want to
make at least $250 per order"** on DFW. Implemented as a `minMarginPerOrder: 250` price
floor in `dallasFortWorth.pricing` (Long Island unchanged, config-gated so it's off there
by default), on top of this doc's Table 8 tiered-premium recommendation (adopted
verbatim: 0.25/0.35/0.45 by SKU) and a more conservative cost basis (node price = yard
median × 1.00, not the 0.85 this doc used — see below). Full formula, per-SKU price
table, and competitiveness/minimum-order analysis:
**`docs/metro/research/dfw-pricing-v3-floor.md`**.

Status: research/analysis, 2026-09-28. Author: P1-MARGIN-SCENARIOS. Analysis only — no
code/config in `src/**` was changed to produce this doc. Every number below comes from
running `scripts/metro/margin-scenarios.ts` (via `npx tsx`) against the real
`src/metro/config/dallasFortWorth.ts` metro config and the real `quote()` engine in
`src/metro/lib/pricing.ts` — nothing here is hand math. Re-run
`npx tsx scripts/metro/margin-scenarios.ts [main|qty|premium|delivery|headroom|matrix|tiered|cac|walkaway|all]`
to reproduce any table.

## Why this doc exists

`docs/metro/partners/economics.md` modeled 3 SKUs at 10 units and found that if a DFW
partner charges MGG its normal yard/counter price (the full `slug-stats.json` yard
median, not the catalog's assumed 0.85 wholesale discount), gross margin is only
**~5–7%**, and goes **negative** if the partner quotes 10% over median. This doc
generalizes that finding to **all 22 catalog SKUs**, 3 order sizes (5/10/20 units), 2
zones (cheapest `dfw-core` and farthest `dfw-outer`), 4 partner-discount scenarios, 4
partner-delivery-cost scenarios, and 8 MGG pricing structures, then works out what
pricing structure — and what partner discount — actually closes the gap.

## Method

- **MGG delivered price**: the real `quote()` output (`basePrice`) from
  `src/metro/lib/pricing.ts`, run against a cloned metro object with `pricing.premiumRate`
  varied (service-fee scenarios add a flat dollar amount to the 0.25 `basePrice`).
- **Partner material cost**: `slug-stats.json`'s `yard_median` (the material price a DFW
  yard actually charges a counter customer, per `dfw-pricing-v2.md`) × quantity ×
  discount factor {0.85, 0.90, 1.00, 1.10}. **`bank-sand` has no yard-class row in
  `slug-stats.json`** (`yard_median: null`) — this script falls back to
  `nodePricePerUnit / 0.85` ($51.11/ton), the same v1-scrape carry-over number
  `dfw-pricing-v2.md` documents; flagged in every table below.
- **Partner delivery cost**: either (a) the same `zone.loadCost × truck.deliveryCostFactor`
  figure `quote()` already computes for MGG (the "zone loadCost" scenario — matches
  `economics.md`'s placeholder method), or (b) a flat $45/$100/$150 per truck load (the
  real DFW delivery-fee benchmarks from `dfw-pricing-v2.md`), scaled by the number of
  loads `planLoads()` returns for that quantity.
- **Stripe fee**: 2.9% + $0.30 on the full MGG delivered price, once per order.
- **Broker-delivered comparison**: `slug-stats.json`'s `broker_delivered_median` × quantity
  (same "raw median × qty" method `dfw-pricing-v2.md`'s 10-unit table uses). `brown-dyed`
  has zero broker-delivered sellers — flagged as "no broker data" everywhere, never
  silently excluded from a denominator without a footnote.
- **Gross margin** = MGG price − partner cost − Stripe fee, in dollars and as % of MGG
  price.

## Table 1 — 10-unit orders, cheapest zone (`dfw-core`), baseline premiumRate 0.25

Zone-loadCost delivery scenario (partner delivery cost = the same figure `quote()`
computes for MGG). Partner material cost shown at all 4 discount factors.

| SKU | Yard median | Broker median (order) | MGG price | Cost@0.85x | Cost@0.9x | Cost@1x | Cost@1.1x | Margin%@0.85x | Margin%@0.9x | Margin%@1x | Margin%@1.1x | Below broker? |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| pea-gravel | $71.43 | $1067.70 | $900.00 | $717.66 | $753.37 | $824.80 | $896.23 | 17.3% | 13.4% | 5.4% | -2.5% | YES |
| 57-limestone | $64.29 | $845.40 | $825.00 | $656.97 | $689.11 | $753.40 | $817.69 | 17.4% | 13.5% | 5.7% | -2.1% | YES |
| flex-base | $46.43 | $845.00 | $635.00 | $505.15 | $528.37 | $574.80 | $621.23 | 17.5% | 13.8% | 6.5% | -0.8% | YES |
| decomposed-granite | $100.72 | $1219.20 | $1210.00 | $966.58 | $1016.94 | $1117.65 | $1218.37 | 17.2% | 13.0% | 4.7% | -3.6% | YES |
| rip-rap | $67.86 | $1147.10 | $860.00 | $687.31 | $721.24 | $789.10 | $856.96 | 17.1% | 13.2% | 5.3% | -2.6% | YES |
| river-rock | $102.50 | $2333.60 | $1230.00 | $981.75 | $1033.00 | $1135.50 | $1238.00 | 17.3% | 13.1% | 4.8% | -3.6% | YES |
| mason-sand | $57.41 | $862.00 | $750.00 | $598.48 | $627.19 | $684.60 | $742.01 | 17.3% | 13.4% | 5.8% | -1.9% | YES |
| bank-sand *(yard median fallback)* | $51.11 | $720.40 | $685.00 | $544.90 | $570.45 | $621.56 | $672.66 | 17.5% | 13.8% | 6.3% | -1.1% | YES |
| concrete-sand | $59.26 | $692.75 | $770.00 | $614.21 | $643.84 | $703.10 | $762.36 | 17.3% | 13.4% | 5.7% | -1.9% | **NO** |
| play-sand | $71.85 | $947.40 | $905.00 | $721.22 | $757.15 | $829.00 | $900.85 | 17.4% | 13.4% | 5.5% | -2.5% | YES |
| washed-sand | $58.34 | $852.10 | $760.00 | $606.35 | $635.51 | $693.85 | $752.19 | 17.3% | 13.4% | 5.8% | -1.9% | YES |
| native-hardwood | $41.00 | $941.00 | $575.00 | $458.96 | $479.46 | $520.45 | $561.45 | 17.2% | 13.7% | 6.5% | -0.6% | YES |
| black-dyed | $45.00 | $1082.90 | $620.00 | $493.00 | $515.50 | $560.50 | $605.50 | 17.5% | 13.9% | 6.6% | -0.6% | YES |
| brown-dyed | $48.00 | — | $650.00 | $518.50 | $542.50 | $590.50 | $638.50 | 17.3% | 13.6% | 6.2% | -1.2% | *no broker data* |
| dyed-red | $46.00 | $997.10 | $630.00 | $501.50 | $524.50 | $570.50 | $616.50 | 17.4% | 13.8% | 6.5% | -0.8% | YES |
| cedar | $59.00 | $783.00 | $765.00 | $612.00 | $641.50 | $700.50 | $759.50 | 17.1% | 13.2% | 5.5% | -2.2% | YES |
| pine-bark | $55.00 | $783.00 | $725.00 | $578.00 | $605.50 | $660.50 | $715.50 | 17.3% | 13.5% | 6.0% | -1.6% | YES |
| playground-mulch | $44.99 | $1398.95 | $620.00 | $492.92 | $515.41 | $560.40 | $605.39 | 17.5% | 13.9% | 6.7% | -0.6% | YES |
| sandy-loam | $45.00 | $826.85 | $620.00 | $493.00 | $515.50 | $560.50 | $605.50 | 17.5% | 13.9% | 6.6% | -0.6% | YES |
| garden-mix | $62.50 | $1051.20 | $805.00 | $641.71 | $672.96 | $735.45 | $797.95 | 17.3% | 13.5% | 5.7% | -2.1% | YES |
| compost | $52.50 | $733.95 | $700.00 | $556.75 | $583.00 | $635.50 | $688.00 | 17.5% | 13.8% | 6.3% | -1.2% | YES |
| select-fill | $27.96 | $549.10 | $440.00 | $348.20 | $362.19 | $390.15 | $418.12 | 17.9% | 14.7% | 8.4% | 2.0% | YES |

**Read at the realistic (1.0x, no negotiated discount) column: median margin ~5.9%,
20/21 comparable SKUs still clear broker (only `concrete-sand` fails), but every SKU
goes margin-negative once the partner quotes ~10% over its own median.** This confirms
`economics.md`'s 3-SKU finding holds catalog-wide, not just for the 3 SKUs it sampled.

## Table 2 — 10-unit orders, farthest zone (`dfw-outer`)

Same method, `dfw-outer` (loadCost $130 vs. `dfw-core`'s $85).

| SKU | Yard median | Broker median (order) | MGG price | Cost@0.85x | Cost@0.9x | Cost@1x | Cost@1.1x | Margin%@0.85x | Margin%@0.9x | Margin%@1x | Margin%@1.1x | Below broker? |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| pea-gravel | $71.43 | $1067.70 | $975.00 | $776.16 | $811.87 | $883.30 | $954.73 | 17.5% | 13.8% | 6.5% | -0.9% | YES |
| 57-limestone | $64.29 | $845.40 | $895.00 | $715.47 | $747.61 | $811.90 | $876.19 | 17.1% | 13.5% | 6.4% | -0.8% | **NO** |
| flex-base | $46.43 | $845.00 | $705.00 | $563.65 | $586.87 | $633.30 | $679.73 | 17.1% | 13.8% | 7.2% | 0.6% | YES |
| decomposed-granite | $100.72 | $1219.20 | $1285.00 | $1025.08 | $1075.43 | $1176.15 | $1276.87 | 17.3% | 13.4% | 5.5% | -2.3% | **NO** |
| rip-rap | $67.86 | $1147.10 | $935.00 | $745.81 | $779.74 | $847.60 | $915.46 | 17.3% | 13.7% | 6.4% | -0.8% | YES |
| river-rock | $102.50 | $2333.60 | $1305.00 | $1040.25 | $1091.50 | $1194.00 | $1296.50 | 17.4% | 13.4% | 5.6% | -2.3% | YES |
| mason-sand | $57.41 | $862.00 | $825.00 | $656.98 | $685.69 | $743.10 | $800.51 | 17.4% | 13.9% | 7.0% | 0.0% | YES |
| bank-sand *(yard median fallback)* | $51.11 | $720.40 | $755.00 | $603.40 | $628.95 | $680.06 | $731.16 | 17.1% | 13.8% | 7.0% | 0.2% | **NO** |
| concrete-sand | $59.26 | $692.75 | $845.00 | $672.71 | $702.34 | $761.60 | $820.86 | 17.5% | 13.9% | 6.9% | -0.1% | **NO** |
| play-sand | $71.85 | $947.40 | $975.00 | $779.72 | $815.65 | $887.50 | $959.35 | 17.1% | 13.4% | 6.0% | -1.3% | **NO** |
| washed-sand | $58.34 | $852.10 | $835.00 | $664.85 | $694.01 | $752.35 | $810.69 | 17.4% | 13.9% | 7.0% | -0.0% | YES |
| native-hardwood | $41.00 | $941.00 | $650.00 | $517.46 | $537.96 | $578.95 | $619.95 | 17.4% | 14.3% | 8.0% | 1.7% | YES |
| black-dyed | $45.00 | $1082.90 | $690.00 | $551.50 | $574.00 | $619.00 | $664.00 | 17.1% | 13.9% | 7.3% | 0.8% | YES |
| brown-dyed | $48.00 | — | $725.00 | $577.00 | $601.00 | $649.00 | $697.00 | 17.5% | 14.2% | 7.5% | 0.9% | *no broker data* |
| dyed-red | $46.00 | $997.10 | $700.00 | $560.00 | $583.00 | $629.00 | $675.00 | 17.1% | 13.8% | 7.2% | 0.6% | YES |
| cedar | $59.00 | $783.00 | $840.00 | $670.50 | $700.00 | $759.00 | $818.00 | 17.2% | 13.7% | 6.7% | -0.3% | **NO** |
| pine-bark | $55.00 | $783.00 | $800.00 | $636.50 | $664.00 | $719.00 | $774.00 | 17.5% | 14.1% | 7.2% | 0.3% | **NO** |
| playground-mulch | $44.99 | $1398.95 | $690.00 | $551.41 | $573.91 | $618.90 | $663.89 | 17.1% | 13.9% | 7.4% | 0.8% | YES |
| sandy-loam | $45.00 | $826.85 | $690.00 | $551.50 | $574.00 | $619.00 | $664.00 | 17.1% | 13.9% | 7.3% | 0.8% | YES |
| garden-mix | $62.50 | $1051.20 | $880.00 | $700.21 | $731.46 | $793.95 | $856.45 | 17.5% | 13.9% | 6.8% | -0.3% | YES |
| compost | $52.50 | $733.95 | $770.00 | $615.25 | $641.50 | $694.00 | $746.50 | 17.2% | 13.7% | 6.9% | 0.1% | **NO** |
| select-fill | $27.96 | $549.10 | $510.00 | $406.70 | $420.69 | $448.65 | $476.62 | 17.3% | 14.6% | 9.1% | 3.6% | YES |

**The farthest zone's higher delivery cost pushes 8 SKUs above broker at premiumRate
0.25** (57-limestone, decomposed-granite, bank-sand, concrete-sand, play-sand, cedar,
pine-bark, compost) — vs. only 1 (concrete-sand) in the cheapest zone. Every one of
these is a SKU this doc's headroom analysis (Table 5) independently flags as thin — the
zone effect and the SKU-headroom effect point at the same set of SKUs, reinforcing that
these are structurally tight, not a rounding artifact.

## Table 3 — Order-size sensitivity (5 & 20 units), `dfw-core`, partner @ 1.0x yard median

| Qty | SKU | MGG price | Partner cost @1.0x | Margin $ | Margin % | Below broker? |
|---|---|---:|---:|---:|---:|---|
| 5 | pea-gravel | $490.00 | $442.15 | $33.34 | 6.8% | YES |
| 5 | 57-limestone | $450.00 | $406.45 | $30.20 | 6.7% | **NO** |
| 5 | decomposed-granite | $645.00 | $588.58 | $37.42 | 5.8% | **NO** |
| 5 | bank-sand | $380.00 | $340.53 | $28.15 | 7.4% | **NO** |
| 5 | concrete-sand | $425.00 | $381.30 | $31.07 | 7.3% | **NO** |
| 5 | play-sand | $490.00 | $444.25 | $31.24 | 6.4% | **NO** |
| 5 | cedar | $420.00 | $380.00 | $27.52 | 6.6% | **NO** |
| 5 | pine-bark | $400.00 | $360.00 | $28.10 | 7.0% | **NO** |
| 5 | compost | $390.00 | $347.50 | $30.89 | 7.9% | **NO** |
| 5 | *(other 13 SKUs)* | — | — | — | 6.4–8.8% | YES |
| 20 | pea-gravel | $1710.00 | $1581.60 | $78.51 | 4.6% | YES |
| 20 | concrete-sand | $1455.00 | $1338.20 | $74.30 | 5.1% | **NO** |
| 20 | *(other 20 SKUs)* | — | — | — | 4.1–6.9% | YES |

Full per-SKU rows reproducible via `npx tsx scripts/metro/margin-scenarios.ts qty`.
**Two effects compound at 5 units**: this is where the thin-headroom SKUs from Table 5
first fail "below broker" even at the cheapest zone (7 of them, vs. just 1 at 10 units),
because the delivery-cost term is a *larger share* of a smaller order and pushes the MGG
price up relative to material cost. **At 20 units, margin % compresses slightly for every
SKU** (material cost dominates and premium is applied to the same rate, but the
additional-load delivery discount and the fixed $0.30 Stripe component both matter
relatively less at scale) — `concrete-sand` is the one SKU that fails "below broker" at
all three quantities tested.

## Table 4 — MGG pricing-structure sensitivity (aggregate, 22 SKUs, 10 units, `dfw-core`, partner @ 1.0x yard median)

| Structure | # SKUs below broker / comparable | Median margin % | Avg margin $/order |
|---|---|---:|---:|
| premiumRate 0.25 (current) | 20 / 21 | 5.9% | $44.43 |
| premiumRate 0.30 | 17 / 21 | 9.5% | $73.56 |
| premiumRate 0.35 | 13 / 21 | 12.7% | $103.13 |
| premiumRate 0.40 | 13 / 21 | 15.6% | $131.82 |
| premiumRate 0.50 | 10 / 21 | 21.1% | $190.74 |
| 0.25 + $49 flat fee | 14 / 21 | 11.6% | $92.00 |
| 0.25 + $79 flat fee | 13 / 21 | 14.7% | $121.13 |
| 0.25 + $99 flat fee | 12 / 21 | 16.7% | $140.55 |

**No uniform premium or flat-fee structure simultaneously clears ≥20% margin and keeps
most SKUs below broker.** The only row that reaches 20%+ margin (`premiumRate 0.50`,
21.1%) does so by giving up over half the broker-clearance rate (10/21, down from 20/21
at 0.25) — direct evidence that a single number for the whole catalog is the wrong lever
(see Table 5/6).

## Table 5 — Delivery-cost benchmark sensitivity (aggregate, 22 SKUs, 10 units, `dfw-core`, MGG @ premiumRate 0.25)

| Partner delivery scenario | # SKUs below broker / comparable | Median margin % | Avg margin $/order |
|---|---|---:|---:|
| Zone loadCost (MGG-equivalent, $110.50/load) | 20 / 21 | 5.9% | $44.43 |
| $45/load flat | 20 / 21 | 14.8% | $109.93 |
| $100/load flat | 20 / 21 | 7.3% | $54.93 |
| $150/load flat | 20 / 21 | 0.5% | $4.93 |

"Below broker" is unaffected here (it only depends on the MGG side of the formula), but
margin swings **from near-zero to ~15%** purely on what the partner actually bills for
delivery — the single biggest open unknown, exactly as `economics.md` flagged. At the
high end of the real $45–$150/load DFW benchmark range, margin is closer to breakeven
than any other lever in this doc, worse than a 10% partner-material markup.

## Table 6 — Headroom: max premiumRate before crossing broker, per SKU (10 units, `dfw-core`)

`maxPremium = brokerOrderPrice / (materialCost + deliveryCost) − 1`, i.e. how far
`premiumRate` could rise before this SKU alone crosses its broker-delivered median
(ignoring `roundTo`). This is the basis for the tiered recommendation below.

| Category | SKU | Cost basis | Broker order price | Max premiumRate before crossing broker |
|---|---|---:|---:|---:|
| gravel | pea-gravel | $717.70 | $1067.70 | 48.8% |
| gravel | 57-limestone | $657.00 | $845.40 | **28.7%** |
| gravel | flex-base | $505.20 | $845.00 | 67.3% |
| gravel | decomposed-granite | $966.60 | $1219.20 | **26.1%** |
| gravel | rip-rap | $687.30 | $1147.10 | 66.9% |
| gravel | river-rock | $981.80 | $2333.60 | 137.7% |
| sand | mason-sand | $598.50 | $862.00 | 44.0% |
| sand | bank-sand | $544.90 | $720.40 | **32.2%** |
| sand | concrete-sand | $614.20 | $692.75 | **12.8%** |
| sand | play-sand | $721.20 | $947.40 | **31.4%** |
| sand | washed-sand | $606.30 | $852.10 | 40.5% |
| mulch | native-hardwood | $459.00 | $941.00 | 105.0% |
| mulch | black-dyed | $493.00 | $1082.90 | 119.7% |
| mulch | brown-dyed | $518.50 | — | *no broker data* |
| mulch | dyed-red | $501.50 | $997.10 | 98.8% |
| mulch | cedar | $612.00 | $783.00 | **27.9%** |
| mulch | pine-bark | $578.00 | $783.00 | 35.5% |
| mulch | playground-mulch | $492.90 | $1398.95 | 183.8% |
| soil | sandy-loam | $493.00 | $826.85 | 67.7% |
| soil | garden-mix | $641.70 | $1051.20 | 63.8% |
| soil | compost | $556.80 | $733.95 | **31.8%** |
| soil | select-fill | $348.20 | $549.10 | 57.7% |

**Headroom does not line up cleanly by category** — mulch spans 27.9% (cedar) to 183.8%
(playground-mulch); gravel spans 26.1% (decomposed-granite) to 137.7% (river-rock). A
per-category premium (as the task brief suggested as one option) would either leave
money on the table for high-headroom mulch/gravel SKUs or push thin ones over broker.
**Per-SKU tiering by headroom, not by category, is the structure this data supports.**

## Table 7 — premiumRate × partner-discount matrix (aggregate, 22 SKUs, 10 units, `dfw-core`)

| premiumRate | Partner discount | # below broker / comparable | Median margin % | Avg margin $/order |
|---:|---:|---|---:|---:|
| 0.25 | 0.85x | 20/21 | 17.3% | $131.57 |
| 0.25 | 0.90x | 20/21 | 13.5% | $102.52 |
| 0.25 | 1.00x | 20/21 | 5.9% | $44.43 |
| 0.25 | 1.10x | 20/21 | -1.8% | -$13.67 |
| 0.30 | 0.85x | 17/21 | 20.4% | $160.70 |
| 0.30 | 0.90x | 17/21 | 16.7% | $131.65 |
| 0.30 | 1.00x | 17/21 | 9.5% | $73.56 |
| 0.35 | 0.85x | 13/21 | 23.3% | $190.27 |
| 0.35 | 0.90x | 13/21 | 19.7% | $161.22 |
| 0.40 | 0.85x | 13/21 | 25.8% | $218.96 |
| 0.50 | 1.00x | 10/21 | 21.1% | $190.74 |

**"Below broker" coverage tracks `premiumRate` only** (partner discount doesn't move MGG's
price at all) — so the broker constraint is purely a function of the pricing structure,
while margin is a function of both the structure and what the partner actually charges.
The best simultaneous outcome in this matrix is **`premiumRate 0.30` at an 0.85–0.90x
partner discount** (17/21 below broker, 16.7–20.4% margin) — but that still depends on
negotiating a 10–15% partner discount, which is not yet in hand for any DFW partner
(`docs/metro/partners/partner-due-diligence.md`: all three shortlisted yards
"unverified — ask on call").

## Table 8 — Recommended tiered structure (10 units, `dfw-core`, partner @ 1.0x yard median — realistic/undiscounted case)

Per-SKU `premiumRate`, assigned from Table 6's headroom: **<35% headroom → 0.25** (7
SKUs), **35–70% headroom (+ `brown-dyed`, no data, conservative) → 0.35** (10 SKUs),
**>70% headroom → 0.45** (5 SKUs).

| SKU | Tier premiumRate | MGG price | Partner cost @1.0x | Margin $ | Margin % | Below broker? |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | 0.35 | $970.00 | $824.80 | $116.77 | 12.0% | YES |
| 57-limestone | 0.25 | $825.00 | $753.40 | $47.37 | 5.7% | YES |
| flex-base | 0.35 | $685.00 | $574.80 | $90.04 | 13.1% | YES |
| decomposed-granite | 0.25 | $1210.00 | $1117.65 | $56.96 | 4.7% | YES |
| rip-rap | 0.35 | $930.00 | $789.10 | $113.63 | 12.2% | YES |
| river-rock | 0.45 | $1425.00 | $1135.50 | $247.88 | 17.4% | YES |
| mason-sand | 0.35 | $810.00 | $684.60 | $101.61 | 12.5% | YES |
| bank-sand | 0.25 | $685.00 | $621.56 | $43.28 | 6.3% | YES |
| concrete-sand | 0.25 | $770.00 | $703.10 | $44.27 | 5.7% | **NO** |
| play-sand | 0.25 | $905.00 | $829.00 | $49.45 | 5.5% | YES |
| washed-sand | 0.35 | $820.00 | $693.85 | $102.07 | 12.4% | YES |
| native-hardwood | 0.45 | $670.00 | $520.45 | $129.82 | 19.4% | YES |
| black-dyed | 0.45 | $715.00 | $560.50 | $133.47 | 18.7% | YES |
| brown-dyed | 0.35 | $700.00 | $590.50 | $88.90 | 12.7% | *no broker data* |
| dyed-red | 0.45 | $730.00 | $570.50 | $138.03 | 18.9% | YES |
| cedar | 0.25 | $765.00 | $700.50 | $42.02 | 5.5% | YES |
| pine-bark | 0.35 | $785.00 | $660.50 | $101.44 | 12.9% | **NO** |
| playground-mulch | 0.45 | $715.00 | $560.40 | $133.56 | 18.7% | YES |
| sandy-loam | 0.35 | $670.00 | $560.50 | $89.77 | 13.4% | YES |
| garden-mix | 0.35 | $870.00 | $735.45 | $109.02 | 12.5% | YES |
| compost | 0.25 | $700.00 | $635.50 | $43.90 | 6.3% | YES |
| select-fill | 0.35 | $475.00 | $390.15 | $70.78 | 14.9% | YES |

**Aggregate: 19/21 below broker, median margin 12.5%, avg margin $95.18/order** — more
than double the current-structure baseline's $44.43/order avg margin, while giving up
broker-clearance on only 1 more SKU than the current 0.25 baseline (vs. giving up 7–8
SKUs under any uniform premium ≥0.35). `pine-bark` newly fails "below broker" under this
tiering (its headroom, 35.5%, sits just over the 35% tier boundary and 0.35 pushes it
slightly over); moving it to the 0.25 tier would fix that at a ~$25 margin cost — a real,
disclosed trade-off, not hidden.

## Table 9 — CAC / break-even (recommended tiered structure, realistic partner cost)

Avg gross margin $/order across all 22 SKUs at 1.0x partner cost: **$95.18**.
`dfw-90-day-gtm-v2.md` §6 states a **$50/order** all-in CAC ceiling (a spend-cap artifact
of the $5,000/100-orders goal, not a margin-derived target — the same doc flags this gap
explicitly, `[NEEDS_REAL_NUMBER]`). This table supplies that real number.

| CAC/order | Contribution $/order (margin − CAC) | Orders to break even on $5,000 |
|---:|---:|---:|
| $50 | $45.18 | 111 |
| $100 | -$4.82 | never (CAC exceeds margin) |
| $150 | -$54.82 | never (CAC exceeds margin) |

**The GTM doc's own $50 CAC ceiling is, coincidentally, almost exactly the level at which
this pricing structure remains viable** — $50 leaves $45.18 contribution/order (111
orders to exhaust the $5,000 launch budget, well under the 100-order goal's implied
pace). A CAC of $100 or more — plausible for paid Search/ChatGPT ads before the
brand has any track record — **erases the entire margin under this structure at
realistic (undiscounted) partner pricing.** This is the strongest evidence in this doc
that CAC discipline (§4.2/4.3's kill rules in the GTM doc) is not optional headroom, it's
load-bearing.

## Table 10 — Walk-away partner price per SKU (≥20% gross margin, recommended tiered structure, 10 units, `dfw-core`)

The maximum partner material price per unit MGG can accept and still clear a 20% gross
margin, under Table 8's tiered `premiumRate`. **This is the number to carry into
`docs/metro/partners/price-sheet-template.md`'s `price_per_unit_pickup` column as a
ceiling** — any partner quote at or below the "Walk-away partner $/unit" column clears
20% margin; anything above it doesn't, at this delivery-cost assumption.

| SKU | Tier premiumRate | Yard median $/unit | MGG price (10-unit) | Walk-away partner $/unit | Walk-away as % of yard median | Current catalog 0.85x node price $/unit |
|---|---:|---:|---:|---:|---:|---:|
| pea-gravel | 0.35 | $71.43 | $970.00 | $63.71 | 89.2% | $60.72 |
| 57-limestone | 0.25 | $64.29 | $825.00 | $52.53 | 81.7% | $54.65 |
| flex-base | 0.35 | $46.43 | $685.00 | $41.73 | 89.9% | $39.47 |
| decomposed-granite | 0.25 | $100.72 | $1210.00 | $82.21 | 81.6% | $85.61 |
| rip-rap | 0.35 | $67.86 | $930.00 | $60.62 | 89.3% | $57.68 |
| river-rock | 0.45 | $102.50 | $1425.00 | $98.79 | 96.4% | $87.13 |
| mason-sand | 0.35 | $57.41 | $810.00 | $51.37 | 89.5% | $48.80 |
| bank-sand | 0.25 | $51.11 | $685.00 | $41.73 | 81.7% | $43.44 |
| concrete-sand | 0.25 | $59.26 | $770.00 | $48.29 | 81.5% | $50.37 |
| play-sand | 0.25 | $71.85 | $905.00 | $58.70 | 81.7% | $61.07 |
| washed-sand | 0.35 | $58.34 | $820.00 | $52.14 | 89.4% | $49.58 |
| native-hardwood | 0.45 | $41.00 | $670.00 | $40.58 | 99.0% | $34.85 |
| black-dyed | 0.45 | $45.00 | $715.00 | $44.05 | 97.9% | $38.25 |
| brown-dyed | 0.35 | $48.00 | $700.00 | $42.89 | 89.4% | $40.80 |
| dyed-red | 0.45 | $46.00 | $730.00 | $45.20 | 98.3% | $39.10 |
| cedar | 0.25 | $59.00 | $765.00 | $47.90 | 81.2% | $50.15 |
| pine-bark | 0.35 | $55.00 | $785.00 | $49.44 | 89.9% | $46.75 |
| playground-mulch | 0.45 | $44.99 | $715.00 | $44.05 | 97.9% | $38.24 |
| sandy-loam | 0.35 | $45.00 | $670.00 | $40.58 | 90.2% | $38.25 |
| garden-mix | 0.35 | $62.50 | $870.00 | $56.00 | 89.6% | $53.12 |
| compost | 0.25 | $52.50 | $700.00 | $42.89 | 81.7% | $44.63 |
| select-fill | 0.35 | $27.96 | $475.00 | $25.54 | 91.3% | $23.77 |

**Headline: to clear 20% gross margin under the recommended tiered structure, MGG needs
roughly an 18–19% discount off yard median on the 7 Tier-1 (thin-headroom) SKUs**
(57-limestone, decomposed-granite, bank-sand, concrete-sand, play-sand, cedar, compost —
all land at 81.2–81.7% of yard median, i.e. close to but slightly *more aggressive than*
the catalog's existing 0.85x assumption) **and only a 1–11% discount on Tier-2/3 SKUs**
(89–99% of yard median) — mulch in particular (`native-hardwood` 99.0%, `dyed-red`
98.3%, `black-dyed`/`playground-mulch` 97.9%) needs almost no discount at all to clear
20% margin, because its broker headroom lets the premium alone carry most of the margin.
**Practical implication for partner negotiation**: don't ask for a flat 15% discount
across the board — ask for the deepest discount on gravel/stone and select sand/mulch
commodities (Tier 1), and treat a near-retail price on mulch as acceptable.

## Flagged SKUs

- **`concrete-sand`** fails "below broker" at every quantity and zone tested, at every
  premiumRate tested including the current 0.25 — confirms `dfw-pricing-v2.md`'s own
  flag ("cannot be fixed by [premiumRate] alone"). Its walk-away price ($48.29/unit,
  81.5% of yard median) is achievable but the SKU should be treated as a "quote on
  request" outlier pending a fresh broker sample, per that doc's recommendation.
- **`brown-dyed`** has zero broker-delivered sellers in `slug-stats.json` — every
  "below broker" cell in this doc reads "no broker data" for it, never silently
  defaulted to YES or excluded from a count without a footnote.
- **`bank-sand`** has no yard-class row in `slug-stats.json` at all — this doc falls back
  to `nodePricePerUnit / 0.85` ($51.11/ton), the same v1-scrape single-seller number
  `dfw-pricing-v2.md` flags as its lowest-confidence catalog price. Treat every `bank-sand`
  number in this doc as lower-confidence than the other 21 SKUs.
- **`pine-bark`** fails "below broker" only under the recommended tiered structure (Table
  8), not at the current 0.25 baseline — a direct, disclosed side effect of moving it to
  the 0.35 tier; see Table 8's note.
- **8 SKUs** (57-limestone, decomposed-granite, bank-sand, concrete-sand, play-sand,
  cedar, pine-bark, compost) fail "below broker" in the farthest zone (`dfw-outer`) at
  the current 0.25 baseline, vs. only 1 in the cheapest zone — the same set Table 6
  independently flags as thin-headroom. Zone-dependent pricing risk, not evenly spread
  across the catalog.

## Recommendation

**1. No single lever — uniform premium, flat fee, or partner discount alone — gets the
DFW catalog to ≥20% gross margin while staying below broker on most SKUs, if the partner
charges its full undiscounted yard-median price.** Table 4/7 show this directly: the only
uniform structure that reaches 20%+ margin (premiumRate 0.50) sacrifices more than half
the catalog's broker-clearance; every structure that keeps most SKUs below broker
(0.25–0.30) tops out around 6–17% margin at realistic partner cost.

**2. Adopt the tiered per-SKU premium structure in Table 8** — 0.25 for 7 thin-headroom
SKUs, 0.35 for 10 mid-headroom SKUs (+ `brown-dyed`, conservatively), 0.45 for 5
high-headroom mulch/gravel SKUs — over a uniform rate or a flat per-order fee. It nearly
doubles average margin per order ($95.18 vs. $44.43 at the current 0.25 baseline) while
giving up broker-clearance on only 1 SKU (`pine-bark`) more than the baseline, versus 7–8
SKUs lost under any uniform rate ≥0.35. **This still lands at ~12.5% median margin, not
20%**, at realistic (undiscounted) partner cost — pricing structure alone cannot close
the rest of the gap; a negotiated partner discount must.

**3. Use Table 10 as the walk-away discount ceiling per SKU when negotiating a partner
price sheet.** The ask is not uniform: **Tier-1 SKUs (57-limestone, decomposed-granite,
bank-sand, concrete-sand, play-sand, cedar, compost) need an ~18–19% discount off yard
median** to clear 20% margin under this structure — close to, and in most cases slightly
deeper than, the code's current 0.85x placeholder assumption. **Tier-2/3 SKUs, especially
mulch, need only a 1–11% discount** — their broker headroom means the premium itself
already funds most of the margin. Feed the "Walk-away partner $/unit" column directly
into `price-sheet-template.md`'s `price_per_unit_pickup` column as the ceiling MGG can
accept per SKU, once a real partner quote comes back.

**4. Gate paid CAC spend to the margin this structure actually produces, not the GTM
doc's placeholder $50 figure.** Table 9 shows the tiered structure's $95.18 avg margin
covers a $50 CAC (111 orders to exhaust the $5,000 launch budget) but is **fully consumed
by a $100 CAC** — before this pricing work, `dfw-90-day-gtm-v2.md` §6 had no real
margin-derived number to check its kill rules against (`[NEEDS_REAL_NUMBER]`); it does
now.

**5. Do not flip `priceBookConfirmed = true`** until a signed partner price sheet
replaces both the 0.85 wholesale-discount assumption and the delivery-cost placeholder
this whole doc (and `economics.md` before it) is built on — this doc sharpens the ask
(Table 10's per-SKU walk-away ceiling), it does not resolve the underlying uncertainty.

## Change log
- 2026-09-28: Created. Built `scripts/metro/margin-scenarios.ts`, importing the real
  `dallasFortWorth` metro config and `quote()`/`planLoads()` from
  `src/metro/lib/pricing.ts` plus `slug-stats.json`'s yard/broker medians. Modeled all 22
  catalog SKUs at 5/10/20 units, `dfw-core`/`dfw-outer` zones, 4 partner-discount factors,
  4 partner-delivery-cost scenarios, and 8 MGG pricing structures (5 premiumRates + 3
  flat service fees). Found `economics.md`'s 3-SKU ~5–7% margin finding holds catalog-wide
  (median 5.9% at realistic 1.0x partner cost); found no uniform premium/fee structure
  reaches 20% margin without losing broker-clearance on over half the catalog; built a
  per-SKU headroom table and a 3-tier premiumRate recommendation (0.25/0.35/0.45) that
  nearly doubles avg margin ($95.18 vs. $44.43) at a 1-SKU broker-clearance cost; computed
  a per-SKU walk-away partner discount table for the price-sheet ceiling; tied CAC
  break-even to the $5,000 launch budget using the GTM doc's $50 CAC target plus $100/$150
  sensitivities.
