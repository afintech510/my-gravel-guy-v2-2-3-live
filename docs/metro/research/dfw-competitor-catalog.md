# DFW Competitor Catalog & Pricing Analysis

**Scope:** Dallas–Fort Worth bulk landscape-material sellers/deliverers (gravel, mulch, sand, soil).
**Owner goal this doc supports:** "scrape all data from local comp in DFW … make a store where I resell the most common local products at a premium."
**Files:** `docs/metro/research/data/dfw/competitors.csv` (28 rows, 26 direct sellers + 2 directories) · `docs/metro/research/data/dfw/products.csv` (238 normalized rows) · `docs/metro/research/data/dfw/catalog-proposal.json` (23 SKUs) · scraper: `scripts/competitors/scrape-dfw.mjs`.

**Never-invent-prices rule:** every number below comes from a scraped Shopify/WooCommerce product feed or a manually transcribed published price (cited by `source_url`). Sites with no public price (phone-only yards, quote-based brokers) are marked `unknown`/`quote-based` rather than estimated.

---

## 1. Competitor coverage

28 DFW-area bulk sellers/deliverers/directories were catalogued (`competitors.csv`). Online-ordering / pricing model:

| Model | Count | Examples |
|---|---|---|
| Instant delivered price at checkout (broker) | 4 | Hello Gravel, Gravel Monkey, MyGravelBuddy, American Rock Supply |
| Shopping cart, price set by yard | 2 | Mulch Mound (Shopify), Outdoor Warehouse Supply (WooCommerce) |
| Quote-based (phone/form, no published price) | 20 | Silver Creek Materials, Soil Building Systems, Living Earth, A Better Arborist, Earth Haulers, Aggregates Now, JBS Express, Denton Sand & Gravel, Hunt County S&G, Chesshir Stone, Bargain/Complete Landscape Supply, Select S&G, Big Tex Stone, Texas Rock n Stone, By The Yard Mulch, First Choice Landscape Supply, Tex-Art, Fort Worth Grass & Stone (flat delivery fee published, unit prices published) |
| Directory / lead-gen (not a direct seller) | 2 | GravelShop, GoodGravel |

**5 competitors yielded usable priced SKU data** for this pass: **Mulch Mound, Outdoor Warehouse Supply, MyGravelBuddy, Fort Worth Grass & Stone, Gravel Monkey** (national broker, price included in coverage.json/llms.txt feed). All five publish pricing across all 4 hero categories (gravel, mulch, sand, soil).

Two sites that looked scrapable (Shopify/WooCommerce JSON both returned HTTP 200) turned out not to carry priced bulk SKUs and were excluded from `products.csv`:
- **earthstonerock.com** ("Texas Rock n Stone") — live catalog is fruit trees/nursery stock, not aggregate.
- **chesshirstone.com** — live catalog is $0/"call for price" ornamental show-stones, not bulk gravel/sand/soil/mulch.

**Hello Gravel** (closest model to MGG: broker, instant delivered price, programmatic city pages) returns HTTP 403 to automated fetches; its DFW pricing could not be scraped this pass. Worth a manual price-desk check (call/quote) in a follow-up.

---

## 2. Most common bulk products, ranked by # of sellers with published pricing

23 SKUs surfaced across the 5 priced competitors (target was ~20; kept all because the extra long-tail mulch colors are genuinely distinct SKUs Mulch Mound sells separately). Ranked by number of distinct sellers publishing a price for that SKU:

