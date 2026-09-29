# DFW Pricing v3 — $250/order Gross-Profit Floor

Status: implemented, 2026-09-28. Author: P2-PRICING-FLOOR. Every number below comes from
running `src/metro/lib/pricing.ts`'s real `quote()` against the real
`src/metro/config/dallasFortWorth.ts` config (via `npx tsx scripts/metro/margin-scenarios.ts
v3compare` and `... floor250`) — nothing here is hand math. Builds on
`docs/metro/research/dfw-pricing-v2.md` (cost-basis/catalog methodology) and
`docs/metro/research/dfw-margin-scenarios.md` (the tiered-premium recommendation this
pass adopts verbatim).

## Owner decision (2026-09-28)

> "Let's bump pricing. We want to make at least $250 per order."

Applied to **DFW only** (partner-fulfilled — MGG carries real counterparty risk on every
order and, per `dfw-margin-scenarios.md`, was clearing as little as ~5.9% median gross
margin at realistic partner cost before this change). **Long Island is unchanged** — it's
fulfilled from ELM's own yard with different, already-workable economics, and a typical
LI order (~$300) sits close enough to a $250 floor that applying one there risked
distorting pricing on orders that don't need it. The floor is implemented as a per-metro
config option (`Metro.pricing.minMarginPerOrder` + `paymentFeeRate` + `paymentFeeFixed`,
all optional) specifically so the owner can turn it on for Long Island later without any
engine changes — see "Config" below.

## Formula

For every quote, `quote()` now computes:

```
cost          = materialCost + deliveryCost                       (unchanged)
premiumPrice  = cost * (1 + premiumRate_sku)
floorPrice    = (cost + minMarginPerOrder + paymentFeeFixed) / (1 - paymentFeeRate)
rawPrice      = max(premiumPrice, floorPrice)                     (floorPrice only exists if the metro configures it)
basePrice     = roundUpTo(rawPrice, roundTo)                       (existing round-UP-only rounding)
premium       = basePrice - materialCost - deliveryCost            (so the floor's uplift shows as premium, not a hidden field)
```

`premiumRate_sku` is `MaterialVariant.premiumRate` if the variant sets one, else
`Metro.pricing.premiumRate`. `floorPrice` is the price at which
`basePrice - cost - stripeFee(basePrice) == minMarginPerOrder`, where
`stripeFee(p) = p * paymentFeeRate + paymentFeeFixed` (Stripe's real card fee: 2.9% +
$0.30). Because `roundUpTo` only ever *increases* the price, and `rawPrice` already
satisfies the floor before rounding, gross profit after rounding is always `>=
minMarginPerOrder` — rounding can never undercut the floor. `quote()` reports
`marginFloorApplied: boolean` (true when `floorPrice > premiumPrice`, i.e. the floor, not
the tiered premium, set the price) and `estimatedGrossProfit` (the real post-Stripe-fee
gross profit at the final rounded `basePrice`) whenever the metro configures a floor;
both are `undefined` on metros that don't (Long Island).

Gross profit is defined as: **customer's everyday delivered price (`basePrice`, before
Saturday/rush fees — those are extra margin on top) − partner cost (material + delivery,
as modeled by `quote()`) − Stripe fee (2.9% + $0.30 of the charged total)**, per the
orchestrator's task definition.

## Cost-basis change: yard median × 1.00, not × 0.85

Through the v2 pass, `dfwCatalog.ts`'s `nodePricePerUnit` = yard-class median × an
**unverified, assumed** 0.85 wholesale-discount factor — no DFW yard has actually quoted
MGG a wholesale rate. Stacking a $250 floor on top of an optimistic (too-low) cost basis
would understate what price is actually needed to hit $250 real gross profit once a real
partner quote lands. So this pass makes the cost basis **conservative**: the wholesale
factor now defaults to **1.00** (yard median as-is, no assumed discount) until a signed
DFW partner price sheet exists.

