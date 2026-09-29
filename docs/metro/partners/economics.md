# DFW Partner Economics — Per-Order Unit Economics Worked Example

Status: research/illustrative, 2026-09-28. Every number below is derived from
`src/metro/config/dallasFortWorth.ts`, `src/metro/config/data/dfwCatalog.ts`, and
`docs/metro/research/dfw-pricing-v2.md` — nothing here is invented, and nothing here is a
signed partner price. Read `docs/metro/partners/partner-due-diligence.md` first — none of
Silver Creek Materials, Lowery Sand & Gravel, or Soil Building Systems have a confirmed
delivery-fee schedule yet ("unverified — ask on call" in all three cases).

## Method

**MGG delivered price** — the actual `quote()` formula from `src/metro/lib/pricing.ts`,
confirmed against `dfw-pricing-v2.md`'s 10-unit table and `METRO-STRATEGY.md`'s worked
DFW examples:

> `MGG price = roundUpTo5( (nodePricePerUnit × qty + zone.loadCost × truck.deliveryCostFactor) × (1 + premiumRate) )`

For a 10-unit order in `dfw-core` (loadCost $85) on the medium/tandem truck
(`deliveryCostFactor` 1.3 — the truck that fits a 10-ton/10-yd load), `premiumRate` =
0.25: delivery term = $85 × 1.3 = **$110.50** for every SKU below.

**Partner cost (this doc's assumption, per the task brief — "use yard-class medians")**
— `dfwCatalog.ts`'s `nodePricePerUnit` is yard-class median × a placeholder **0.85**
wholesale-discount assumption (`dfw-pricing-v2.md` "Method" section) — i.e. the *code*
already assumes a partner will wholesale to MGG at 15% below their own retail/counter
price. **This doc does not carry that assumption forward.** Per the task brief, the
partner's *likely* price is modeled at the **full yard-class median** (`slug-stats.json`
`yard_median`) — what Silver Creek, Lowery, or SBS would actually charge a counter
customer for the material, before any hypothetical wholesale discount that hasn't been
negotiated yet. This is the more conservative, more realistic number until a signed price
sheet exists.

**Delivery cost charged by the partner** is unknown for all three yards (see
due-diligence doc) except one real, confirmed data point: **Soil Building Systems
publishes a $35 surcharge under 6 cubic yards plus a fuel surcharge on every delivery**
(soilbuildingsystems.com/services/productdelivery) — the fuel-surcharge dollar amount
itself is not published. In the absence of three signed delivery-fee schedules, this doc
uses the **same $110.50 delivery-cost estimate MGG's own pricing engine already assumes**
(`zone.loadCost × truck.deliveryCostFactor`) as the best available placeholder for what a
partner might charge to deliver a 10-unit load in `dfw-core` — explicitly a placeholder,
not a quote, and likely an *underestimate* for small loads given real DFW delivery fees
documented in `dfw-pricing-v2.md` range **$45–$200** (Fort Worth Grass & Stone $45 flat,
SiteOne $45 floor, Lowery ~$200 on small orders per prior research, DFW Stone Supply
$150).

**Stripe fee**: 2.9% + $0.30, applied once per order to the full MGG delivered price
(one checkout transaction per order, not per SKU).

## 10-unit worked example — 3 SKUs

10 tons for gravel, 10 yd for mulch — `dfw-core` zone, medium truck.

