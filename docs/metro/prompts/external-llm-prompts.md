# External LLM prompts: DFW competitive analysis, price scraping, low-cost marketing

Use these to cross-check our in-house research. Each prompt ends with an output schema, so results can be merged into `docs/metro/research/data/dfw/` for comparison.

**Which tool for what**

| Tool | Best at | Use it for |
|---|---|---|
| **ChatGPT (Agent mode / Deep Research)** | Browsing, clicking through sites, building tables | Price scraping (P1), competitor discovery (P2) |
| **Grok (DeepSearch)** | Live X/Twitter and web data | Social listening (P5), local chatter, TikTok and X trends (P7) |
| **Gemini (Deep Research)** | Google index and Maps data | Map-pack and Google Business Profile audit (P3), AI Overview checks (P8) |
| **Perplexity (Pro / Research)** | Answers with citations | Fact-checked competitor list (P2), AI-visibility checks (P8) |
| **DeepSeek (R1 / reasoning)** | Reasoning over data you paste in (weak live browsing) | Pricing model (P4), marketing plan math (P6); paste the CSVs from P1/P2 |

Paste the context block below at the top of every prompt.

```
CONTEXT: MyGravelGuy (mygravelguy.com) sells bulk gravel, mulch, sand and topsoil online with delivery. We charge a premium for dead-simple ordering: enter ZIP → one delivered price → pick a delivery day → pay → driver texts updates and a photo of the drop. We are launching in the Dallas–Fort Worth metroplex (Dallas, Tarrant, Collin, Denton, Rockwall, Kaufman, Ellis, Johnson counties), fulfilled by partner yards. Typical order: 5–20 cubic yards or 5–25 tons, $300–$1,500.
RULES: Cite a source URL for every fact and price. Never invent prices, ratings, or review counts. If unknown, write "unknown". Mark each line FACT or ESTIMATE.
```

---

## P1. DFW price scrape (ChatGPT Agent mode; also works in Perplexity / Gemini Deep Research)

```
[CONTEXT]
TASK: Build a price table of bulk landscape materials sold by businesses that deliver in the DFW metroplex.
1. Find at least 25 sellers: landscape supply yards, quarries selling retail, mulch producers, online delivery services (e.g. Mulch Mound, Outdoor Warehouse Supply, Living Earth, Silver Creek Materials, Soil Building Systems, Fort Worth Grass & Stone, Hello Gravel, Gravel Monkey, Home Depot bulk). Cover north (Plano/Frisco/McKinney/Denton), west (Fort Worth/Weatherford), south/east (Mesquite/Rockwall/Mansfield).
2. For each seller, open their site and record every BULK product with a published price. Skip bagged items. For Shopify stores, /products.json lists prices. For WooCommerce, try /wp-json/wc/store/v1/products.
3. Normalize: price per cubic yard AND per ton (assume tons/yd: stone 1.4, sand 1.35, soil 1.1, mulch 0.3) and note whether delivery is included.
OUTPUT (CSV, one row per product): seller, url, yard_city, product_name, normalized_material (pea gravel | #57 limestone | flex base | decomposed granite | river rock | washed sand | mason sand | native hardwood mulch | dyed mulch | cedar mulch | sandy loam | garden mix | compost | select fill | other), price, unit, price_per_yd, price_per_ton, delivery_fee_model, delivery_minimum, source_url, date_checked.
Then give a summary table: the 20 materials sold by the most sellers, with min / median / max price per unit.
```

## P2. Competitor landscape and ordering UX (ChatGPT Deep Research or Perplexity)

```
[CONTEXT]
TASK: Competitive analysis of everyone selling bulk gravel, mulch, sand or soil with delivery in DFW.
For each competitor: URL, business model (own yard / broker / marketplace / big box), locations, service radius, online ordering level (phone only / quote form / cart / instant delivered price at checkout), delivery fee model, minimums, delivery speed (same/next day?), date picker?, calculators, Google rating + review count, city landing pages (URL pattern and count), Google Ads or Shopping presence, social presence (Facebook/Instagram/TikTok/YouTube follower counts), and the 3 most common praises and complaints in their Google reviews.
Then: (a) a comparison table, (b) the UX bar a new entrant must beat, (c) gaps no one fills, (d) which phone-only yards would make good wholesale fulfillment partners (list with location), (e) threats to a premium "dead-simple" entrant.
```

## P3. Google map pack and Business Profile audit (Gemini Deep Research)

```
[CONTEXT]
TASK: For these searches in Dallas, Fort Worth, Plano, Frisco, Arlington and McKinney, report who appears in the Google local map pack (top 3) and top 5 organic results: "gravel delivery", "mulch delivery", "topsoil delivery", "landscape supply", "pea gravel near me", "decomposed granite delivery".
For each map-pack business: GBP primary category, secondary categories, review count, rating, review velocity (reviews in the last 90 days if visible), photos count, whether they list products/prices in GBP, website link type (homepage vs location page), and whether the business is a storefront or service-area business.
OUTPUT: table per query + a list of the GBP categories and tactics that correlate with ranking. Recommend how a new service-area business with no storefront can realistically enter the map pack.
```

## P4. Premium pricing model (DeepSeek R1: paste P1 output first)