The factor is no longer implicit in a hand-computed JSON field. It's now an explicit,
named, overridable constant in `scripts/metro/catalog-from-proposal.mjs`:

```js
const DEFAULT_WHOLESALE_FACTOR = 1.0;
// override: node scripts/metro/catalog-from-proposal.mjs --factor=0.85
```

The script now recomputes `nodePricePerUnit` from each proposal entry's
`medianPricePerUnit` (the true yard-class median, unchanged by this pass) × the factor,
rather than trusting the JSON's cached `suggestedNodePricePerUnit` — and it rewrites that
cached field back into `docs/metro/research/data/dfw/catalog-proposal-v2.json` so the
proposal JSON and `dfwCatalog.ts` never drift apart. `scripts/competitors/merge-prices.mjs`
(which produces the underlying yard/broker medians in `slug-stats.json`) is unaffected —
it never applied a wholesale factor; a comment now points from there to
`catalog-from-proposal.mjs` so the factor's one true home is documented at both ends of
the pipeline.

Net effect: every DFW `nodePricePerUnit` moved up ~17.6% (1/0.85 − 1), e.g. pea gravel
$60.72 → $71.43, native hardwood mulch $34.85 → $41.00, sandy loam $38.25 → $45.00 (now
simply equal to the yard median, since the factor is 1.00).

## Tiered premiumRate (per-SKU, from `dfw-margin-scenarios.md` Table 8)

Each DFW variant now carries its own `premiumRate` in `dfwCatalog.ts`, generated by
`catalog-from-proposal.mjs`'s `PREMIUM_RATE_TIERS` map (kept in sync with
`margin-scenarios.ts`'s `TIERED_PREMIUM`, same source table, two consumers) — the exact
headroom-based tiering `dfw-margin-scenarios.md` Table 8 recommended:

| Tier | premiumRate | SKUs (7 / 10 / 5 = 22) |
|---|---:|---|
| 1 (<35% headroom before crossing broker) | 0.25 | 57-limestone, decomposed-granite, concrete-sand, bank-sand, play-sand, cedar, compost |
| 2 (35–70% headroom, + brown-dyed conservatively) | 0.35 | pea-gravel, mason-sand, washed-sand, pine-bark, sandy-loam, garden-mix, select-fill, flex-base, rip-rap, brown-dyed |
| 3 (>70% headroom) | 0.45 | river-rock, native-hardwood, black-dyed, dyed-red, playground-mulch |

`dallasFortWorth.pricing.premiumRate` (0.25) remains as the metro-wide fallback for any
future SKU added without a tier assignment; every current DFW variant sets its own, so
that fallback is currently unused.

## Config

`src/metro/config/dallasFortWorth.ts`:

```ts
pricing: {
  premiumRate: 0.25,          // fallback only — every variant overrides it
  additionalLoadDiscount: 0.25,
  saturdayFeeRate: 0.15,
  rushFeeRate: 0.15,
  roundTo: 5,
  minMarginPerOrder: 250,     // NEW — the $250/order floor
  paymentFeeRate: 0.029,      // NEW — Stripe 2.9%
  paymentFeeFixed: 0.3,       // NEW — Stripe $0.30
},
```

`src/metro/config/longIsland.ts` sets none of `minMarginPerOrder` / `paymentFeeRate` /
`paymentFeeFixed` — `quote()` treats a metro as floor-free unless **all three** are set,
so Long Island prices exactly as before (verified byte-identical below).

`src/metro/types.ts` additions (all optional, so Long Island and any future metro are
unaffected unless they opt in):
- `MaterialVariant.premiumRate?: number` — per-variant premium override.
- `Metro.pricing.minMarginPerOrder? / paymentFeeRate? / paymentFeeFixed?: number` — floor
  inputs.
- `QuoteResult.marginFloorApplied?: boolean` and `QuoteResult.estimatedGrossProfit?:
  number` — new, optional, `undefined` when the metro has no floor configured.