| # | SKU | Category | Sellers | $/yd (min / median / max) | $/ton (min / median / max) | Recommended display unit | MGG delivered price, 10-unit order (+25% / +35% / +50%) |
|---|---|---|---|---|---|---|---|
| 1 | Pea Gravel (3/8") | gravel | 4 | $87 / $218.63 / $488.60 | $62.14 / $156.17 / $349.00 | ton | $2,008 / $2,169 / $2,410 |
| 2 | Road Base / Flex Base / Crusher Run | gravel | 4 | $65 / $127.00 / $307.16 | $46.43 / $90.71 / $219.40 | ton | $1,190 / $1,285 / $1,428 |
| 3 | Decomposed Granite | gravel | 4 | $110 / $264.77 / $344.86 | $78.57 / $189.12 / $246.33 | ton | $2,420 / $2,614 / $2,904 |
| 4 | Masonry / Mason Sand | sand | 4 | $65 / $175.10 / $310.55 | $48.15 / $129.70 / $230.04 | ton | $1,678 / $1,812 / $2,013 |
| 5 | Screened Topsoil | soil | 4 | $49 / $55.00 / $261.70 | $44.55 / $50.00 / $237.91 | yd | $744 / $803 / $893 |
| 6 | Natural/Brown Hardwood Mulch (double shredded) | mulch | 3 | $34 / $55.00 / $124.00 | $113.33 / $183.33 / $413.33 | yd | $744 / $803 / $893 |
| 7 | Crushed Limestone #57 / 3/4" Crushed Stone | gravel | 3 | $133 / $133.00 / $304.50 | $95.00 / $95.00 / $217.50 | ton | $1,244 / $1,343 / $1,493 |
| 8 | Play / Playground Sand | sand | 3 | $97 / $97.00 / $315.45 | $71.85 / $71.85 / $233.67 | ton | $954 / $1,031 / $1,145 |
| 9 | Native/Shredded Tree Mulch | mulch | 2 | $50 / $87.00 / $124.00 | $166.67 / $290.00 / $413.33 | yd | $1,144 / $1,235 / $1,373 |
| 10 | River Rock | gravel | 2 | $523.10 / $549.25 / $575.40 | $373.64 / $392.32 / $411.00 | ton | $4,960 / $5,357 / $5,952 |
| 11 | Rip Rap | gravel | 2 | $95 / $201.84 / $308.69 | $67.86 / $144.18 / $220.49 | ton | $1,858 / $2,007 / $2,230 |
| 12 | Drain Rock | gravel | 2 | $220.26 / $258.25 / $296.25 | $157.33 / $184.47 / $211.61 | ton | $2,362 / $2,551 / $2,835 |
| 13 | Concrete Sand | sand | 2 | $80 / $186.84 / $293.69 | $59.26 / $138.41 / $217.55 | ton | $1,786 / $1,929 / $2,144 |
| 14 | Fill Sand | sand | 2 | $69 / $69.00 / $270.49 | $51.11 / $51.11 / $200.36 | ton | $695 / $751 / $834 |
| 15 | Garden / Gardening Blend Soil | soil | 2 | $55 / $55.00 / $101.00 | $50.00 / $50.00 / $91.82 | yd | $744 / $803 / $893 |
| 16 | Fill Dirt | soil | 2 | $123.20 / $178.06 / $232.93 | $112.00 / $161.88 / $211.75 | ton | $2,080 / $2,246 / $2,496 |
| 17 | Dyed Black Mulch | mulch | 1 | $46 / $64.00 / $79.00 | $153.33 / $213.33 / $263.33 | yd | $856 / $925 / $1,028 |
| 18 | Dyed Red Mulch | mulch | 1 | $46 / $46.00 / $46.00 | $153.33 / $153.33 / $153.33 | yd | $631 / $682 / $758 |
| 19 | Cedar Mulch | mulch | 1 | $55 / $55.00 / $55.00 | $183.33 / $183.33 / $183.33 | yd | $744 / $803 / $893 |
| 20 | Pine Bark Mulch | mulch | 1 | $55 / $55.00 / $55.00 | $183.33 / $183.33 / $183.33 | yd | $744 / $803 / $893 |
| 21 | Playground Mulch | mulch | 1 | $52 / $52.00 / $52.00 | $173.33 / $173.33 / $173.33 | yd | $706 / $763 / $848 |
| 22 | Native Gravel (small/large) | gravel | 1 | $100 / $100.00 / $100.00 | $71.43 / $71.43 / $71.43 | ton | $949 / $1,025 / $1,139 |
| 23 | Washed Sand | sand | 1 | $315.45 / $315.45 / $315.45 | $233.67 / $233.67 / $233.67 | ton | $2,977 / $3,215 / $3,573 |

**Top 10 by seller count** (used in the final summary): Pea Gravel, Road Base/Flex Base/Crusher Run, Decomposed Granite, Mason Sand, Screened Topsoil, Hardwood Mulch, #57 Crushed Stone, Play Sand, Native/Shredded Tree Mulch, River Rock.

Formula: MGG price = (median price/unit × 10 + $45 typical delivery fee) × (1.25 / 1.35 / 1.50). The $45 is Fort Worth Grass & Stone's published flat delivery fee — the only explicit flat per-trip number found; see caveats.

---

## 3. Delivery fee benchmarks

| Competitor | Model | Amount |
|---|---|---|
| Fort Worth Grass & Stone | Flat per-trip fee | **$45/trip**, 5-yd minimum |
| Outdoor Warehouse Supply | Bundled/unclear | 2-yd minimum, no separate fee disclosed on product pages |
| Mulch Mound | Calculated in cart | Amount not disclosed pre-cart (ZIP/distance-based) |
| Hello Gravel | Included in displayed price | 3-ton minimum |
| Gravel Monkey | Included in displayed price ("no separate freight or fuel charge") | 2–3 ton/yd minimum depending on material |
| MyGravelBuddy | Included in displayed price (broker model) | "Full-load free delivery on most orders" per product page |
| American Rock Supply | Advertised free delivery | — |
| Earth Haulers | Per-dump-location fee | Extra fee per additional dump spot within 4 blocks |

**Read:** the two dominant models are (a) local yards that quote materials ex-delivery plus a modest flat/distance fee (Fort Worth Grass & Stone's $45 is the only published number), and (b) national brokers (Hello Gravel, Gravel Monkey, MyGravelBuddy) that fold delivery into one displayed price — which is also MGG's own model. MGG should keep the single-delivered-price UX; it already matches the broker segment of the market, not the local-yard segment.

---

## 4. Proposed MGG DFW price book (summary)

Recommended premium: **+35% over (median local-yard price × 10 units + $45 delivery)**, matching the owner's target reseller margin and roughly splitting the difference between MGG's current ~1.6–2× DFW premium (see `METRO-STRATEGY.md` §2A) and local-yard retail. Full per-SKU figures at +25/+35/+50% are in the table above and in `catalog-proposal.json` (`suggestedNodePricePerUnit` = the +35% 10-unit total ÷ 10).

Top-line comparison at 10 units, +35% tier:
- #57 Crushed Stone: $95/ton median → **$134/ton** MGG (MGG's current live price is $95/ton at 10 units — i.e. MGG is currently priced **at** local-yard cost, not above it, on this SKU specifically).
- Pea Gravel: $156/ton median → **$217/ton** MGG (MGG's current live price is $142/ton — also below the +35% target).
- Hardwood Mulch: $55/yd median → **$80/yd** MGG (MGG's current live price is $92/yd — already above the +35% target).
- Topsoil: $50/ton median → **$80/yd** MGG (MGG's current live price is $82/yd — already close to +35%).

This cross-check against the live MGG price book (documented in `METRO-STRATEGY.md`) suggests MGG's current DFW pricing is inconsistent relative to local cost: overpriced on mulch/topsoil, underpriced (at-cost) on stone/pea gravel. A uniform "median local + delivery, ×1.35" rule would fix both directions.

---

## 5. Caveats

1. **Small sample per SKU.** Only 5 of 26 direct DFW sellers yielded scrapable/publishable prices this pass. Medians on 1–2-seller SKUs (17–23 in the table) are not statistically robust — treat as directional, not authoritative.
2. **Broker vs. local-yard prices are not apples-to-apples.** Gravel Monkey and MyGravelBuddy prices are national, delivery-included, ZIP-adjusted at checkout — not guaranteed to reflect a DFW ZIP specifically (Gravel Monkey's own coverage.json states pricing is the same nationwide). Mulch Mound and Outdoor Warehouse Supply and Fort Worth Grass & Stone are DFW-specific but generally ex-delivery or with a modest flat fee. Blending both into one median (as this pass does) means several SKUs — River Rock, Drain Rock, Washed Sand, Decomposed Granite — show medians pulled upward by the broker's bundled-delivery price. Treat the $/ton "min" column as closer to true DFW ex-yard cost and the "max" column as closer to a fully-loaded delivered broker price.
3. **Mulch Mound's variant structure.** Each Mulch Mound city page (e.g. `dallas-texas-mulch-delivery`) has one variant per (color × grade × supplier-yard) combo; this scrape keeps the first-listed supplier-yard price per color/grade and drops duplicate rows from other satellite yards serving the same city, to avoid inflating sample counts artificially.
4. **Gravel Monkey / MyGravelBuddy "entry price ÷ minimum" is an approximation**, not a true marginal per-unit price (bulk hauling has volume pricing; the entry price is for the smallest allowed load, e.g. $435 for a 2-ton minimum ≈ $217.50/ton, but a 10-ton order would likely price lower per ton). MGG's own price book already uses a smooth curve for exactly this reason — worth doing the same rather than a flat per-unit rate once real partner-node costs are signed.
5. **Delivery fee benchmark ($45) is a single data point** (Fort Worth Grass & Stone). It is used uniformly in the "10-unit + delivery" formula for lack of a better DFW-wide number; do not treat it as a market average.
6. **Hello Gravel (closest competitive analog to MGG) could not be scraped** — it returns HTTP 403 to non-browser clients. Its DFW pricing (referenced qualitatively in `METRO-STRATEGY.md` from search snippets) should be verified by phone/quote in a follow-up pass before finalizing MGG's price book.
7. **Two "scrapable" sites yielded no bulk-material pricing at all** (earthstonerock.com = nursery stock; chesshirstone.com = $0 ornamental show-stones) despite both exposing working Shopify/WooCommerce JSON endpoints — a reminder that platform detection alone doesn't guarantee relevant data; content was spot-checked before trusting either feed.
8. **20 of 26 direct sellers are quote-based with no published price** (see §1). They remain useful as potential partner-node candidates (per `METRO-STRATEGY.md`'s "partner with the phone-only yards" wedge) but contribute no pricing data to this analysis.
9. **Never invented**: every price in `products.csv` and this document traces to a `source_url` — either a scraped JSON feed timestamp or a WebFetch read of a live page on 2026-09-27/28. Prices are subject to change; re-run `scripts/competitors/scrape-dfw.mjs` periodically to refresh the Mulch Mound/MyGravelBuddy figures (the only two with automatable scraping).