```
[CONTEXT]
DATA: <paste P1 CSV here>
TASK: Design our DFW price book.
1. Pick the 20 SKUs to sell (most common across sellers).
2. For each, estimate what a partner yard charges us (wholesale ≈ 70–85% of the local retail median; state your assumption) and typical delivery cost per load by distance ring (0–10, 10–20, 20–35 miles), with small (≤8 yd), tandem (12 yd / 15 t) and end-dump (20 yd / 24 t) trucks.
3. Propose ONE delivered price per SKU per ring at three premium levels (+25%, +35%, +50% over local retail + delivery) and show the math for a 10-unit order.
4. Recommend which premium to launch with, and a price-testing plan (A/B test by ZIP or by week) to find the highest price that doesn't collapse conversion. Explain the trade-offs: a premium for convenience versus price shoppers who compare against Home Depot and local yards.
OUTPUT: a table of SKU, ring, wholesale estimate, delivery estimate and price at each premium level, then your recommendation.
```

## P5. Social listening: what DFW customers complain about (Grok DeepSearch)

```
[CONTEXT]
TASK: Search X/Twitter, Reddit (r/Dallas, r/FortWorth, r/Plano, r/HomeImprovement, r/landscaping, r/lawncare), Nextdoor-style public posts, and Facebook-group mentions visible on the web from the last 24 months for DFW people talking about buying gravel, mulch, topsoil, sand, fill dirt or decomposed granite. Look for: which suppliers they recommend or complain about, prices they mention, delivery problems (late, wrong spot, damaged driveway, short loads), and questions they ask ("how much do I need", "who delivers small loads").
OUTPUT: (1) top 15 pain points with example quotes + links, (2) suppliers mentioned with sentiment, (3) prices mentioned, (4) 10 content or ad angles that speak directly to these pains, (5) the local communities, influencers and accounts where these conversations happen.
```

## P6. Low-cost market penetration plan (ChatGPT or DeepSeek)

```
[CONTEXT]
TASK: Give me a 90-day go-to-market plan to get the first 100 paid DFW orders with under $5,000 total marketing spend. Assume we have: an online store with instant delivered pricing, Twilio SMS, a sister company with real delivery experience, and no local storefront.
Evaluate and rank (cost, speed, expected orders, effort) at least 20 tactics, including: Google Business Profile as a service-area business, Google Local Services Ads eligibility, Google Shopping free listings, Nextdoor (business page + local deals), Facebook Marketplace and local buy/sell groups, Craigslist, TikTok organic + TikTok ads, Instagram Reels, YouTube Shorts, yard signs on delivered piles, truck magnets with QR, door hangers in new-construction subdivisions (Frisco, Prosper, Celina, Forney, Princeton), partnerships with landscapers, pool builders, fence companies, home builders' warranty or punch-list teams, HOA management companies, real-estate agents (move-in gifts), Home Depot parking-lot overflow, referral credits, a first-order coupon, review-generation SMS, local news or PR hooks, Reddit participation, and AI-answer visibility (being cited by ChatGPT, Gemini and Google AI Overviews).
For each: exact steps, budget, a KPI, and a realistic orders estimate with assumptions. Finish with a week-by-week calendar and the 5 tactics you'd do first.
```

## P7. TikTok for bulk landscape materials (Grok, then ChatGPT)

```
[CONTEXT]
TASK: Assess TikTok for a DFW bulk-materials delivery brand.
1. Find real examples (accounts, videos with view counts) of landscape supply yards, gravel/mulch delivery, dump-truck drivers, and "driveway makeover" or "backyard transformation" content that performed well. List account handles, follower counts, and top videos with URLs.
2. TikTok Ads: current minimums (campaign/ad group daily budget), typical CPM/CPC ranges for home-improvement in US metros (cite sources), local targeting granularity (DMA, city, ZIP, radius?), Spark Ads, Lead Gen forms, and conversion tracking (pixel + Events API).
3. Audience fit: TikTok user age and homeowner share vs Facebook, Instagram, YouTube and Nextdoor for a $300–$1,500 home-project purchase.
4. Recommend: organic-first vs paid, 10 video concepts (hooks in the first 2 seconds), posting cadence, a $1,000 test plan with kill/scale rules, and how to attribute orders (UTM, promo code, SMS keyword).
```

## P8. AI-answer visibility check (run in ChatGPT, Gemini, Google AI Mode, Perplexity, Copilot, Grok)

Ask each engine these exact questions **in a fresh chat, logged out if possible**. Record who gets named or cited, in what position, and the source URLs shown. Repeat monthly.

```
1. Where can I order gravel delivered in Dallas?
2. What's the easiest way to get mulch delivered in Fort Worth?
3. How much does a gravel driveway cost in Dallas, Texas?
4. What is the best gravel for a driveway in North Texas clay soil?
5. How much gravel do I need for a 12 x 60 ft driveway?
6. Crusher run vs flex base vs #57 limestone for a driveway, which is better?
7. How much does a yard of mulch cost delivered in DFW?
8. Who delivers small loads of topsoil in Plano / Frisco?
9. Is there a website where I can see a delivered price for gravel before I call?
10. What is MyGravelGuy and is it legit?
```

OUTPUT per engine: question → brands/domains named (in order) → cited URLs → whether mygravelguy.com appears (Y/N) → notes. Paste results into `docs/metro/research/ai-visibility-baseline.md`.