## Consumers checked

`grep -r "premium\|basePrice\|pricePerUnit" src/metro src/content src/pages
src/services/googleShopping` was walked end to end:
- **`PriceSummary.tsx`** never itemizes `premium` (its own header comment: "the premium
  is folded in, never itemized") — no display change needed. It shows `basePrice` and
  fees only, both of which behave exactly as before from the UI's point of view (they're
  just bigger numbers now).
- **`priceHelpers.ts`, `drivewayEstimate.ts`, `priceBookExport.ts`, `feedGenerator.ts`**
  all consume `quote()`'s output live (no hardcoded prices, no assumptions about
  `premium`'s internal makeup) — all pass unchanged.
- **`build-cost-index.mjs`** reads `slug-stats.json` (yard/broker medians) and
  `catalog-proposal-v2.json`'s name/category/unit fields only, never `nodePricePerUnit`
  or `premiumRate` — the DFW Cost Index (a market-price index, independent of MGG's own
  book) is unaffected in content; only regenerated (same numbers, refreshed
  `generatedAt`).
- **`export-price-book.mjs` / `google-merchant-sync/price-book.json`** regenerated —
  DFW's `basePrice`/`zonePrices` all moved up per the tables below; still `out_of_stock`
  everywhere (`priceBookConfirmed: false`), so nothing is live-advertised yet.
- **Tests that priced DFW SKUs by computing from config** (`pricing.test.ts`,
  `drivewayEstimate.test.ts`, `priceBookExport.test.ts`) needed no numeric fixes — they
  already assert `> 0` / structural invariants rather than pasted numbers. One test in
  `pricing.test.ts` did hardcode the *formula* (materialCost + delivery) × premiumRate
  without the floor or the per-variant override — updated to use `variant.premiumRate`
  and the floor formula (see pricing.test.ts).

## Per-SKU price table — 3 / 10 / 20 units, dfw-core & dfw-outer

Generated by `npx tsx scripts/metro/margin-scenarios.ts v3compare` (old = v2: flat 0.25
premium, 0.85× cost basis, no floor; new = v3: real current config). Gross profit is the
real post-Stripe `estimatedGrossProfit` at the new price. "vs. broker" compares the new
price to `slug-stats.json`'s broker-delivered median × quantity.

### dfw-core, 3 units

| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | $335.00 | $570.00 | +70.1% | $253.88 | $320.31 | above |
| 57-limestone | $315.00 | $545.00 | +73.0% | $251.03 | $253.62 | above |
| flex-base | $255.00 | $490.00 | +92.2% | $251.20 | $253.50 | above |
| decomposed-granite | $430.00 | $660.00 | +53.5% | $253.40 | $365.76 | above |
| rip-rap | $325.00 | $555.00 | +70.8% | $250.03 | $344.13 | above |
| river-rock | $435.00 | $665.00 | +52.9% | $252.91 | $700.08 | below |
| mason-sand | $290.00 | $525.00 | +81.0% | $252.24 | $258.60 | above |
| bank-sand | $270.00 | $505.00 | +87.0% | $251.73 | $216.12 | above |
| concrete-sand | $300.00 | $530.00 | +76.7% | $251.55 | $207.83 | above |
| play-sand | $340.00 | $570.00 | +67.6% | $252.62 | $284.22 | above |
| washed-sand | $295.00 | $530.00 | +79.7% | $254.31 | $255.63 | above |
| native-hardwood | $240.00 | $475.00 | +97.9% | $252.93 | $282.30 | above |
| black-dyed | $250.00 | $485.00 | +94.0% | $250.63 | $324.87 | above |
| brown-dyed | $260.00 | $495.00 | +90.4% | $251.34 | — | no broker data |
| dyed-red | $255.00 | $490.00 | +92.2% | $252.49 | $299.13 | above |
| cedar | $295.00 | $530.00 | +79.7% | $252.33 | $234.90 | above |
| pine-bark | $285.00 | $520.00 | +82.5% | $254.62 | $234.90 | above |
| playground-mulch | $250.00 | $485.00 | +94.0% | $250.66 | $419.69 | above |
| sandy-loam | $250.00 | $485.00 | +94.0% | $250.63 | $248.06 | above |
| garden-mix | $310.00 | $540.00 | +74.2% | $251.54 | $315.36 | above |
| compost | $275.00 | $510.00 | +85.5% | $252.41 | $220.19 | above |
| select-fill | $200.00 | $435.00 | +117.5% | $253.18 | $164.73 | above |

