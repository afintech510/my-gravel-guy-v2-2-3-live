# MyGravelGuy AEO/GEO Plan — Getting Cited by Google AI Overviews/AI Mode, Gemini, and ChatGPT

_Status: COMPLETE draft (all sections written). Research-only document; does not change any other repo file except one Change log row appended to `docs/metro/HANDOFF-LOG.md`. Author: AEO strategist agent, 2026-09-27._

**Honesty note up front:** No one — not Google, not OpenAI, not any AEO vendor — can guarantee a specific citation in an AI Overview, a Gemini answer, or a ChatGPT response. These are probabilistic retrieval + generation systems, reranked per query, and engines change constantly. This plan is designed to maximize the *probability and share* of citation across the gravel-driveway question set, and to make that share measurable over time, not to promise a specific outcome.

## How to read this document
- **[FACT]** = verifiable, sourced to an official doc or a live search result, with URL.
- **[REC]** = our recommendation / inference. Not a fact.
- Nothing here invents a statistic. Anywhere a number is needed but unverified, it is marked `[NEEDS_REAL_NUMBER]`.

---

## 0. Executive summary

**Where we stand:** mygravelguy.com is indexed by Google (product pages only) but appeared in **zero of 20** live searches across the exact driveway-question set the owner cares about (cost, best gravel, depth, crusher run vs #57, etc.) — because MGG has **no informational content that answers those questions at all**, not primarily because of a technical block. `hellogravel.com` and a direct nationwide-broker clone, `mygravelmonkey.com` — already live in Fort Worth — dominate instead.

**The technical trap underneath:** robots.txt already allows every AI crawler (Googlebot, OAI-SearchBot, PerplexityBot, Google-Extended, etc.) via its wildcard rule, so permission isn't the problem. The problem is MGG is a client-rendered SPA with near-empty raw HTML, and the one prerender mechanism in the repo (`cloudflare-worker/`) is both unrouted in production and, even if enabled, only rewrites social-preview meta tags — it doesn't render body content and doesn't recognize a single AI-crawler user agent. Non-JS-executing fetchers (plausibly all of OAI-SearchBot, PerplexityBot, ClaudeBot) may see nothing on new pages unless this is fixed.

**No citation is guaranteed, on Google, Gemini, or ChatGPT — this plan maximizes and measures *share*,** it doesn't promise a placement. Google's own docs confirm AI Overview/AI Mode eligibility requires nothing beyond normal snippet-eligible indexing plus a "query fan-out" step that rewards single, self-contained answers over one monolithic page. Gemini grounding rides the same Google index. ChatGPT's live citation runs on OAI-SearchBot and plausibly Bing's index underneath it; Perplexity is its own bot with no documented eligibility bar beyond "don't block us."

**The plan:** (1) ship real prerendered HTML for new metro pages (P0, independent of the robots.txt fix, which is legibility hygiene, not the actual blocker); (2) build a Gravel Driveway Hub + ~30 spokes mapped to a ~100-question universe already 60% scoped in prior keyword work, reusing AEO-aware components (`DirectAnswerBlock`, `FaqSection`) the parallel METRO-UI agent has already built; (3) ship a "Gravel Driveway Cost Index" — real delivered pricing per metro, the one asset none of today's ranking generic sites can copy; (4) attach real ELM/DFW operator authorship and real delivery photos (E-E-A-T); (5) fix the entity-collision risk with `mygravelmonkey.com`/`thegravelguy.com` via `sameAs` schema; (6) run a weekly 50-prompt panel across all five engines as the honest, ongoing measurement of whether any of this is working — starting with a manual DIY panel before paying for a tracking tool.

**Biggest risk to the plan:** shipping placeholder DFW pricing to hit a roadmap date. Two content rows in the plan are explicitly gated on `dallasFortWorth.ts` moving from placeholder to `priceBookConfirmed = true` — the honesty principle here has to bind on numbers, not just on hedging language.

Full document: `docs/metro/research/aeo-plan.md`

---

## 1. How each engine actually selects and cites sources

### 1.1 Google AI Overviews & AI Mode

**[FACT]** Per Google Search Central's official "AI features and your website" doc: *"To be eligible to be shown as a supporting link in AI Overviews or AI Mode, a page must be indexed and eligible to be shown in Google Search with a snippet, fulfilling the [Search technical requirements]."* There are **no additional technical requirements** beyond normal Search indexing — no special schema, no special markup unlocks AI Overview eligibility by itself. (Source: [Google Search Central — AI features and your website](https://developers.google.com/search/docs/appearance/ai-features))

**[FACT]** Both AI Overviews and AI Mode may use a **"query fan-out"** technique — *"issuing multiple related searches across subtopics and data sources to develop a response"* — which Google says *"expands opportunities for site visibility"* because it pulls in "a wider and more diverse set of helpful links" than a single classic query would. **[REC]** Practical implication: a single page that only answers the exact head query ("how much does a gravel driveway cost") is competing against fan-out sub-queries too ("gravel driveway cost per ton Texas," "crusher run vs #57 cost," "gravel vs concrete driveway cost"). Pages/sections that each cleanly answer one fanned-out sub-question (via H2/H3-scoped Q&A blocks) have more surface area to be pulled into the response than one monolithic article.

**[FACT]** Control mechanisms are the same as classic snippet controls: `nosnippet`, `data-nosnippet`, `max-snippet`, and `noindex` — there is no AI-Overview-specific opt-out; you either allow standard Googlebot crawling/indexing/snippeting or you don't. Blocking Googlebot or robots.txt-disallowing a path removes eligibility for both classic snippets and AI Overviews/AI Mode citations together — it is not possible to allow one and block the other on the same URL. (Source: same page.)

**[FACT]** **Google-Extended** is a *separate, non-crawling robots.txt token* (introduced Sept 2023) that does **not** correspond to any crawler hitting your server — no log line will ever show "Google-Extended." It governs a downstream **data-usage** permission only: whether Google may use already-crawled content (crawled by ordinary Googlebot) for (a) training future Gemini models and (b) **grounding** — i.e., letting the Gemini app and Vertex AI's Search-grounding feature quote/cite the page live. **Disallowing Google-Extended has zero effect on Google Search ranking or on AI Overviews/AI Mode eligibility** — those run on Googlebot, not Google-Extended. Conversely, **allowing** Google-Extended (the default — it's opt-out, not opt-in) is what makes a page eligible to be grounded/quoted by the Gemini app. (Source: [Google Search Central — Google crawlers overview](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers); corroborated by multiple 2026 secondary explainers — [ppc.land](https://ppc.land/google-extended/), [Menra](https://www.menra.ai/guides/gemini-crawler-guide) — since Google's own crawler-list page format is not table-scrapable via automated fetch; treat the mechanism as [FACT] from Google's own robots-token documentation and the specific wording above as best-available secondary corroboration.)

**[REC]** Net effect for MGG: robots.txt should explicitly `Allow` (not merely fail to block) `Google-Extended`, since the goal is Gemini grounding/citation, and there is no ranking cost to doing so.

### 1.2 Gemini app

**[FACT]** Google's own Gemini Apps privacy documentation states plainly: *"some Gemini responses are grounded on Search results"* — i.e., when Gemini decides a query is time-sensitive/factual, it runs a Google Search-like retrieval step and can cite/link sources in the response, distinct from its base trained knowledge. (Source: [Google — Gemini Apps Privacy Hub](https://support.google.com/gemini-app/answer/13594961)) The page does not disclose the exact trigger heuristic for when grounding fires — that logic is not publicly documented (unlike AI Overviews' query fan-out, which Google has described).
**[REC]** Because Gemini grounding is understood to ride on the Google index/Search infrastructure, the practical path to Gemini citation is the same path as AI Overviews: be indexed, be snippet-eligible, allow Google-Extended, and be the clearest single-page answer to the query. There is no separate "Gemini SEO."

### 1.3 ChatGPT (search / browsing)

**[FACT]** OpenAI publishes three distinct bots with different jobs (source: [OpenAI/Developers — bots documentation](https://developers.openai.com/api/docs/bots)):
- **GPTBot** — *"Disallowing GPTBot indicates a site's content should not be used in training generative AI foundation models."* Training-only; irrelevant to whether MGG gets cited in a live ChatGPT answer.
- **OAI-SearchBot** — *"used to surface websites in search results in ChatGPT's search features."* This is the citation-relevant crawler: OpenAI states that sites which disallow OAI-SearchBot "won't be featured in answers" (may still appear as a bare link at most). **This is the one MGG must explicitly `Allow`.**
- **ChatGPT-User** — fires when a live user's ChatGPT session browses a specific page a user (or the model) referenced; *"because these actions are initiated by a user, robots.txt rules may not apply."* Not something to optimize for directly, but should not be blocked either.
- All three publish IP ranges for verification (`openai.com/gptbot.json`, `/searchbot.json`, `/chatgpt-user.json`) — useful later for confirming real crawl activity in server logs, once MGG is off Lovable and logs are accessible.

**[FACT]** ChatGPT's web-search feature is built on a **Microsoft Bing partnership** dating to the original 2023 Bing/ChatGPT plugin integration — Bing supplies the underlying web index/URL-discovery layer that OAI-SearchBot's live retrieval draws on. This is well-documented in tech press but is a secondary/press-level fact, not a line in OpenAI's own bot docs, so it's marked [FACT] on the *existence of the partnership* and [REC] on the operational conclusion. (Sources: [TechCrunch, Feb 2023](https://techcrunch.com/2023/02/07/microsoft-launches-the-new-bing-with-chatgpt-built-in/); reporting is consistent across multiple outlets on the Bing-plugin/browsing lineage.)
**[REC]** Practical implication: **Bing indexing quality is not just "a Bing thing"** for MGG — it plausibly feeds ChatGPT search surfacing too. Bing Webmaster Tools verification + IndexNow submission is therefore double-duty infrastructure (Bing citations *and* a plausible input to ChatGPT citations), not a nice-to-have.

### 1.4 Perplexity

**[FACT]** Perplexity documents two bots distinctly (source: [Perplexity — crawlers guide](https://docs.perplexity.ai/guides/bots)):
- **PerplexityBot** — *"not used to crawl content for AI foundation models"*; its job is surfacing sites in Perplexity's own search/answer results. Site owners should `Allow` this in robots.txt and permit Perplexity's published IP ranges — disallowing it plausibly removes citation eligibility the same way disallowing OAI-SearchBot does.
- **Perplexity-User** — fires on live user-triggered fetches; *"this fetcher generally ignores robots.txt rules"* since a human asked for that specific page.
- Perplexity's own docs do **not** state an explicit citation-eligibility requirement beyond "don't block PerplexityBot" — no snippet-eligibility-style bar is documented the way Google's is.

### 1.5 Bing / IndexNow (infrastructure common to Bing + ChatGPT + Yandex)

**[FACT]** IndexNow is an open push protocol: a site hosts a key file (`{key}.txt`, 8–128 hex chars, at the site root or a path whose scope limits which URLs the key can validate) and then `GET`/`POST`s changed URLs to `https://<searchengine>/indexnow?url=...&key=...` (batch POST supports up to 10,000 URLs per call). Bing, Yandex, Seznam.cz, and Naver are confirmed consumers; the protocol's own docs do not claim ChatGPT/OpenAI consumes it directly. (Source: [IndexNow.org documentation](https://www.indexnow.org/documentation))
**[REC]** Because MGG is a client-rendered SPA changing routes frequently during the metro pivot (new `/dallas-fort-worth*` pages), IndexNow ping-on-publish is cheap, high-leverage plumbing: it collapses "wait for Bing to recrawl" into "notify Bing the instant a page ships," which matters more than usual here because net-new metro pages currently don't exist at all yet.

### 1.6 What content formats actually get cited (synthesis across engines)

**[REC]** — this subsection is inference from the mechanics above plus observed SERP/AI-answer patterns, not a quoted spec from any vendor, since none of the four vendors publish a "cite this format" spec:
1. **Single, self-contained, extractable answer blocks** (one clear question as a heading, a 40–60 word direct answer immediately under it, in plain prose — not buried in an intro) perform best under query fan-out because each block *is* a fan-out sub-answer already.
2. **Numeric, sourced specifics beat generic advice.** "3,745 real deliveries across Long Island, 2023–2026" or "$X/ton delivered in DFW at 10-unit pricing" is the kind of first-party number that differentiates a citation from the wall of interchangeable "Homeguide says $1–3/sq ft" content already dominating these SERPs (see §2).
3. **Structured data (`FAQPage`, `HowTo`, `Product`, `Dataset`) doesn't unlock eligibility by itself** (§1.1 confirms this for Google) but it is still the most reliable way to help a crawler *parse* the Q→A pairing unambiguously, which plausibly helps fan-out matching even though Google doesn't promise it. Treat schema as a parsing aid, not a golden ticket.
4. **Freshness and dates matter more for AI answers than classic SEO.** All four engines' retrieval layers (fan-out, grounding, OAI-SearchBot live fetch, Perplexity-User live fetch) can pull a live/recent copy of a page — a visible "Updated [date]" and an accurate `lastmod` in sitemap.xml cost nothing and remove one reason to prefer a competitor's fresher-looking page.
5. **First-hand operational data is the single biggest differentiator available to MGG** given the current SERP landscape (§2): none of the ranking generic sites (Homeguide, Angi, This Old House, etc.) can cite 3,745 real Long Island deliveries or real DFW delivered-price data. This is the throughline for the "Gravel Driveway Cost Index" asset in §3.

---

## 2. Current state check — does mygravelguy.com show up today?

**Method [FACT]:** 20 live web searches run 2026-09-27 via WebSearch (Google-backed) against the exact question set specified in the brief (cost, best gravel, depth, crusher run vs #57, flex base vs crushed limestone, cost/sq ft Texas, gravel vs concrete Dallas, maintenance, tons for 100 ft driveway, plus DFW- and Long Island-specific variants), plus `site:mygravelguy.com` and a brand query. This is a same-day snapshot, not a tracked panel — see §3.8 for the recurring measurement plan this snapshot seeds.

### 2.1 Result: mygravelguy.com does not appear for any driveway question

**[FACT]** Across all 18 informational/commercial driveway-question searches (cost, best gravel, calculator, depth, crusher-run-vs-57, flex-base-vs-limestone, cost/sqft TX, gravel-vs-concrete Dallas, maintenance, tons-for-100ft, cost-per-ton, drainage, crushed-limestone-TX-cost, gravel-vs-asphalt, #57-vs-#8, DFW installation cost, pea-gravel-pros-cons, ton-coverage, best-gravel-TX, Long Island cost, DFW-bulk-delivery-near-me), **mygravelguy.com did not appear in the results or the synthesized answer for a single one.** Zero share of voice on the exact question set the owner cares about.

**[FACT]** `site:mygravelguy.com` confirms the site **is indexed** — it returned `/shop`, `/products/road-base`, `/products/driveway-gravel`, `/products/driveway-gravel-34in`. So the gap is not "not indexed at all," it is **"indexed only on transactional/product pages, with zero informational content that answers the questions people actually ask before they buy."** MGG has no page that targets "how much does a gravel driveway cost," "how deep should gravel be," "crusher run vs #57," etc. — so there is nothing *to* cite even before any technical-rendering problem is considered.

**[FACT] — honesty caveat:** a `mygravelguy reviews` search surfaced MGG's product pages but the assistant's prose ("customers praise professionalism... 10/10... material matched photos") was **not attributed to any linked, verifiable review source for mygravelguy.com** — the actual review-site links returned were for a *different* company (`mygravelmonkey.com`, via reviews.io) and a *third*, unrelated "Gravel Guy" listing (`thegravelguy.com`, via Trustindex). This looks like the search-summarization layer blending similarly-named brands. **Do not treat this as evidence MGG has real review presence** — it's a reminder that "gravel guy"-style names collide with at least two other companies in search, which is itself a finding worth acting on (see 2.3).

### 2.2 Who actually wins these queries today

| Domain | Pattern | Appeared in (of 20 searches) |
|---|---|---|
| **hellogravel.com** | Aggregator: per-city landing pages (`/locations/texas/dallas-75201/`), material guides, and an embeddable coverage/cost calculator | **11** — by far the single most repeated domain across every query type: cost, sizing, comparisons, city-level DFW and Long Island pages |
| Angi / HomeAdvisor / Houzz / HomeGuide / LawnStarter | Generic national "cost guide" aggregators, no delivered pricing, no location specificity | 8 combined — dominate the head cost queries |
| TRUEGRID Pavers / Bob Vila / Hunker / DoItYourself | Editorial "pros and cons / how-to" content sites | 6 combined — dominate maintenance, drainage, pros/cons |
| Regional yard blogs (Aggregate Markets, Kompleta America, Miners Landscape Supply, Smoky Mountain Sand & Gravel, Dirt Connections, YardCalc, Alborn Supply) | Local/regional aggregate suppliers publishing comparison content (crusher run vs #57, base rock guides) | 7 combined — this is the exact content pattern MGG needs per metro |
| **Texas-local yards** (Twisted Nail, Soil Depot, Aggregates Now, McCraw Landscape Supply, That Skid Steer Guy, Texas Garden Materials, Austin Wholesale Landscape Supply, Cheaper Than Dirt Landscape Supply, JBS Express McKinney, Legacy Outdoor TX, danieldean.com) | Metro/regional-specific cost + material guides (flex base, caliche, crushed limestone) | 9 combined, concentrated in the TX-specific queries — **this is the DFW competitive set MGG is entering** |
| **mygravelmonkey.com** | **Direct model clone** — nationwide bulk aggregate delivery marketplace with per-city landing pages, already live with a Fort Worth, TX city page (`/locations/texas/fort-worth/`) and 141 reviews on reviews.io | 2 (Dallas-Fort Worth bulk delivery query, reviews query) |
| Long Island driveway contractors (Stone Escapes LI, Brothers Paving & Masonry) | Paver/asphalt/concrete driveway contractors, not bulk-material brokers — they own "driveway cost Long Island" because gravel is a smaller share of LI driveway material choice than pavers/asphalt | 2 |

**[FACT] — direct competitive finding:** **mygravelmonkey.com is executing the same nationwide-broker-to-metro-pages pivot MGG is now planning**, and already has a live, indexed Fort Worth page. **[REC]** This raises the urgency of MGG's DFW launch and makes mygravelmonkey.com the single most important competitor to audit page-by-page (content depth, schema, review strategy) before/while building the DFW hub in §3 — recommend a follow-up competitive-teardown task scoped specifically to mygravelmonkey.com's DFW/Fort Worth pages, distinct from the broader `NATIONAL-COMP` agent's output already tracked in `docs/metro/HANDOFF-LOG.md`.

### 2.3 Brand-name collision risk

**[FACT]** Search results show at least three similarly-branded businesses: `mygravelguy.com` (this site), `mygravelmonkey.com`, and `thegravelguy.com` — all surfaced under near-identical brand queries. **[REC]** This dilutes brand-query share and increases the odds an AI assistant conflates or mis-cites companies (as arguably happened in the review-query test above). Worth a light `sameAs`/entity-disambiguation push (Google Business Profile, Wikipedia-adjacent entity signals are out of reach at this size, but consistent NAP + schema `Organization` + `sameAs` across owned profiles is in reach — see §3.6/3.7) so that when an engine does retrieve MGG, it doesn't blend it with a competitor.

### 2.4 Why MGG is structurally invisible even where it is indexed — the SPA rendering gap

**[FACT]** Per the repo: MGG is a client-rendered React SPA — the raw HTML delivered to a non-JS-executing fetcher is close to empty (a `<div id="root">` shell), with content injected by JS after load. **[FACT]** `cloudflare-worker/src/index.ts` implements a **prerender worker**, but two things limit it even in theory:
1. **It is not routed.** `cloudflare-worker/wrangler.toml` has its `routes` block commented out (`# [env.production] # routes = [...]`), so the worker is not attached to `mygravelguy.com` at all today — it does nothing in production.
2. **Even if routed, it only rewrites Open Graph `<meta>` tags for social-preview bots** (`facebookexternalhit`, `Twitterbot`, `LinkedInBot`, `Slackbot`, `Googlebot`, `bingbot`, `Applebot`, etc. — 19 UAs hard-coded in `BOT_USER_AGENTS`). It does **not** render the page's actual body content, and its bot allowlist **does not include any AI-crawler user agent** — no `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `Perplexity-User`, or `ClaudeBot` string appears anywhere in the file. So routing this worker as-is would fix link-preview cards on Slack/LinkedIn; it would do **nothing** for AI-engine citation, because (a) it's meta-tags-only, not full-content, and (b) it doesn't even recognize the bots that matter for this project's goal.

**[FACT]** `public/robots.txt` explicitly names only `Googlebot`, `Bingbot`, `Twitterbot`, `facebookexternalhit`; every other user agent — including every AI crawler discussed in §1 (`OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Google-Extended`) — falls through to the wildcard `User-agent: * / Allow: /` block. **Nothing is blocked today.** The problem is not permission, it's that **there is close to no content for any of these fetchers to read** once they hit an SPA route that isn't one of the handful of routes Googlebot's full renderer happens to execute JS for. Google is the one engine confirmed to run a full headless renderer on indexed pages (that's why `/shop` and `/products/*` show up in `site:mygravelguy.com` at all); OAI-SearchBot, PerplexityBot, and ClaudeBot are not documented as running a JS renderer, so for those three specifically, **an SPA route is very plausibly invisible even though robots.txt allows it.**

**[REC]** This is the load-bearing technical fact for §3.1: the P0 fix is not robots.txt (already permissive) — it's **shipping real static/prerendered HTML** for the new metro/hub pages, independent of whatever happens to the existing OG-only worker.

---

## 3. Gap analysis + plan

Two gaps, addressed in order because §2.4 shows fixing only one won't work alone: **(A) technical** — even MGG's best future content may be invisible to non-JS-rendering AI fetchers; **(B) content** — MGG currently has zero pages that answer any driveway question, so there's nothing to make visible yet. §3.1 is (A). §3.2–3.6 are (B). §3.7–3.8 are off-site trust and measurement, which apply regardless.

### 3.1 P0 Technical

**[REC]** Priority order, cheapest/highest-leverage first:

1. **robots.txt — make AI-crawler allowances explicit, not implicit.** `public/robots.txt` today lets every AI crawler through only via the trailing `User-agent: * / Allow: /` block. That's *functionally* permissive but not *legible* — an implementation agent, a future Cloudflare bot-rule change, or a security-hardening pass could easily add a blanket AI-bot block above the wildcard without realizing it silently cuts off citation eligibility. Add explicit blocks for `Googlebot`, `Google-Extended`, `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `Bingbot` (already present), each `Allow: /`, before the wildcard. File: `public/robots.txt`. Zero ranking/eligibility change today (already allowed); pure legibility/regression-proofing.
2. **Full-content prerendering for the new metro pages is the actual P0 — bigger than robots.txt.** §2.4 established the existing `cloudflare-worker` only rewrites OG meta tags for social-preview bots and isn't even routed. Two sub-decisions an implementation agent needs, in order:
   - **[REC] Decision needed from owner/infra, not assumable from the repo:** is Cloudflare actually the proxy in front of the Hetzner VPS in production (CLAUDE.md says Docker Compose + nginx on the VPS, but doesn't confirm whether Cloudflare DNS/proxy sits in front)? If yes, extending `cloudflare-worker` to do **full-content prerendering** (not just meta tags) — e.g. calling a headless-render service (Prerender.io, or a self-hosted Rendertron/Puppeteer service) for the bot list, expanded to include the AI crawler UAs from §1 — becomes viable, and `wrangler.toml`'s commented-out `routes` block just needs a real `zone_id`. If Cloudflare is *not* in the request path, this worker is dead code regardless of what's built into it, and the fix must happen at the origin.
   - **[REC] Origin-level fallback that works either way:** build-time static HTML generation for the finite, known set of new metro/hub/spoke routes (`/dallas-fort-worth`, `/dallas-fort-worth/{gravel|mulch|sand|soil}-delivery`, `/gravel-driveways/*`) via a prerender step added to the existing `npm run build` pipeline (which already runs `scripts/generate-sitemap.mjs` before `vite build` — same pattern: add `scripts/prerender-static-routes.mjs` using a headless browser to snapshot each known route to static HTML/head tags, served by nginx directly for those exact paths before falling through to the SPA shell for everything else). This does not depend on Cloudflare and directly fixes the "OAI-SearchBot/PerplexityBot/ClaudeBot don't execute JS" problem identified in §2.4 for the pages that matter most. **This is the one item on this list an implementation agent can build without waiting on an infra decision from the owner.**
3. **IndexNow.** Add a key file `public/{key}.txt` (8–128 hex chars per spec) and a small publish-time script `scripts/indexnow-ping.mjs` (same invocation pattern as `generate-sitemap.mjs`) that POSTs new/changed metro URLs to `https://api.indexnow.org/indexnow` (fans out to Bing, Yandex, Seznam). Cheap, and per §1.5/§1.3 plausibly double-duty for ChatGPT search via the Bing-index relationship.
4. **Bing Webmaster Tools + GSC.** **[REC — owner action, not repo work:** verify `mygravelguy.com` in Bing Webmaster Tools (can import verification from GSC if GSC is already verified — confirm status is an open question for the owner, not found in repo), enable IndexNow inside Bing Webmaster Tools, and submit `sitemap.xml`. Same for Google Search Central / GSC if not already verified. No repo file changes; flagging here because nothing in §3 downstream matters if these platform accounts aren't set up to *measure* the effect (see §3.8).
5. **`lastmod` accuracy.** `scripts/generate-sitemap.mjs`'s `STATIC_PAGES` array currently ships an **identical hardcoded `lastmod` across every static page** (`2026-03-04` observed in the live `sitemap.xml`), which is a tell that the date is a build-script default, not a real per-page freshness signal. Per §1.6(4), freshness is one of the few signals AI retrieval layers can check cheaply. **[REC]** compute `lastmod` per route from actual content (git log of the page's source file, or a CMS `updated_at`) rather than a single constant, at minimum for the new metro pages being added in this pivot.
6. **Cloudflare bot settings — an open item, not a repo change.** If Cloudflare is confirmed in front of the origin (see #2), check Cloudflare dashboard → Security → Bots for a **Bot Fight Mode / Super Bot Fight Mode** setting that might be silently challenging or blocking `OAI-SearchBot`, `PerplexityBot`, or `ClaudeBot` as unrecognized automated traffic, and check the newer **"AI Crawl Control" / "AI Scrapers and Crawlers"** category if the Cloudflare plan exposes it — the goal is to *allow* the citation-relevant bots (`OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`) even if a blanket "block AI bots" toggle is tempting for cost/scraping reasons elsewhere on the site. **[NEEDS_REAL_NUMBER: current Cloudflare plan/zone settings — not visible from this repo; owner or infra agent must check the dashboard directly.]**
7. **New `public/llms.txt` for the metro pivot.** The current file (read in full, above) claims nationwide coverage, "all 50 states," "33,700+ ZIP codes," which directly contradicts the metro-by-metro pivot this plan supports and would actively mislead any LLM that ingests it. Full rewrite drafted below — ready to paste into `public/llms.txt` by an implementation agent (this doc does not apply it, per scope):

```markdown
# MyGravelGuy.com

> Metro-by-metro bulk landscape materials delivery, starting with Dallas–Fort Worth, TX. Order gravel, sand, topsoil, and mulch online with instant delivered pricing — dead-simple ordering, no quote-and-wait.

## About

MyGravelGuy delivers bulk gravel, sand, topsoil, and mulch directly to homeowners and contractors, metro by metro. We are not a nationwide marketplace — we launch one metro at a time, backed by real local delivery operations, starting with Dallas–Fort Worth. Our sister yard, Eastern LM (easternlm.com), has completed 3,745 real bulk material deliveries on Long Island, NY (2023–2026) — the operational playbook behind every metro we launch.

**Business model**: Instant per-ZIP delivered pricing, online ordering, 3-ton minimum, free delivery included in every price.

**Tagline**: "Do You Have a Gravel Guy?"

## Markets currently served

- **Dallas–Fort Worth, TX** — https://mygravelguy.com/dallas-fort-worth
  - Gravel delivery: https://mygravelguy.com/dallas-fort-worth/gravel-delivery
  - Mulch delivery: https://mygravelguy.com/dallas-fort-worth/mulch-delivery
  - Sand delivery: https://mygravelguy.com/dallas-fort-worth/sand-delivery
  - Soil delivery: https://mygravelguy.com/dallas-fort-worth/soil-delivery

[NEEDS_REAL_NUMBER: add each additional metro's URL block here as it launches — do not re-add nationwide/all-50-states language]

## Reference content

- Gravel Driveway Hub (cost, materials, how-much-do-I-need guidance, backed by real delivery data): https://mygravelguy.com/gravel-driveways/
- Gravel Driveway Cost Index (per-metro, per-material real delivered pricing): [NEEDS_REAL_NUMBER: URL once §3.5 asset ships]

## Products & Services

Bulk gravel (crushed stone, driveway gravel, pea gravel, crusher run), sand, topsoil, and mulch. Instant delivered pricing by ZIP code within served metros only. 3-ton minimum. Free delivery included.

## Company

- Company: Eastern Building Supply Inc.
- Sister operation: Eastern LM (easternlm.com) — Long Island, NY yard, 3,745 real deliveries 2023–2026
- Phone: (844) 624-0400
- Email: support@mygravelguy.com

## Sitemap

https://mygravelguy.com/sitemap.xml
```

   **[REC]** Do not publish this until the DFW routes in the draft actually exist and the metro-page content in §3.2 is live — an `llms.txt` pointing at 404s is worse than the current inaccurate one.

### 3.2 Gravel Driveway Hub + spokes

**[REC]** Structure: one hub page `/gravel-driveways/` (the "Gravel Driveway Cost, Materials & How Much You Need" pillar) plus city/metro spokes that are the actual conversion pages already being built (`/dallas-fort-worth/gravel-delivery`), plus topical spokes that don't need a metro (calculators, comparisons) living under `/gravel-driveways/*`. This deliberately reuses two components the parallel **METRO-UI** agent has already built (per `docs/metro/HANDOFF-LOG.md` Wave 2/3, confirmed present in-repo): `src/metro/components/marketing/DirectAnswerBlock.tsx` (explicitly commented in its own source as *"AEO block... meant to be quotable verbatim by Google AI Overviews, Gemini, ChatGPT"*) and `FaqSection.tsx` (already exports `faqJsonLd`, a `FAQPage` schema generator). **This plan's content strategy is to feed real content into infrastructure that already exists, not to invent new components** — flag any duplicate-component risk to the METRO-UI/METRO-CORE agents before building new ones.

**Question universe → page mapping (representative sample; full set below draws on `MyGravelGuy_keyword_universe.csv` (65 rows) + `buyer_questions.csv` (24 rows) in `C:\Users\adam\projects\mygravelguy-site\content-pipeline\`, plus the 20 live driveway questions researched in §2 — combined addressable universe ≈100–110 distinct questions once city-name variants are counted per the existing sheet's own "collapse near-duplicates" rule):**

| # | Question | Intent | Target URL | Format |
|---|---|---|---|---|
| 1 | How much does a gravel driveway cost? | Informational/commercial | `/gravel-driveways/` (hub) | DirectAnswerBlock + cost table by material |
| 2 | How much does a gravel driveway cost in Dallas–Fort Worth? | Commercial, local | `/dallas-fort-worth/gravel-delivery` | DirectAnswerBlock w/ real DFW delivered $/ton |
| 3 | What is the best gravel for a driveway? | Informational | `/gravel-driveways/best-gravel-for-driveways` | Comparison table + DirectAnswerBlock |
| 4 | How much gravel do I need for my driveway? | Tool intent | `/gravel-driveways/calculator` (canonical per existing `link_asset_proposal.md`) | Tool + methodology |
| 5 | How deep should a gravel driveway be? | Informational | `/gravel-driveways/gravel-driveway-depth-guide` | DirectAnswerBlock + layered-depth diagram |
| 6 | Crusher run vs #57 stone for a driveway — which is better? | Comparison | `/gravel-driveways/crusher-run-vs-57-stone` | Comparison table + DirectAnswerBlock |
| 7 | Flex base vs crushed limestone for a driveway (Texas)? | Comparison, local | `/dallas-fort-worth/flex-base-vs-crushed-limestone` | Comparison table, TX-specific |
| 8 | Gravel driveway cost per square foot in Texas? | Commercial, local | `/dallas-fort-worth/gravel-delivery` (spoke section) | DirectAnswerBlock, real $/sq ft |
| 9 | Gravel vs. concrete driveway — Dallas cost comparison | Comparison, local | `/dallas-fort-worth/gravel-vs-concrete-driveway` | Comparison table |
| 10 | How do I maintain a gravel driveway? | Informational | `/gravel-driveways/gravel-driveway-maintenance` | HowTo schema |
| 11 | How many tons of gravel for a 100 ft driveway? | Tool/calc | `/gravel-driveways/calculator` (preset) | Worked example + DirectAnswerBlock |
| 12 | #57 stone vs #8 stone — what's the difference? | Comparison | `/gravel-driveways/57-vs-8-stone` | Comparison table |
| 13 | How much does a ton of gravel cover? | Informational | `/gravel-driveways/how-much-does-a-ton-of-gravel-cover` | DirectAnswerBlock + coverage table by depth |
| 14 | Gravel driveway drainage — how do I fix pooling water? | Informational | `/gravel-driveways/gravel-driveway-drainage` | HowTo schema |
| 15 | Is a gravel driveway cheaper than asphalt? | Comparison | `/gravel-driveways/gravel-vs-asphalt-cost` | Comparison table |
| 16 | Pea gravel driveway — pros and cons? | Informational | `/gravel-driveways/pea-gravel-driveway-pros-cons` | Pros/cons list + DirectAnswerBlock |
| 17 | Best gravel for a driveway in Texas? | Informational, local | `/dallas-fort-worth/best-gravel-for-driveway-texas` | DirectAnswerBlock, TX-specific materials |
| 18 | How much crusher run do I need for a driveway? | Tool/calc | `/gravel-driveways/calculator` (preset) | Real `ton_yard_ratio` math |
| 19 | Should I DIY or hire delivery + spreading? | Commercial investigation | `/gravel-driveways/diy-vs-hire-gravel-delivery` | DirectAnswerBlock, honest tradeoff |
| 20 | Do you deliver gravel to [DFW town]? | Local/transactional | `/dallas-fort-worth` town-spoke sections | Served-ZIP lookup |
| 21–~105 | City-name variants of #2/#17/#20 across DFW-metro towns; contractor/B2B variants (`bulk gravel delivery for construction jobsites`, `contractor gravel supplier`) already scoped `queued`/`unpublished` in `MyGravelGuy_keyword_universe.csv`; material-specific coverage questions for mulch/sand/soil parallel to #4/#11/#18 | Mixed | `/dallas-fort-worth/{material}-delivery` + `/gravel-driveways/*` spokes | See CSV `page_type`/`format` columns |

**[REC]** Rows 1–20 above are the recommended **Wave 1 build list** (highest question-frequency, matches the brief's literal example list almost exactly, and reuses the exact rows already `queued`/`unpublished` in the prior keyword sheet where they overlap — e.g. rows 11, 18, 19 map directly to existing CSV rows, avoiding rework). Full ~30-spoke target is reached by adding the mulch/sand/soil parallels once the gravel spokes are proven.

### 3.3 40–60 word answer-block drafts (top 15)

**[REC]** — draft copy for implementation, meant to sit inside `DirectAnswerBlock`. Every number here is either sourced to §2's live research (marked) or marked `[NEEDS_REAL_NUMBER]` where it requires MGG/ELM's actual price book or delivery data — **do not ship a number that isn't real**; that would violate the honesty principle this whole plan rests on (§1.6.5's differentiator is *real* first-party data, and a fabricated number is worse than no page).

1. **Cost:** "A gravel driveway typically costs $1–$10 per square foot installed, or roughly $500–$3,500 total for an average driveway, depending on material and site prep (Angi, HomeGuide, 2026 data). In Dallas–Fort Worth, delivered material alone runs `[NEEDS_REAL_NUMBER: DFW confirmed $/ton]` once our DFW partner pricing is signed — see our DFW gravel delivery page for a live per-ZIP quote."
2. **DFW cost:** "`[NEEDS_REAL_NUMBER — do not publish until dfwCatalog.ts pricing is priceBookConfirmed]`. Placeholder structure: 'Delivered gravel in Dallas–Fort Worth runs $X–$Y per ton as of [date], quoted instantly by ZIP code — see current pricing for your address.'"
3. **Best gravel:** "3/4-inch crushed stone (#57) is the most commonly recommended driveway gravel — angular edges lock together for stability, and it drains well enough to resist pooling. Crusher run (a mix of crushed stone and stone dust) compacts harder for a base layer. Most driveways use both: crusher run as base, #57 as the top layer."
4. **How much do I need (calculator):** "Multiply length × width × depth (in feet), divide by 27 for cubic yards, then apply your material's real tons-per-yard ratio — most gravel runs about 1.3–1.5 tons per cubic yard. A 10×40 ft driveway at 4 inches deep needs roughly 2.2 cubic yards, about 3 tons. Use our calculator for your exact material and ZIP."
5. **Depth:** "Most residential gravel driveways use 4–6 inches of surface gravel over a compacted base, for a total depth of 6–9 inches in a two-layer system, or up to 12–18 inches in a full three-layer build on soft or clay soil. Deeper isn't always better — depth should match your soil and traffic load."
6. **Crusher run vs #57:** "Crusher run compacts to 85–95% of its loose volume and binds like a low-grade concrete — best for a stable driveway base. #57 stone is clean, angular, drains better, but only compacts to 70–80% and can shift underfoot. Most driveways use crusher run as the base and #57 as the top layer."
7. **Flex base vs crushed limestone (TX):** "In Texas, 'flex base' is a TxDOT Item 247 specification, not a separate material — Type A flex base *is* crushed limestone graded from 1.5 inches down to fine dust. For DFW clay soils, 3/4-inch-down flex base is the standard residential driveway spec: it compacts tight and resists washout."
8. **Cost per sq ft TX:** "Professional gravel driveway installation in Texas runs about $4–$10 per square foot including base prep and compaction — higher than the $1–$10 national range because of clay-soil prep, but Texas labor rates run 20–30% below the national average. Material-only, spread but not compacted, runs $1–$3 per square foot."
9. **Gravel vs concrete (Dallas):** "Gravel costs $1–$3 per square foot versus $8–$18 for concrete in the Dallas area — but gravel needs regrading and fresh material every 1–3 years ($0.25–$1/sq ft each time), while concrete lasts 30–40 years with occasional resealing. Gravel wins on upfront cost and drainage; concrete wins on long-term low maintenance."
10. **Maintenance:** "Gravel driveways need regrading and fresh material every 1–3 years, periodic raking to redistribute stone, and prompt pothole repair (clear debris, refill and compact in layers). Twice-yearly inspection for ruts and erosion, plus keeping drainage clear, is the single highest-leverage habit for long-term durability."
11. **Tons for 100 ft driveway:** "A 100 ft × 12 ft driveway (1,200 sq ft) at 4 inches deep needs about 15 cubic yards, roughly 20–22 tons of gravel. At 6 inches deep, that rises to about 22 cubic yards, roughly 30 tons. Order 5–10% extra to cover settling and compaction loss."
12. **#57 vs #8 stone:** "#57 stone is about 3/4 inch — the standard driveway and base material because its size compacts tightly while still draining well. #8 stone is smaller, 3/8–1/2 inch, better suited to walkways, bedding, and decorative top-dressing than to a load-bearing driveway surface."
13. **Ton coverage:** "One ton of gravel covers about 100 sq ft at 2 inches deep, 80 sq ft at 3 inches, 60 sq ft at 4 inches, and roughly 33 sq ft at 6 inches deep. Coverage varies slightly by stone size and shape — use our calculator with your exact material for a precise number."
14. **Drainage:** "Gravel driveways need a center crown with a 2–5% cross-slope to shed water off the tire paths, not through them. Persistent pooling usually means the crown has flattened or a low spot has formed — regrading, a shallow channel drain, or a French drain alongside the low side usually resolves it."
15. **Gravel vs asphalt:** "Gravel runs $1–$3 per square foot versus $2–$5 for asphalt installed — asphalt costs more upfront but needs less frequent attention (resurfacing every ~10 years vs. gravel's 1–3 year regrading cycle) and handles freeze-thaw better. Gravel drains better and is far cheaper to repair piecemeal."

### 3.4 Schema per page type

**[REC]** All schema renders via the existing `react-helmet-async` + inline `<script type="application/ld+json">` pattern already used on `src/pages/MarketMaterialPage.tsx` — no new dependency needed.

| Page type | Schema | Notes |
|---|---|---|
| Hub (`/gravel-driveways/`) | `CollectionPage` + `BreadcrumbList` | Links out to all spokes |
| Metro landing (`/dallas-fort-worth`) | `LocalBusiness` (or `Service` if `LocalBusiness` overstates a physical DFW location before a partner yard is signed — **[REC] use `Service` with `areaServed` until a real DFW address/partner exists; don't claim a location MGG doesn't have**) + `BreadcrumbList` | Honesty-gated on partner status |
| Material spoke (`/dallas-fort-worth/gravel-delivery`) | `Product` or `Service` (reuse the `Product` JSON-LD block already built in `MarketMaterialPage.tsx` — same shape: price, availability, `MerchantReturnPolicy`) + `FAQPage` (`faqJsonLd` from `FaqSection.tsx`) | Reuse, don't reinvent |
| Comparison/guide spokes (crusher-run-vs-57, depth guide, etc.) | `Article` + `FAQPage` where the page ends in a Q&A section | `Article.dateModified` must be real (ties to §3.1.5) |
| HowTo spokes (maintenance, drainage) | `HowTo` | Step-by-step; Google explicitly supports rich results for this type |
| Cost Index asset (§3.5) | `Dataset` (per Google's dataset structured-data guidelines) + `Article` | `Dataset` is the least commonly used schema type among competitors found in §2 — a differentiation opportunity |
| Reviews/testimonials (if used on any spoke) | `Review`/`AggregateRating` only with real, verifiable reviews | Given the §2.3 brand-collision/attribution-confusion finding, do **not** aggregate reviews from ambiguous sources — only MGG's own verified reviews |

### 3.5 Original-data asset: "Gravel Driveway Cost Index"

**[REC]** One asset, structured like `link_asset_proposal.md`'s existing calculator proposal (same discipline: real data only, `[NEEDS_REAL_NUMBER]` rather than invented figures). Concept: a per-metro × per-material **delivered price** table (not material-only — delivered is the differentiator per §1.6.5), refreshed on a defined cadence, published as both a human-readable page and a `Dataset`-schema-tagged data table.

- **URL:** `/gravel-driveways/cost-index` (or `/data/gravel-driveway-cost-index` — implementation agent's call; keep under the hub for internal-linking equity).
- **Data source:** MGG's own price book (`src/metro/config/dallasFortWorth.ts` / `data/dfwCatalog.ts` pricing engine outputs) plus ELM's real Long Island historical order data (the 3,745-delivery dataset already referenced in `docs/metro/HANDOFF-LOG.md`) once both are `priceBookConfirmed` — **hard gate: do not publish DFW numbers while `dallasFortWorth.ts`'s own header comment says pricing is placeholder pending partner price sheets.**
- **Methodology section required** (per §1.6.5, this is what earns links/citations that a bare number wouldn't): sample size, date range, how "delivered price" is computed (base + zone load cost + minimum), update cadence, and what's excluded (quote-only/custom orders).
- **Schema:** `Dataset` (name, description, `creator`, `temporalCoverage`, `spatialCoverage` per metro, `distribution`) + `Article` for the surrounding narrative.
- **KPI:** referring domains, and — critically — inclusion as a cited source in the weekly AI-answer panel (§3.8) specifically for cost-related prompts, which is the most direct signal this asset is working.

### 3.6 E-E-A-T

**[REC]**
- **Author attribution:** Byline every guide/comparison spoke to a named Eastern LM yard operator (real name, real role, e.g., "Yard Operations, Eastern LM — 3,745 Long Island deliveries since 2023") rather than "MyGravelGuy Team." This is the single cheapest E-E-A-T lever available given ELM's genuine operating history, and directly answers "why should an AI engine trust this over Homeguide" (§1.6.5).
- **Real delivery photos with dates/locations**, not stock imagery — on the metro landing pages and the Cost Index methodology section. Caption with metro + rough date ("DFW delivery, [month] 2026") once DFW deliveries exist; ELM photos can front-run this for the Long Island pilot content.
- **Author bio page** (`/about/team` or extend existing `/about`) listing the named operators with their real operational credentials — supports `Person` schema linked from `Article.author`.
- **"Updated [date]" visible on every spoke**, tied to the real `lastmod` fix in §3.1.5 — cosmetic and structured-data freshness should match, or it reads as fake.

### 3.7 Off-site entity building

**[REC]** — none of this is repo work; flagging as owner/marketing-agent action items, prioritized by effort:cost ratio:
1. **Google Business Profile** for the DFW operation once a partner yard/address exists — GBP is a direct AI-Overview/Gemini local-pack input and currently MGG has no physical DFW presence to list (open question already logged in `HANDOFF-LOG.md`: DFW partner yard relationships).
2. **`sameAs` schema** on the `Organization`/`LocalBusiness` markup linking every real owned profile (GBP, any verified social accounts, reviews.io/Trustindex if MGG sets one up) — directly mitigates the §2.3 brand-collision problem by giving engines an unambiguous entity graph to resolve "MyGravelGuy" against, rather than blending it with mygravelmonkey.com or thegravelguy.com.
3. **YouTube how-to content** (driveway prep, coverage math, "what crusher run vs #57 looks like") — cheap to produce with real ELM/DFW yard footage, and video is a format Google's AI features and Gemini both surface as its own SERP feature, a second citation surface beyond text.
4. **Reddit genuine participation** (r/landscaping, r/HomeImprovement, local DFW/Long Island subs) — answer real driveway-gravel threads with real expertise, link only when genuinely relevant. **[REC] explicit non-goal:** do not seed/plant questions or post as multiple accounts — Reddit's own anti-manipulation enforcement and reputational risk to a real operating business make this a hard line, and it would undercut the E-E-A-T story in §3.6 if discovered.
5. **Local directories/citations** (data aggregators, Chamber of Commerce, TX/NY-specific trade directories) — standard NAP-consistency work, low effort, supports the entity-disambiguation goal in #2.
6. **Local PR** — a DFW-market-entry story pitched to local TX trade/business press once the partner yard is signed; a Long Island press angle around the 3,745-delivery ELM dataset is available today, independent of DFW timing.

### 3.8 Measurement

**[REC]** Because §0's honesty note holds — no citation is guaranteed — the deliverable here is a *share* measurement system, not a promise:

- **50-prompt weekly panel.** Build a fixed list of ~50 prompts (start from the 20 in §2 plus 30 more from the question universe in §3.2) run identically every week against: Google AI Overviews (manual/logged-in check, since there's no public API), Google AI Mode, Gemini app, ChatGPT (web + search-enabled), Perplexity. Track: (a) does MGG appear at all, (b) as a linked citation vs. bare mention, (c) which URL, (d) verbatim vs. paraphrased.
- **Tooling options (pick one to start; all are 3rd-party subscriptions, not repo work):** Profound, Otterly.AI, Peec AI, Semrush's AI toolkit (Enterprise AIO/AI Visibility), Ahrefs Brand Radar — these all automate some version of the panel above. **[REC]** given MGG's scale, start with the **DIY panel manually run weekly** (spreadsheet, ~30–60 min/week) before paying for a tool — validate the panel design and get 4–6 weeks of baseline data first, then decide whether the time cost justifies a subscription. `[NEEDS_REAL_NUMBER: tool pricing changes; get current quotes before recommending a specific spend]`.
- **GA4 AI-referral channel.** Configure a custom channel grouping/regex to bucket referral traffic from `chat.openai.com`, `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, and Google's AI Overview click-through pattern (referrer behavior for AI Overview clicks is not fully distinguishable from regular organic in GA4 — flag this as a known measurement limitation, not a solved problem) into one "AI assistants" channel, so traffic (not just citation-appearance) is tracked over time.
- **GSC.** Once verified (§3.1.4), GSC won't show AI-Overview-specific impressions as a separate row today, but total impressions/clicks/position on the new metro and hub URLs is still the baseline organic-visibility signal underneath all AI citation (per §1.1, AI Overview eligibility requires normal Search snippet-eligibility first) — track it as the leading indicator.
- **Cadence:** weekly panel run + monthly rollup comparing share-of-voice trend against the Wave 1 build list in §3.2, reported alongside the existing `docs/metro/HANDOFF-LOG.md` change log so it stays visible to the rest of the metro-pivot work.

---

## 4. 90-day roadmap

**[REC]** Google/Gemini-first ordering, per the brief — §1 established that Google (AI Overviews, AI Mode, Gemini grounding) all ride on the same underlying requirement (indexed + snippet-eligible + fresh + real content), so the first six weeks are shared infrastructure that also happens to be the prerequisite for ChatGPT/Perplexity citation, not solely a "Google-only" investment. File paths are exact where the file exists today; `(new)` marks files this plan expects an implementation agent to create.

### Weeks 1–2 — Technical foundation (P0, no content dependency)
- Explicit AI-crawler `Allow` block in `public/robots.txt` (§3.1.1).
- Resolve the Cloudflare-in-front-of-VPS question with the owner/infra (§3.1.2) — this gates whether `cloudflare-worker/` or an origin-side prerender script is the right P0 vehicle.
- Build `scripts/prerender-static-routes.mjs` (new) targeting the metro routes as they land from the parallel METRO-UI/METRO-CORE agent work; wire into `npm run build` alongside the existing `scripts/generate-sitemap.mjs` call.
- Fix `scripts/generate-sitemap.mjs` `lastmod` generation to be per-route-real, not a constant (§3.1.5).
- Create IndexNow key file (`public/{key}.txt`, new) + `scripts/indexnow-ping.mjs` (new).
- Owner action: verify GSC (if not already) and Bing Webmaster Tools; enable IndexNow in Bing Webmaster Tools; confirm current Cloudflare bot-management settings if applicable.
- Stand up the manual 50-prompt weekly panel spreadsheet (§3.8) and run week-1 baseline **before** any content ships — this is the only way later weeks can show delta.

### Weeks 3–4 — Hub page + Wave 1 content (rows 1–10 from §3.2's table)
- Build `/gravel-driveways/` hub page (new route + page component, reusing `src/metro/components/marketing/{DirectAnswerBlock,FaqSection}.tsx`).
- Ship spokes for table rows 1, 3, 4, 5, 6, 10, 11, 13, 14, 15 (cost overview, best gravel, calculator, depth guide, crusher-run-vs-57, maintenance, tons-for-100ft, ton-coverage, drainage, gravel-vs-asphalt) — none of these require confirmed DFW pricing, so they're unblocked regardless of partner-yard status.
- Apply schema per §3.4 (`CollectionPage`, `Article`, `FAQPage`, `HowTo`) to each as shipped.
- Add each new URL to `scripts/generate-sitemap.mjs`'s `STATIC_PAGES` and ping IndexNow on publish.
- Continue weekly panel.

### Weeks 5–6 — DFW-specific spokes + metro landing (rows 2, 7, 8, 9, 17, 20)
- **Gated:** rows 2, 8 (DFW-specific delivered pricing) can only ship real numbers once `src/metro/config/dallasFortWorth.ts` moves from placeholder to `priceBookConfirmed = true` — coordinate with the METRO-CORE/DFW-SCRAPER agent workstreams already tracked in `docs/metro/HANDOFF-LOG.md` rather than duplicating that pricing work here.
- Ship rows 7 (flex base vs crushed limestone TX), 9 (gravel vs concrete Dallas), 17 (best gravel TX), 20 (served-town lookup) — these need TX-market facts but not MGG's own confirmed price book.
- `/dallas-fort-worth` metro landing page schema per §3.4's `Service`-not-`LocalBusiness` guidance until a partner yard address exists.
- First Cost Index draft (§3.5) using Long Island/ELM data only if DFW isn't `priceBookConfirmed` yet — ship metro-by-metro as data becomes real rather than waiting for both.

### Weeks 7–8 — E-E-A-T + off-site foundation
- Byline retrofit: attach named ELM/DFW operator authorship to all spokes shipped so far (§3.6).
- Real delivery photos swapped in where stock images were used as placeholders.
- `sameAs`/`Organization` schema pass addressing the §2.3 brand-collision risk.
- Owner action: GBP setup once DFW partner yard exists; local directory/citation submissions.
- `Dataset` schema finalized on the Cost Index once at least one metro's numbers are confirmed.

### Weeks 9–10 — ChatGPT/Perplexity-specific hardening + remaining Wave 1 rows
- Verify `OAI-SearchBot`/`PerplexityBot` are actually reaching prerendered content (server-log check once VPS logs are accessible, per CLAUDE.md's self-hosting transition) — confirms whether §3.1.2's fix actually worked for the engines it targeted.
- Ship remaining rows (12, 16, 18, 19) and begin the mulch/sand/soil parallel spokes.
- YouTube how-to content batch (§3.7.3) using DFW/ELM footage.
- Begin Reddit genuine-participation cadence (§3.7.4) — ongoing, not a one-time task.

### Weeks 11–13 — Measurement rollup + iterate
- First full monthly rollup comparing week-1 baseline vs. week-13 panel results, per prompt and per engine.
- Decide, with real 8+ weeks of DIY panel data in hand, whether a paid tracking tool (Profound/Otterly/Peec/Semrush AI toolkit/Ahrefs Brand Radar) is justified (§3.8).
- Local PR push (Long Island 3,745-delivery story; DFW market-entry story if partner yard is live by week 13).
- Identify the highest-performing Wave 1 spokes by citation share and double down on that content pattern for Wave 2 (remaining ~10–15 rows of the full question universe, plus mulch/sand/soil expansion).

**[REC] Cross-cutting dependency note:** every week above assumes the parallel `METRO-CORE`/`METRO-UI`/`DFW-SCRAPER` agent workstreams tracked in `docs/metro/HANDOFF-LOG.md` are shipping the underlying metro routes, pricing engine, and DFW competitor/pricing data on a roughly similar timeline. This AEO plan does not duplicate that work (routes, pricing, zip configs) — it assumes it as an input and focuses on the content/technical/measurement layer on top of it. If those workstreams slip, the content-shipping weeks (3–10 above) should slip with them rather than shipping placeholder pricing to hit a date.

---

## 5. Appendix

### 5.1 Sources cited in this plan

- Google Search Central — [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- Google Search Central — [Overview of Google crawlers and fetchers](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers)
- Google — [Gemini Apps Privacy Hub](https://support.google.com/gemini-app/answer/13594961)
- OpenAI/Developers — [Bots documentation (GPTBot, OAI-SearchBot, ChatGPT-User)](https://developers.openai.com/api/docs/bots)
- Perplexity — [Crawlers guide (PerplexityBot, Perplexity-User)](https://docs.perplexity.ai/guides/bots)
- IndexNow — [Documentation](https://www.indexnow.org/documentation)
- Secondary corroboration on Google-Extended mechanics (Google's own crawler-list page wasn't fully fetchable in table form during this research session): [ppc.land — Explaining Google-Extended](https://ppc.land/google-extended/), [Menra — Gemini Crawlers Explained](https://www.menra.ai/guides/gemini-crawler-guide)
- Secondary press on the OpenAI/Microsoft Bing search partnership: [TechCrunch, Feb 2023](https://techcrunch.com/2023/02/07/microsoft-launches-the-new-bing-with-chatgpt-built-in/)
- §2 domain findings: 20 live WebSearch queries run 2026-09-27, full result lists retained in this session's tool transcript, not reproduced verbatim here for length — representative URLs are cited inline in §2.2's table.

### 5.2 Repo files referenced by this plan

- `public/robots.txt`, `public/llms.txt`, `public/sitemap.xml`
- `scripts/generate-sitemap.mjs`
- `cloudflare-worker/src/index.ts`, `cloudflare-worker/wrangler.toml`
- `src/metro/components/marketing/DirectAnswerBlock.tsx`, `src/metro/components/marketing/FaqSection.tsx`
- `src/metro/config/dallasFortWorth.ts`, `src/metro/config/data/dfwCatalog.ts`
- `src/pages/MarketMaterialPage.tsx` (existing schema pattern reference)
- `docs/metro/HANDOFF-LOG.md`
- `C:\Users\adam\projects\mygravelguy-site\content-pipeline\MyGravelGuy_keyword_universe.csv`, `buyer_questions.csv`, `existing_coverage.csv`, `link_asset_proposal.md`, `SESSION_REPORT.md` (prior keyword-research session, 2026-08-05)

### 5.3 Known gaps / open questions this plan could not resolve from the repo alone

- Whether Cloudflare actually sits in front of the Hetzner VPS in production (blocks a clean §3.1.2 recommendation).
- Current Bing Webmaster Tools / GSC verification status (not visible from the repo).
- Current Cloudflare bot-management plan/settings, if applicable.
- DFW partner yard status — blocks `LocalBusiness`/GBP work and confirmed pricing for the Cost Index (tracked as an existing open question in `docs/metro/HANDOFF-LOG.md`, not new to this plan).
- Real-time confirmation of whether ChatGPT search still routes through Bing's index as of September 2026 — sourced to 2023-era reporting on the OpenAI/Microsoft partnership; the underlying architecture is not re-confirmed by a 2026 official source in this research pass.

---