| | Pea gravel (10t) | #57 crushed limestone (10t) | Native hardwood mulch (10yd) |
|---|---:|---:|---:|
| Yard-class median (`slug-stats.json`) | $71.43/ton | $64.29/ton | $40.995/yd |
| Partner material cost (median × 10) | $714.30 | $642.90 | $409.95 |
| + delivery cost (placeholder, $110.50) | $110.50 | $110.50 | $110.50 |
| **Partner total cost (this doc's estimate)** | **$824.80** | **$753.40** | **$520.45** |
| **MGG delivered price** (`dfwCatalog.ts` + `quote()` formula, matches `dfw-pricing-v2.md`/`METRO-STRATEGY.md` examples) | **$900** | **$825** | **$575** |
| Stripe fee (2.9% + $0.30, on MGG price) | $26.40 | $24.23 | $16.98 |
| **Gross margin $** (MGG price − partner cost − Stripe fee) | **$48.80** | **$47.37** | **$37.57** |
| **Gross margin %** (of MGG delivered price) | **5.4%** | **5.7%** | **6.5%** |

**Read:** at the partner's full published/counter (yard-median) material price plus a
placeholder delivery estimate, gross margin on a 10-unit order is thin — roughly
**5–7%**, and entirely dependent on the delivery-cost placeholder holding. This is
*meaningfully thinner* than what the current `dfwCatalog.ts` code implicitly assumes
(which nets out to a materially better margin because it assumes the partner
wholesales material at 15% below retail *and* that delivery only costs MGG the same
$110.50 regardless of what the partner actually bills for the truck). **This gap — real
partner pricing vs. the code's 0.85-wholesale placeholder — is the single most important
open question the `dfw-pricing-v2.md`/`README.md` next step (signed price sheets) needs
to close before `priceBookConfirmed` flips to `true`.**

## Sensitivity: partner quotes 10% above the yard median

Same delivery-cost placeholder ($110.50); only the material line moves +10%.

| | Pea gravel (10t) | #57 crushed limestone (10t) | Native hardwood mulch (10yd) |
|---|---:|---:|---:|
| Partner material cost ×1.10 | $785.73 | $707.19 | $450.95 |
| + delivery cost (placeholder) | $110.50 | $110.50 | $110.50 |
| **Partner total cost** | **$896.23** | **$817.69** | **$561.45** |
| MGG delivered price (unchanged) | $900 | $825 | $575 |
| Stripe fee (unchanged) | $26.40 | $24.23 | $16.98 |
| **Gross margin $** | **−$22.63** | **−$16.92** | **−$3.43** |
| **Gross margin %** | **−2.5%** | **−2.1%** | **−0.6%** |

**All three SKUs go margin-negative if the partner's actual price lands just 10% above
the scraped yard-class median** — before even accounting for a real, higher delivery fee
(the $110.50 placeholder is likely an underestimate for small loads per the $45–$200 real
DFW range above). This is the concrete, numeric version of the risk flagged in
`dfw-pricing-v2.md`'s caveats (several SKUs "clear broker by under 5%") and in
`dallasFortWorth.ts`'s own header comment (`priceBookConfirmed: false` — "do not treat
any number here as real pricing until a partner price sheet lands").

## What this means for negotiation and launch sequencing

1. **Get an actual delivered-price quote (material + delivery combined) from each
   partner for a representative 10-unit order**, not just a material price — the
   partner's delivery fee is the single biggest unknown in this whole model and could
   easily erase the ~5–7% margin shown above on its own (see SBS's real, confirmed $35
   under-6-yd surcharge as one concrete example of a real fee structure that isn't
   reflected in the $110.50 placeholder).
2. **A material discount off retail (the 0.85 factor the code already assumes) is not
   automatic** — it has to be negotiated. If a partner won't discount off their posted
   retail/counter price at all, MGG's current `premiumRate = 0.25` does not leave enough
   margin to be viable on these three SKUs at 10-unit scale, per the base case above
   (5.4–6.5%) — a single delivery-fee surprise or a slow-pay/damage-claim cost would
   erase it.
3. **Do not flip `priceBookConfirmed` to `true` in `dallasFortWorth.ts` until real
   partner numbers replace both the 0.85 wholesale assumption and the $110.50 delivery
   placeholder** — this is already the file's own stated rule; this doc's sensitivity
   table is the concrete reason why.
4. **Larger orders and/or a renegotiated `premiumRate`** are the two levers available if
   real partner quotes come back at or above the yard median — worth modeling once a
   real price sheet exists, not before.

## Change log
- 2026-09-28: Created. Derived the `quote()` formula's delivery term ($110.50 = $85
  `dfw-core` loadCost × 1.3 medium-truck factor) from `dallasFortWorth.ts`, confirmed it
  reproduces `dfw-pricing-v2.md`'s/`METRO-STRATEGY.md`'s published $900/$825/$575
  10-unit examples exactly; built the partner-cost side from `slug-stats.json` yard
  medians (not the catalog's 0.85-discounted node price, per the task's explicit
  instruction) plus the same delivery placeholder; computed gross margin $/% for pea
  gravel, #57 limestone, and native hardwood mulch at the median and at +10% over
  median; flagged that all three SKUs go margin-negative at +10%, and that the current
  code's assumed economics (0.85 wholesale factor, no separate partner delivery fee) are
  materially more optimistic than this doc's yard-median-based estimate.