**1/21 below broker** (only river-rock — the one SKU with enough broker headroom for a
low quantity to still clear it).

### dfw-core, 10 units

| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | $900.00 | $1115.00 | +23.9% | $257.56 | $1067.70 | above |
| 57-limestone | $825.00 | $1035.00 | +25.5% | $251.28 | $845.40 | above |
| flex-base | $635.00 | $850.00 | +33.9% | $250.25 | $845.00 | above |
| decomposed-granite | $1210.00 | $1410.00 | +16.5% | $251.11 | $1219.20 | above |
| rip-rap | $860.00 | $1075.00 | +25.0% | $254.42 | $1147.10 | below |
| river-rock | $1230.00 | $1650.00 | +34.1% | $466.35 | $2333.60 | below |
| mason-sand | $750.00 | $965.00 | +28.7% | $252.12 | $862.00 | above |
| bank-sand | $685.00 | $900.00 | +31.4% | $252.00 | $720.40 | above |
| concrete-sand | $770.00 | $985.00 | +27.9% | $253.03 | $692.75 | above |
| play-sand | $905.00 | $1115.00 | +23.2% | $253.37 | $947.40 | above |
| washed-sand | $760.00 | $975.00 | +28.3% | $252.52 | $852.10 | above |
| native-hardwood | $575.00 | $795.00 | +38.3% | $251.15 | $941.00 | below |
| black-dyed | $620.00 | $840.00 | +35.5% | $254.84 | $1082.90 | below |
| brown-dyed | $650.00 | $870.00 | +33.8% | $253.97 | — | no broker data |
| dyed-red | $630.00 | $850.00 | +34.9% | $254.55 | $997.10 | below |
| cedar | $765.00 | $980.00 | +28.1% | $250.78 | $783.00 | above |
| pine-bark | $725.00 | $940.00 | +29.7% | $251.94 | $783.00 | above |
| playground-mulch | $620.00 | $835.00 | +34.7% | $250.08 | $1398.95 | below |
| sandy-loam | $620.00 | $840.00 | +35.5% | $254.84 | $826.85 | above |
| garden-mix | $805.00 | $1020.00 | +26.7% | $254.62 | $1051.20 | below |
| compost | $700.00 | $915.00 | +30.7% | $252.66 | $733.95 | above |
| select-fill | $440.00 | $660.00 | +50.0% | $250.36 | $549.10 | above |

**7/21 below broker** (rip-rap, river-rock, native-hardwood, black-dyed, dyed-red,
playground-mulch, garden-mix) — down from 20/21 under the old v2 structure.

### dfw-core, 20 units

| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | $1710.00 | $2140.00 | +25.1% | $496.04 | $2135.40 | above |
| 57-limestone | $1560.00 | $1800.00 | +15.4% | $308.70 | $1690.80 | above |
| flex-base | $1180.00 | $1465.00 | +24.2% | $340.62 | $1690.00 | below |
| decomposed-granite | $2335.00 | $2710.00 | +16.1% | $463.71 | $2438.40 | above |
| rip-rap | $1635.00 | $2040.00 | +24.8% | $470.34 | $2294.20 | below |
| river-rock | $2370.00 | $3195.00 | +34.8% | $899.04 | $4667.20 | below |
| mason-sand | $1415.00 | $1760.00 | +24.4% | $407.46 | $1724.00 | above |
| bank-sand | $1280.00 | $1470.00 | +14.8% | $251.87 | $1440.80 | above |
| concrete-sand | $1455.00 | $1675.00 | +15.1% | $287.92 | $1385.50 | above |
| play-sand | $1720.00 | $1990.00 | +15.7% | $341.99 | $1894.80 | above |
| washed-sand | $1435.00 | $1785.00 | +24.4% | $413.13 | $1704.20 | above |
| native-hardwood | $1065.00 | $1415.00 | +32.9% | $400.67 | $1882.00 | below |
| black-dyed | $1150.00 | $1530.00 | +33.0% | $432.33 | $2165.80 | below |
| brown-dyed | $1215.00 | $1505.00 | +23.9% | $348.06 | — | no broker data |
| dyed-red | $1170.00 | $1560.00 | +33.3% | $441.46 | $1994.20 | below |
| cedar | $1445.00 | $1670.00 | +15.6% | $288.27 | $1566.00 | above |
| pine-bark | $1360.00 | $1695.00 | +24.6% | $392.55 | $1566.00 | above |
| playground-mulch | $1150.00 | $1530.00 | +33.0% | $432.53 | $2797.90 | below |
| sandy-loam | $1150.00 | $1425.00 | +23.9% | $330.38 | $1653.70 | below |
| garden-mix | $1520.00 | $1895.00 | +24.7% | $436.75 | $2102.40 | below |
| compost | $1310.00 | $1505.00 | +14.9% | $258.06 | $1467.90 | above |
| select-fill | $790.00 | $995.00 | +25.9% | $253.45 | $1098.20 | below |

**10/21 below broker** (flex-base, rip-rap, river-rock, native-hardwood, black-dyed,
dyed-red, playground-mulch, sandy-loam, garden-mix, select-fill) — *more* SKUs clear
broker at 20 units than at 10; see "Small-order competitiveness" below for why.

### dfw-outer, 3 units

| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | $395.00 | $615.00 | +55.7% | $252.57 | $320.31 | above |
| 57-limestone | $370.00 | $595.00 | +60.8% | $254.57 | $253.62 | above |
| flex-base | $315.00 | $540.00 | +71.4% | $254.75 | $253.50 | above |
| decomposed-granite | $485.00 | $705.00 | +45.4% | $252.10 | $365.76 | above |
| rip-rap | $380.00 | $605.00 | +59.2% | $253.58 | $344.13 | above |
| river-rock | $490.00 | $710.00 | +44.9% | $251.61 | $700.08 | above |
| mason-sand | $350.00 | $570.00 | +62.9% | $250.94 | $258.60 | above |
| bank-sand | $330.00 | $550.00 | +66.7% | $250.42 | $216.12 | above |
| concrete-sand | $355.00 | $575.00 | +62.0% | $250.25 | $207.83 | above |
| play-sand | $395.00 | $615.00 | +55.7% | $251.32 | $284.22 | above |
| washed-sand | $350.00 | $575.00 | +64.3% | $253.01 | $255.63 | above |
| native-hardwood | $295.00 | $520.00 | +76.3% | $251.62 | $282.30 | above |
| black-dyed | $310.00 | $535.00 | +72.6% | $254.19 | $324.87 | above |
| brown-dyed | $320.00 | $540.00 | +68.8% | $250.04 | — | no broker data |
| dyed-red | $310.00 | $535.00 | +72.6% | $251.19 | $299.13 | above |
| cedar | $355.00 | $575.00 | +62.0% | $251.03 | $234.90 | above |
| pine-bark | $340.00 | $565.00 | +66.2% | $253.31 | $234.90 | above |
| playground-mulch | $310.00 | $535.00 | +72.6% | $254.21 | $419.69 | above |
| sandy-loam | $310.00 | $535.00 | +72.6% | $254.19 | $248.06 | above |
| garden-mix | $365.00 | $585.00 | +60.3% | $250.24 | $315.36 | above |
| compost | $330.00 | $555.00 | +68.2% | $251.10 | $220.19 | above |
| select-fill | $255.00 | $480.00 | +88.2% | $251.87 | $164.73 | above |

**0/21 below broker.**

### dfw-outer, 10 units

| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | $975.00 | $1195.00 | +22.6% | $276.74 | $1067.70 | above |
| 57-limestone | $895.00 | $1095.00 | +22.3% | $251.04 | $845.40 | above |
| flex-base | $705.00 | $910.00 | +29.1% | $250.01 | $845.00 | above |
| decomposed-granite | $1285.00 | $1475.00 | +14.8% | $255.72 | $1219.20 | above |
| rip-rap | $935.00 | $1145.00 | +22.5% | $263.89 | $1147.10 | below |
| river-rock | $1305.00 | $1735.00 | +33.0% | $490.38 | $2333.60 | below |
| mason-sand | $825.00 | $1025.00 | +24.2% | $251.88 | $862.00 | above |
| bank-sand | $755.00 | $960.00 | +27.2% | $251.76 | $720.40 | above |
| concrete-sand | $845.00 | $1045.00 | +23.7% | $252.79 | $692.75 | above |
| play-sand | $975.00 | $1175.00 | +20.5% | $253.13 | $947.40 | above |
| washed-sand | $835.00 | $1035.00 | +24.0% | $252.28 | $852.10 | above |
| native-hardwood | $650.00 | $855.00 | +31.5% | $250.91 | $941.00 | below |
| black-dyed | $690.00 | $900.00 | +30.4% | $254.60 | $1082.90 | below |
| brown-dyed | $725.00 | $930.00 | +28.3% | $253.73 | — | no broker data |
| dyed-red | $700.00 | $915.00 | +30.7% | $259.17 | $997.10 | below |
| cedar | $840.00 | $1040.00 | +23.8% | $250.54 | $783.00 | above |
| pine-bark | $800.00 | $1000.00 | +25.0% | $251.70 | $783.00 | above |
| playground-mulch | $690.00 | $900.00 | +30.4% | $254.70 | $1398.95 | below |
| sandy-loam | $690.00 | $900.00 | +30.4% | $254.60 | $826.85 | above |
| garden-mix | $880.00 | $1080.00 | +22.7% | $254.38 | $1051.20 | above |
| compost | $770.00 | $975.00 | +26.6% | $252.43 | $733.95 | above |
| select-fill | $510.00 | $720.00 | +41.2% | $250.12 | $549.10 | above |

**6/21 below broker** (rip-rap, river-rock, native-hardwood, black-dyed, dyed-red,
playground-mulch).

### dfw-outer, 20 units

| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |
|---|---:|---:|---:|---:|---:|---|
| pea-gravel | $1815.00 | $2245.00 | +23.7% | $516.99 | $2135.40 | above |
| 57-limestone | $1660.00 | $1900.00 | +14.5% | $324.80 | $1690.80 | above |
| flex-base | $1280.00 | $1570.00 | +22.7% | $361.57 | $1690.00 | below |
| decomposed-granite | $2435.00 | $2815.00 | +15.6% | $484.66 | $2438.40 | above |
| rip-rap | $1735.00 | $2150.00 | +23.9% | $496.15 | $2294.20 | below |
| river-rock | $2475.00 | $3315.00 | +33.9% | $934.57 | $4667.20 | below |
| mason-sand | $1515.00 | $1870.00 | +23.4% | $433.27 | $1724.00 | above |
| bank-sand | $1380.00 | $1575.00 | +14.1% | $272.82 | $1440.80 | above |
| concrete-sand | $1555.00 | $1775.00 | +14.1% | $304.02 | $1385.50 | above |
| play-sand | $1820.00 | $2090.00 | +14.8% | $358.09 | $1894.80 | above |
| washed-sand | $1535.00 | $1895.00 | +23.5% | $438.94 | $1704.20 | above |
| native-hardwood | $1165.00 | $1530.00 | +31.3% | $431.33 | $1882.00 | below |
| black-dyed | $1250.00 | $1645.00 | +31.6% | $463.00 | $2165.80 | below |
| brown-dyed | $1315.00 | $1615.00 | +22.8% | $373.87 | — | no broker data |
| dyed-red | $1270.00 | $1675.00 | +31.9% | $472.13 | $1994.20 | below |
| cedar | $1550.00 | $1770.00 | +14.2% | $304.37 | $1566.00 | above |
| pine-bark | $1465.00 | $1805.00 | +23.2% | $418.36 | $1566.00 | above |
| playground-mulch | $1250.00 | $1645.00 | +31.6% | $463.19 | $2797.90 | below |
| sandy-loam | $1250.00 | $1535.00 | +22.8% | $356.19 | $1653.70 | below |
| garden-mix | $1625.00 | $2005.00 | +23.4% | $462.56 | $2102.40 | below |
| compost | $1410.00 | $1605.00 | +13.8% | $274.15 | $1467.90 | above |
| select-fill | $890.00 | $1075.00 | +20.8% | $250.13 | $1098.20 | below |

**10/21 below broker** (flex-base, rip-rap, river-rock, native-hardwood, black-dyed,
dyed-red, playground-mulch, sandy-loam, garden-mix, select-fill).

## Floor-applied detail (10 units — full per-SKU breakdown)

`npx tsx scripts/metro/margin-scenarios.ts floor250`:

- **dfw-core**: 20/22 SKUs hit the $250 floor (only pea-gravel and river-rock price high
  enough on tiered premium alone); 7/21 still below broker; minimum gross profit across
  all 22 SKUs = $250.08.
- **dfw-outer**: 15/22 SKUs hit the floor (pea-gravel, decomposed-granite, rip-rap,
  river-rock, black-dyed, dyed-red, playground-mulch price above it on premium alone —
  the farther zone's higher delivery cost pushes premium-only price up enough to clear
  $250 without the floor); 6/21 still below broker; minimum gross profit = $250.01.

Both confirm the invariant the loop test in `pricing.test.ts` checks exhaustively: **every
DFW (SKU × zone × quantity in {min, 3, 5, 10, 15, 20, 30}) combination clears >= $250
estimated gross profit.**

## Analysis

**How many SKUs are still below broker at 10 units:** **7 of 21 comparable SKUs in
dfw-core, 6 of 21 in dfw-outer** (down from 20/21 and a similar count under the old v2
0.25-premium structure). The floor is a real, deliberate trade-off: guaranteeing $250
gross profit on every DFW order pushes roughly two-thirds of the catalog above the
broker-delivered median at a standard 10-unit order. The SKUs that stay below broker are
exactly the ones with the most broker headroom to begin with (rip-rap, river-rock, the
mulch tier-3 SKUs, and zone-dependently garden-mix) — the same set `dfw-margin-scenarios.md`
Table 6 already flagged as high-headroom.

**Which small orders become uncompetitive:** at **3 units, essentially the entire
catalog prices above broker** (1/21 below broker in dfw-core, 0/21 in dfw-outer) — every
SKU jumps 45–118% versus the old v2 price. This is the floor's fixed $250-plus-fees
component dominating a small order's total: at 3 units even the cheapest SKU
(select-fill, $27.96/unit material) needs its price roughly to *double* just to clear
$250 gross profit after cost and Stripe fees. **This is the single biggest competitive
risk of the floor as configured** — small orders, which are exactly the segment MGG's
lower-friction "delivered price, pick a day" pitch is supposed to win against brokers who
often have high minimums of their own, become the least competitive tier under a flat
per-order floor.

**Why 20-unit orders are relatively more competitive than 10-unit orders:** counter-
intuitively, the below-broker count *improves* from 10-unit to 20-unit orders (7→10 in
dfw-core, 6→10 in dfw-outer) even though `estimatedGrossProfit` also grows at 20 units.
The floor is a **fixed dollar amount per order**, so it's a shrinking fraction of total
order value as quantity grows; by 20 units the tiered `premiumRate` alone is doing most
of the work (matching the old v2 economics, scaled up), and premium-only pricing tracked
broker medians reasonably well pre-floor. The floor's damage is concentrated at the low
end of the order-size distribution, not spread evenly across it.

## Recommendation: raise the DFW minimum order size

**Do not change `zone.minUnits` in this pass** (out of scope — this is a pricing-floor
task, not a minimums change) but the data above is a clear, disclosed case for raising it
in a follow-up: DFW's current zone minimums are **3 units** for every zone
(`dallasFortWorth.ts`), which is exactly the order size where the $250 floor makes the
delivered price look absurd on a per-unit basis (e.g. select-fill at 3 units: $145/unit
delivered for a $27.96/unit material) and prices above broker on all but one SKU.

Recommend testing a DFW minimum order size in the **8–10 unit range** (tons for
gravel/sand, yards for mulch/soil) — close to where this doc's own 10-unit table shows
the floor's relative bite easing and roughly a third of the catalog already clearing
broker. Flag for the owner: even at 10 units, the 7 (core) / 6 (outer) SKUs that stay
above broker are a *structural* result of a flat $250 floor on near-commodity, high-
broker-headroom materials (rip-rap, river-rock, the darker mulches) — no minimum-order
change alone fixes those; only a per-SKU floor, a lower floor for that subset, or
accepting they're priced above broker (as a deliberate "quote on request only if it's
convenient" tier) would.

## Change log

- 2026-09-28: Implemented `minMarginPerOrder`/`paymentFeeRate`/`paymentFeeFixed` in
  `Metro.pricing` (DFW only: 250 / 0.029 / 0.30; Long Island unset) and `premiumRate` per
  `MaterialVariant` (DFW's tiered 0.25/0.35/0.45 from `dfw-margin-scenarios.md` Table 8,
  baked into `dfwCatalog.ts` by `catalog-from-proposal.mjs`). Moved the DFW node-cost
  wholesale factor from an unverified, hand-applied 0.85 to an explicit, named
  `DEFAULT_WHOLESALE_FACTOR = 1.00` constant/CLI arg in `catalog-from-proposal.mjs`, and
  regenerated `catalog-proposal-v2.json` + `dfwCatalog.ts` from it. Updated `quote()`
  (`src/metro/lib/pricing.ts`) to compute `basePrice = max(premiumPrice, floorPrice)`,
  rounded up, with `premium` redefined engine-wide as `basePrice - materialCost -
  deliveryCost` (so the floor's uplift is visible as premium, not hidden) and new
  optional `marginFloorApplied`/`estimatedGrossProfit` fields on `QuoteResult`. Added a
  `floor250` table and a `v3compare` (old vs. new, all 22 SKUs × {3,10,20} units ×
  {dfw-core,dfw-outer}) table to `scripts/metro/margin-scenarios.ts`, generating every
  number in this doc. Regenerated the Google Merchant price book
  (`supabase/functions/google-merchant-sync/price-book.json`) and the DFW Cost Index
  (`src/content/guides/costIndex/costIndexData.ts`, `public/data/*.csv` — content
  unchanged, since the Cost Index tracks *market* prices, not MGG's own book; only the
  generated-date stamp moved). Added floor-specific tests plus a full-catalog
  loop-invariant test and a byte-identical Long Island regression test to
  `src/metro/lib/pricing.test.ts` (pre-change snapshot at
  `src/metro/lib/__fixtures__/liQuotesSnapshot.json`).
