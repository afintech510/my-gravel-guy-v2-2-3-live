# AI-Visibility Baseline (P8) — MyGravelGuy

_Status: COMPLETE (first pass) — web-search-proxy baseline for all 50 prompts collected and written up; the real AI-answer baseline (§5) has not been run yet and is pending the owner. Author: D-AI-VISIBILITY agent, 2026-09-28. Research/docs only — no repo code changes._

**Purpose:** This is the measurement backbone for the #1 objective of the metro pivot — getting mygravelguy.com quoted/cited in Google AI Overviews / AI Mode / Gemini, then ChatGPT, Perplexity, and Copilot, for gravel-driveway and bulk-material-delivery questions (DFW + Long Island focus, plus national informational questions). It confirms and supersedes the "P8 was never run" gap flagged in `docs/metro/research/external-llm-synthesis-2.md` §6.

**Critical honesty caveat, read before anything else below:** This agent has WebSearch/WebFetch tools only — it does **not** have logged-in, engine-native access to Google AI Overviews, Google AI Mode, the Gemini app, ChatGPT, Perplexity, or Copilot. Every row in `baseline-2026-09-28.csv` is tagged `engine = web-search-proxy`: a classic organic-search snapshot (via the WebSearch tool, which is Google-backed) used as the best available **proxy** for what those engines' retrieval layers might surface — it is emphatically **not** a captured AI Overview, AI Mode, Gemini, ChatGPT, Perplexity, or Copilot answer. Nowhere in this document is a claim made that MGG was observed cited in an actual AI answer. Section 5 is the manual protocol required to get that real, observed data, and it has not been run yet as of this writing.

---

## 1. The canonical 50-prompt tracking set

Source: 18 driveway questions + brand/site queries from `docs/metro/research/aeo-plan.md` §2, the 10 verbatim P8 questions from `docs/metro/prompts/external-llm-prompts.md`, and additional rows from `aeo-plan.md` §3.2's ~100-question universe, filled out to 50 with DFW-local, Long-Island-local, and national-informational variants so every intent bucket the AEO plan targets has real coverage. `P8-*` IDs mark the 10 questions that are verbatim from the assigned P8 prompt — do not reword those when re-running this panel; the other 40 (`AEO-*`, `LOCAL-*`, `NAT-*`, `BRAND-*`) are free to refine over time but should stay stable once a baseline exists, per §3.8 of `aeo-plan.md`.

Intent tags: `brand` | `local-dfw` | `local-li` | `informational` | `commercial`.
Engine priority: `P1` = Google AI Overviews/AI Mode/Gemini (the project's stated #1 objective — same underlying Google index per `aeo-plan.md` §1.1–1.2), `P2` = ChatGPT, `P3` = Perplexity/Copilot. All 50 prompts get checked on cadence across all engines per §5; the priority column just reflects which engine's result matters most if time is short on a given week.

| # | prompt_id | Prompt | Intent | Engine priority |
|---|---|---|---|---|
| 1 | BRAND-01 | MyGravelGuy | brand | P1 |
| 2 | BRAND-02 | My Gravel Guy reviews | brand | P1 |
| 3 | BRAND-03 | mygravelguy.com | brand | P1 |
| 4 | BRAND-04 (=P8 Q10) | What is MyGravelGuy and is it legit? | brand | P2 |
| 5 | BRAND-05 | Is mygravelguy.com legitimate or a scam? | brand | P2 |
| 6 | P8-01 | Where can I order gravel delivered in Dallas? | local-dfw | P1 |
| 7 | P8-02 | What's the easiest way to get mulch delivered in Fort Worth? | local-dfw | P1 |
| 8 | P8-03 | How much does a gravel driveway cost in Dallas, Texas? | local-dfw | P1 |
| 9 | P8-04 | What is the best gravel for a driveway in North Texas clay soil? | local-dfw | P1 |
| 10 | P8-05 | How much gravel do I need for a 12 x 60 ft driveway? | commercial | P1 |
| 11 | P8-06 | Crusher run vs flex base vs #57 limestone for a driveway, which is better? | informational | P1 |
| 12 | P8-07 | How much does a yard of mulch cost delivered in DFW? | local-dfw | P1 |
| 13 | P8-08 | Who delivers small loads of topsoil in Plano / Frisco? | local-dfw | P2 |
| 14 | P8-09 | Is there a website where I can see a delivered price for gravel before I call? | commercial | P2 |
| 15 | LOCAL-DFW-01 | Gravel driveway cost per square foot in Texas | local-dfw | P1 |
| 16 | LOCAL-DFW-02 | Gravel vs concrete driveway cost Dallas | local-dfw | P1 |
| 17 | LOCAL-DFW-03 | Flex base vs crushed limestone driveway Texas | local-dfw | P1 |
| 18 | LOCAL-DFW-04 | Best gravel for a driveway in Texas | local-dfw | P1 |
| 19 | LOCAL-DFW-05 | DFW bulk gravel delivery near me | local-dfw | P1 |
| 20 | LOCAL-DFW-06 | Do you deliver gravel to Frisco or McKinney TX? | local-dfw | P2 |
| 21 | LOCAL-DFW-07 | Gravel driveway installation cost DFW | local-dfw | P1 |
| 22 | LOCAL-LI-01 | Gravel driveway cost Long Island | local-li | P1 |
| 23 | LOCAL-LI-02 | Gravel delivery Long Island NY | local-li | P1 |
| 24 | LOCAL-LI-03 | Mulch delivery Hamptons | local-li | P1 |
| 25 | LOCAL-LI-04 | Topsoil delivery Suffolk County NY | local-li | P1 |
| 26 | LOCAL-LI-05 | Best gravel for driveway Long Island | local-li | P1 |
| 27 | LOCAL-LI-06 | Bulk sand delivery Nassau County NY | local-li | P1 |
| 28 | LOCAL-LI-07 | Gravel driveway installation cost Long Island NY | local-li | P1 |
| 29 | LOCAL-LI-08 | Crushed stone delivery Long Island near me | local-li | P1 |
| 30 | LOCAL-LI-09 | Gravel vs asphalt driveway Long Island | local-li | P1 |
| 31 | LOCAL-LI-10 | Mulch delivery Long Island NY | local-li | P1 |
| 32 | AEO-01 | How much does a gravel driveway cost? | informational | P1 |
| 33 | AEO-02 | What is the best gravel for a driveway? | informational | P1 |
| 34 | AEO-03 | How much gravel do I need for my driveway? | commercial | P1 |
| 35 | AEO-04 | How deep should a gravel driveway be? | informational | P1 |
| 36 | AEO-05 | Crusher run vs #57 stone for a driveway, which is better? | informational | P1 |
| 37 | AEO-06 | How do I maintain a gravel driveway? | informational | P1 |
| 38 | AEO-07 | How many tons of gravel for a 100 ft driveway? | informational | P1 |
| 39 | AEO-08 | #57 stone vs #8 stone, what's the difference? | informational | P1 |
| 40 | AEO-09 | How much does a ton of gravel cover? | informational | P1 |
| 41 | AEO-10 | Gravel driveway drainage, how do I fix pooling water? | informational | P1 |
| 42 | AEO-11 | Is a gravel driveway cheaper than asphalt? | informational | P1 |
| 43 | AEO-12 | Pea gravel driveway pros and cons | informational | P1 |
| 44 | AEO-13 | How much crusher run do I need for a driveway? | commercial | P1 |
| 45 | AEO-14 | Should I DIY or hire delivery and spreading for a gravel driveway? | commercial | P1 |
| 46 | AEO-15 | Gravel driveway cost per square foot | informational | P1 |
| 47 | NAT-01 | Best bulk gravel delivery service near me | commercial | P2 |
| 48 | NAT-02 | Gravel delivery online ordering with instant price | commercial | P2 |
| 49 | NAT-03 | Cheapest way to get a gravel driveway | commercial | P1 |
| 50 | NAT-04 | Gravel driveway cost calculator | commercial | P1 |

---

## 2. Approximate baseline — web-search proxy, run 2026-09-28

**Method:** all 50 prompts from §1 were run once each via the WebSearch tool (Google-backed classic web search) on 2026-09-28. Full per-prompt results (top domains, whether mygravelguy.com appeared, position, competitors present, notes) are in `docs/metro/research/data/ai-visibility/baseline-2026-09-28.csv` — every row has `engine = web-search-proxy`. This section is the narrative summary of that CSV. Additional checks: `site:mygravelguy.com` (twice, different qualifiers), one Bing fetch attempt, one Perplexity fetch attempt — see §2.4–2.5.

### 2.1 Headline result: mygravelguy.com does not appear for any of the 45 non-brand prompts

Across every local-DFW (7), local-LI (10), national-informational (15), and national-commercial (13) prompt — 45 of the 50 total — **mygravelguy.com did not appear anywhere in the WebSearch results, in any position.** This directly reconfirms `aeo-plan.md` §2's zero-of-18/20 finding from the prior research pass, now against a wider, more structured 45-prompt set that explicitly includes both DFW and Long Island local intent plus the P8 prompt's own verbatim wording. This is a **proxy** result — it says nothing directly about Google AI Overviews, AI Mode, Gemini, ChatGPT, Perplexity, or Copilot — but given that AI Overview/AI Mode eligibility requires normal Search snippet-eligibility first (`aeo-plan.md` §1.1), a page that doesn't rank in classic search for a question has no plausible path to being cited in that question's AI answer either. Zero classic-search presence on 45 of 50 prompts is consistent with (though does not prove) zero AI-answer presence on the same 45.

### 2.2 Brand queries: present but colliding, and one confirmed near-miss

The 5 brand prompts are the only place mygravelguy.com shows up at all:

| prompt_id | Result |
|---|---|
| BRAND-01 "MyGravelGuy" | **Present, #1 non-Wikipedia result.** Clean win on the bare brand name. |
| BRAND-02 "My Gravel Guy reviews" | **Present, but at position 8 of 9**, behind four *unrelated* same-named businesses (a Battle Ground WA "Gravel Guy," a Dry Ridge KY "Gravel Guy," a Canton OH "The Gravel Guy," a Blairsville GA "The Gravel Guy"). The synthesized answer paraphrased generic positive MGG-site copy without linking to any actual third-party review platform for mygravelguy.com — same unverifiable-attribution pattern `aeo-plan.md` §2.1 already flagged. |
| BRAND-03 "mygravelguy.com" | **Present, #1.** Exact-domain query resolves cleanly, though mygravelmonkey.com still shows 3 separate location-page results on the same page. |
| BRAND-04 / P8 Q10 "What is MyGravelGuy and is it legit?" | **Present at position 3, but with a confirmed brand-collision near-miss.** The synthesized answer's *legitimacy verdict* was built by citing **mygravelmonkey.com's** review count (141 reviews, 4.94★) and **mygravelmonkey.com's** Scam Detector trust score (17.5, flagged low) — then applied that evidence, with a hedge, to "MyGravelGuy." This is the clearest **observed** (not hypothetical) instance of the brand-collision risk `aeo-plan.md` §2.3 warned about, caught in this exact panel. |
| BRAND-05 "Is mygravelguy.com legitimate or a scam?" | **Absent entirely.** Every result returned was for mygravelmonkey.com; the search tool's own synthesis said it "didn't return specific results about mygravelguy.com directly." Worst-case brand-collision outcome in the whole 50-prompt panel — a customer asking this exact question today would be shown only Gravel Monkey's trust signals. |

**Read:** brand-name collision with `mygravelmonkey.com` (and to a lesser extent `thegravelguy.com`/`mygravelbuddy.com`) is not a theoretical risk — it actively degrades or replaces MGG's own brand-query results in 2 of 5 brand prompts tested (BRAND-04, BRAND-05), and dilutes a third (BRAND-02). This is the single most actionable, evidence-backed finding in this baseline and should raise the priority of `aeo-plan.md` §3.7.2's `sameAs`/entity-disambiguation work.

### 2.3 Who dominates the 45 non-brand prompts

Manual tally from the CSV's `top_domains` column (approximate — counted by scanning this session's WebSearch result lists, not a systematic crawl; treat as directional):

| Domain | Prompts where it appeared (of 45 non-brand) | Pattern |
|---|---|---|
| **hellogravel.com** | ~25 of 45 (56%) | The single most dominant domain in this panel by a wide margin — appears across national informational, DFW, and LI queries alike, often with 2–5 separate ranking URLs on one query (guides, calculators, city pages). Matches and exceeds `aeo-plan.md`'s prior 11/20 finding. |
| Generic national cost-guide aggregators (homeadvisor.com, angi.com, homeguide.com, lawnstarter.com, houzz.com, homeyou.com) | ~28 of 45 (62%) combined | Dominate nearly every cost/comparison/maintenance informational query nationwide; none offer delivered pricing or location specificity. |
| **mygravelmonkey.com** | 7 of 45 (16%) | DFW and LI local queries specifically (Dallas, McKinney, best-gravel-TX, LI City, Island Park, LI best-gravel) — confirms it is executing the same metro-page pivot MGG is planning, already live in both of MGG's target metros. |
| **gravelshop.com** | 6 of 45 (13%) | Strong on Nassau County/LI queries (4 ranking URLs on one query alone) and national commercial-intent queries. |
| **mygravelbuddy.com** | 3 of 45 (7%) | Dallas driveway-gravel page and 2 national commercial queries. |
| Regional/local aggregate-yard blogs (McCraw, JBS Express, That Skid Steer Guy, Aggregate Markets, Komplet America, Smoky Mountain Sand & Gravel, Twisted Nail, Soil Depot, Aggregates Now, Select Sand & Gravel) | ~12 of 45 (27%) combined | Own the TX-specific and comparison-guide queries (flex base, crusher run vs #57, clay soil) — this is the exact content format `aeo-plan.md` §3.2's spoke plan targets. |
| LI paving/driveway contractors (Brothers Paving & Masonry, Stone Escapes LI, Palermo Paving, 9 Brothers, GAPPSI) | ~6 of 45 (13%) | Own LI-specific driveway cost/installation/comparison queries — confirms gravel is a smaller share of LI driveway material choice than pavers/asphalt/concrete, per `aeo-plan.md` §2.2. |
| **mulchmound.com** | 1 of 45 (2%, only one mulch-specific query run) | SKU-per-city-page pattern (4 separate ranking URLs for one Fort Worth mulch query) — likely under-counted here since only one mulch-specific DFW prompt was in this 50-prompt set; `competitive-analysis.md` documents a much broader Mulch Mound footprint. |
| **easternlm.com** (MGG's own sister yard) | 1 of 45 (2%) | Ranked organically for "topsoil delivery Suffolk County NY" — the one query in this panel where an MGG-family domain appeared in classic search, just not mygravelguy.com itself. Possible internal-linking opportunity once MGG's LI content ships. |

### 2.4 site:mygravelguy.com and Bing check

`site:mygravelguy.com` via WebSearch confirms indexing of `/shop`, `/products/road-base`, `/products/driveway-gravel-34in`, `/products/driveway-gravel`, `/products/walkway-gravel` — consistent with `aeo-plan.md` §2.1's finding that MGG is indexed only on transactional/product pages, with no informational content. No count of total indexed pages could be obtained this way (WebSearch doesn't report a total).

A direct **Bing** `site:mygravelguy.com` query was attempted via WebFetch (`bing.com/search?q=site:mygravelguy.com`). **This failed in an interesting way**: the page returned rendered as a "Total Results: Approximately 2,050" with a results list entirely about number-theory trivia sites (numbermatics.com, metanumbers.com, etc.) — completely unrelated to mygravelguy.com. This is almost certainly a WebFetch rendering/JS artifact (Bing's results page requires JS execution that WebFetch's HTML→markdown conversion doesn't handle, producing garbage rather than real data), **not a real Bing index count**. Treat this as a failed check, not evidence about Bing's index — flagged per the task's own caveat that `site:` counts are rough, and in this case unusable. **Owner action needed:** a real Bing Webmaster Tools check (logged in) is the only reliable way to get Bing indexation/impression data — see §5.

### 2.5 Perplexity check (attempted once, as instructed)

A single WebFetch to `https://www.perplexity.ai/search?q=gravel+driveway+cost+Dallas+Texas` returned **HTTP 403 Forbidden** — confirmed blocked, as anticipated in the task brief. Not retried. This confirms Perplexity's actual answer content is not observable via this agent's tools; the manual protocol in §5 is the only way to get real Perplexity data.

---

## 3. Summary scorecard

| Metric | Value |
|---|---|
| **Share-of-voice proxy (mygravelguy.com present in top classic-search results)** | **4 of 50 prompts (8%)** — all 4 are brand-name queries. |
| **Share-of-voice proxy, non-brand prompts only (the 45 that matter for the AEO objective)** | **0 of 45 (0%).** No informational, commercial, local-DFW, or local-LI prompt returned mygravelguy.com anywhere in results. |
| **Share-of-voice proxy, brand prompts only** | **4 of 5 (80%)**, but 2 of those 4 show active brand-collision degradation (BRAND-02 buried at position 8; BRAND-04's legitimacy evidence was borrowed from a competitor). Only BRAND-01 and BRAND-03 are clean wins. |
| **Brand-collision incidents observed this pass** | 1 confirmed near-miss (BRAND-04: competitor's review/trust data applied to MGG's legitimacy question) + 1 total loss (BRAND-05: zero mygravelguy.com results, 100% mygravelmonkey.com) + 1 dilution (BRAND-02: buried behind 4 unrelated "gravel guy" businesses). |
| **Top competing domain** | hellogravel.com — present in 56% of non-brand prompts, often with multiple ranking URLs per prompt. |
| **Competitor presence, count of prompts each tracked brand appeared in (of 45 non-brand)** | hellogravel.com 25; mygravelmonkey.com 7; gravelshop.com 6; mygravelbuddy.com 3; mulchmound.com 1 (likely undercounted — only 1 mulch-specific prompt in this set). EarthMove (earthmove.io) did not appear in any of this session's 50 WebSearch queries, despite being confirmed real and DFW-live per `external-llm-competitor-synthesis.md` — plausibly because none of the 50 prompts here happened to match the exact phrasing that surfaced it in the prior ChatGPT-run research, not evidence it's absent from DFW search generally. |
| **"Sister brand" signal** | easternlm.com (MGG's own Long Island yard) ranked organically for 1 prompt (Suffolk County topsoil) — mygravelguy.com itself did not. |
| **Rendering-gap consistency check** | Zero non-brand presence is consistent with `aeo-plan.md` §2.4's finding that MGG serves near-empty SPA HTML to non-JS fetchers and has no informational content pages at all yet — this baseline does not distinguish "no content exists" from "content exists but isn't renderable," because for 45 of 50 prompts, informational MGG pages (gravel driveway cost, best gravel, etc.) currently don't exist in the repo/site at all. Once the Hub + spokes ship (`aeo-plan.md` §3.2), a repeat of this exact panel will show whether the rendering fix or the content-existence fix (or both) moved the needle. |

**Bottom line:** this baseline shows 0% classic-search visibility on every question the AEO plan is actually trying to win, and confirms — with a real, observed example, not a hypothetical — that the brand-collision risk with mygravelmonkey.com actively corrupts MGG's own brand-legitimacy search results today. Both findings support the AEO plan's existing priorities without changing them.

---

## 4. Tooling options for automating this later

**[REC], verify pricing before committing spend — figures below are indicative from public sources, not live quotes:**

- **Profound, Otterly.AI, Peec AI** — purpose-built AI-visibility/AEO trackers that run fixed prompt panels against ChatGPT, Gemini, Perplexity, and (with varying coverage) Google AI Overviews on a schedule, reporting citation share, position, and competitor mentions. This is the most direct automation of exactly what §5's manual checklist does by hand. Pricing in this category has historically started in the low hundreds of dollars/month for small prompt volumes — **[NEEDS_REAL_NUMBER: get current quotes]**.
- **Semrush AI toolkit (Enterprise AIO / AI Visibility)** and **Ahrefs Brand Radar** — bolt-on modules to existing SEO suites; worth checking if MGG (or the owner) already has a Semrush/Ahrefs seat, since incremental cost may be lower than a standalone tool.
- **Google Search Console** — as of this research pass (2026-09-28), **GSC does not report AI Overview or AI Mode impressions/clicks as a separate, labeled surface** the way it labels "Web," "Image," "Video," etc. — this matches `aeo-plan.md` §3.8's existing finding. GSC's total impressions/clicks/position on the new metro and hub URLs remain the best available *leading indicator* (since AI Overview eligibility requires normal snippet eligibility first per §1.1), but GSC cannot directly confirm an AI Overview citation happened. **[REC] Re-verify this specific claim close to the actual GSC setup date** — Google has iterated AI-feature reporting in Search Console before and could add an AI-Overviews-specific row; this agent did not find one as of this pass but did not have live GSC access to double-check against the actual property.
- **Bing Webmaster Tools** — reports classic Bing search performance (impressions/clicks/position) and IndexNow submission status; no AI-Mode/Copilot-specific citation reporting was found as a distinct surface in this pass. Given ChatGPT search plausibly rides on Bing's index (`aeo-plan.md` §1.3), Bing Webmaster Tools data is still useful as an indirect signal, not a direct one.
- **GA4 custom channel grouping** for AI-referral traffic (chat.openai.com, chatgpt.com, perplexity.ai, gemini.google.com referrers) — free, but `aeo-plan.md` §3.8 already flags that AI Overview click-through referrer behavior is not cleanly distinguishable from regular organic in GA4. Useful for ChatGPT/Perplexity/Gemini-app referral traffic specifically, not for AI Overview/AI Mode citation counting.
- **[REC], unchanged from `aeo-plan.md` §3.8:** run the manual DIY panel (§5 below) for 4–6 weeks first to validate the prompt set and get real baseline variance data, then decide whether a paid tool's cost is justified by the manual time saved. At ~30–75 minutes/week per engine (see §5's time estimate), a 6-engine, 50-prompt weekly panel run by hand is realistically 3–5 hours/week if done thoroughly, which is the actual cost this decision is weighing against a subscription.

---

## 5. Owner manual checklist for the true AI-answer baseline

**Why this has to be manual:** this agent's tools (WebSearch/WebFetch) cannot log into Google, ChatGPT, Gemini, Perplexity, or Copilot, cannot set a location the way a logged-in session can, and Perplexity's own site returned a 403 to a direct fetch (§2.5). Every number in §2–3 above is a classic-search proxy. The steps below are what actually produces the "was MGG cited in a real AI answer" data this project needs.

### 5.1 Setup, once per engine before the first real run

- **Browser profile:** use a fresh/incognito or logged-out browser window for every engine where possible, to reduce personalization bias. For engines that require login to use at all (ChatGPT, ChatGPT search mode, Perplexity Pro), use a plain, non-power-user account with no prior gravel/landscaping search history if one is available; otherwise note "logged in, history not cleared" in the notes column so future comparisons account for it.
- **Location handling (the hardest part to standardize):**
  - **Google AI Overviews / AI Mode:** Google's actual location targeting for AI features is not a documented, reliable manual override — the commonly-suggested `&near=` and `uule` URL parameters are known to be unreliable/deprecated for triggering true AI Overview local blending, and there's no confirmed manual mechanism as of this pass. **[REC]** the most reliable manual approximation is: (a) a real device physically in DFW or Long Island, or (b) a consumer VPN/proxy exit node in Dallas or a Long Island NY city, accepting this is imperfect and should be logged as such ("VPN exit: Dallas, TX" or "no location control used, ran from [home location]") rather than assumed to be accurate.
  - **Gemini app:** similarly no confirmed manual location override; same VPN-or-physical-device approach, same honest logging requirement.
  - **ChatGPT:** turn on "Search" mode explicitly for each query (don't rely on auto-routing) since that's the mode P8's own instructions specify and the mode most likely to cite live sources.
  - **Perplexity:** use the default search mode (citations are Perplexity's core feature); Perplexity Pro's "Focus" settings should stay on default/web, not narrowed to academic/reddit/etc.
  - **Copilot:** use Copilot's own web-search-grounded mode (not the plain chat mode) via Bing/Edge.
- **Fresh chat per prompt:** start a new chat/conversation for every single prompt, every engine, every run — do not chain prompts in one conversation, since prior context in the same chat will bias later answers.

### 5.2 Per-prompt, per-engine recording (what to write down)

For every one of the 50 prompts × every engine actually run, record into `tracking-template.csv` (same columns as the baseline CSV, plus 4 answer-specific columns):

- `answer_cited` (Y/N) — was mygravelguy.com shown as a clickable source/citation link in the AI answer itself (not just a "related links" sidebar)?
- `answer_mentioned` (Y/N) — was "MyGravelGuy" or "mygravelguy.com" named in the answer's prose, even without a link?
- `answer_linked` (Y/N) — same as cited, but specifically noting whether the link was clickable/functional in that UI.
- `answer_snippet` — paste the exact sentence(s) where MGG was cited/mentioned, or the exact sentence(s) naming a competitor instead, verbatim. This is the evidence trail — don't paraphrase.
- Also still fill `mgg_present`, `mgg_position` (position among all citations/sources shown, not classic search rank), `mgg_url` (which MGG page, if any, was cited), `top_domains` (every domain shown as a citation in the AI answer, in order), `competitors_present` (which of Hello Gravel / EarthMove / Gravel Monkey / My Gravel Buddy / Mulch Mound / Gravelshop / others were cited or named), and `notes` (anything unusual — refusal to answer, an obviously wrong/hallucinated brand, a location mismatch, etc.).

### 5.3 Handling personalization and variance

- **Run each prompt twice per engine per week**, ideally at different times of day (e.g., once morning, once evening) or on two different days within the same week, and record both as separate rows. If the two runs disagree (MGG cited once, not the other), that disagreement is itself the data point — do not average or pick "the better one."
- Note browser/account state honestly every time (logged in vs. out, VPN location used or not, whether history was cleared) — this is what makes later comparison-over-time valid or invalid.
- Expect variance: AI answers to the same prompt can differ run-to-run even with identical settings because these are non-deterministic, reranked systems (per `aeo-plan.md` §0's honesty note). One run showing MGG and the next not showing it is not evidence of a bug — it's the actual behavior being measured.

### 5.4 Time estimate

- **Per prompt, per engine:** roughly 1–2 minutes (open fresh chat, type/paste prompt, wait for answer, record 8–10 CSV fields).
- **Full 50-prompt × 6-engine panel, run twice each (per §5.3):** 50 × 6 × 2 × ~1.5 min ≈ **15 hours** if every prompt is run on every engine every week. This is not realistic as a standing weekly commitment.
- **[REC] Realistic weekly cadence, matching `aeo-plan.md` §3.8's existing recommendation:** run the full 50-prompt set on **Google AI Overviews/AI Mode and Gemini** (the stated #1 priority, P1 in §1's table) weekly — 50 × 2 engines × 2 runs × 1.5 min ≈ **5 hours/week**. Run **ChatGPT** (P2) weekly on a smaller 20-prompt subset (the P8 verbatim 10 + the 10 highest-commercial-intent prompts) — ≈1 hour/week. Run **Perplexity and Copilot** (P3) **monthly**, full 50-prompt set, single pass (no double-run) — ≈2.5 hours once a month. **Total ongoing commitment: roughly 6 hours/week + 2.5 hours once a month**, front-loaded toward Google/Gemini per the project's own stated priority order.
- **First baseline run (this checklist, done properly, all 6 engines, all 50 prompts, double-run):** budget a full ~15 hours as a one-time cost to establish the real starting point this proxy baseline could not provide, then drop to the lighter cadence above.

### 5.5 Cadence

- **Weekly:** Google AI Overviews, Google AI Mode, Gemini (full 50-prompt set) — matches the project's Google-first priority (`aeo-plan.md` §1, §4).
- **Weekly, reduced set:** ChatGPT (20-prompt subset).
- **Monthly:** Perplexity, Copilot (full 50-prompt set, single pass) — matches P8's own "repeat monthly" instruction for these engines.
- **Same day each week/month**, logged in `tracking-template.csv`, so week-over-week and month-over-month comparisons aren't confounded by day-of-week variance in how these systems behave.
- Roll up monthly against the CSV's own `mgg_present`/`answer_cited` counts to produce the same share-of-voice metric this document's §3 scorecard uses, now on real AI-answer data instead of the classic-search proxy.

---

## 6. Baseline KPIs and targets for 30/60/90 days after the prerender + hub deploy

**Starting point (this baseline, 2026-09-28):** 0% classic-search-proxy presence on all 45 non-brand prompts; 0 real AI-answer citations observed (none collected yet — §5 has not been run). Any positive movement from zero is directionally meaningful, but per `aeo-plan.md` §0's honesty note, no specific citation is guaranteed and these targets are aspirational planning inputs, not commitments.

| Milestone | Classic-search proxy target (WebSearch presence, same 45 non-brand prompts) | Real AI-answer target (§5 panel, once running) | Notes |
|---|---|---|---|
| **30 days post-deploy** (hub + Wave-1 spokes live per `aeo-plan.md` §4 Weeks 3–4, prerendering shipped) | MGG appears in top-10 classic results for **5–10 of the 45** non-brand prompts (the Wave-1 rows: cost overview, best gravel, calculator, depth guide, crusher-run-vs-57, maintenance, tons-for-100ft, ton-coverage, drainage, gravel-vs-asphalt — the 10 rows `aeo-plan.md` §4 Weeks 3–4 targets first) | First §5 panel run completed (baseline established); **0–2 real citations** would not be surprising this early — new pages take time to be crawled, indexed, and pulled into fan-out retrieval even after they exist | Success at 30 days is mostly about classic-search presence existing at all, since AI Overview eligibility requires that first (§1.1) |
| **60 days post-deploy** (DFW-specific spokes live per `aeo-plan.md` §4 Weeks 5–6, if `priceBookConfirmed`) | MGG appears for **12–18 of the 45**, including some local-DFW rows (flex base vs limestone, gravel vs concrete Dallas, best gravel TX, served-town lookup) | **1–5 real citations** across the P1 (Google/Gemini) engines specifically, concentrated on the highest-effort content (Cost Index, DFW-specific answer blocks) | Gate DFW-specific rows on `priceBookConfirmed` per `aeo-plan.md` §3.1's honesty rule — don't ship fake numbers to hit this date |
| **90 days post-deploy** (E-E-A-T + off-site work live per `aeo-plan.md` §4 Weeks 7–8, full Wave-1 done) | MGG appears for **20–30 of the 45** (roughly half), share-of-voice proxy rising from 0% to ~45–65% on the tracked non-brand set | **3–10 real citations**, first non-zero share-of-voice on the real §5 panel across at least 2 engines (expect Google family first, ChatGPT/Perplexity lagging per `aeo-plan.md` §1.3–1.4's slower/indirect eligibility paths) | This is the point where a real month-over-month trend line exists and a go/no-go call on a paid tracking tool (§4) can be made with actual data instead of the manual-panel estimate |
| **Brand-collision remediation (all milestones)** | BRAND-05 ("is mygravelguy.com legit/scam") should show mygravelguy.com present at all (currently 0%); BRAND-04's answer should cite MGG's own trust signals, not a competitor's | `sameAs`/entity schema (`aeo-plan.md` §3.7.2) live by 60 days | This baseline's clearest, cheapest-to-fix finding — track it independently of the broader content rollout since it doesn't depend on the Hub/spokes shipping |

**[REC]** Re-run this exact 50-prompt classic-search-proxy panel (§2's method) every 2 weeks as a free, fast leading indicator between the heavier §5 manual AI-answer panel's weekly/monthly runs — a rising classic-search share on these 45 prompts is the earliest observable signal that the prerender + content work is having any effect at all, well before AI-answer citations would be expected to follow.

---

## Change log
- 2026-09-28: D-AI-VISIBILITY agent. Read `aeo-plan.md`, `external-llm-prompts.md` (P8), `external-llm-synthesis-2.md` (confirmed P8 never run), `competitive-analysis.md` (competitor list). Built canonical 50-prompt set (5 brand, 7 local-DFW + 10 local-LI, 15 national-informational, 13 national-commercial, including P8's 10 verbatim questions). Ran all 50 via WebSearch as a classic-search proxy (2026-09-28); wrote `baseline-2026-09-28.csv` (50 data rows) and `tracking-template.csv` (empty, engine-ready). Ran `site:mygravelguy.com` (2 variants), 1 Bing WebFetch attempt (failed/garbage — JS-rendering artifact, not real data), 1 Perplexity WebFetch attempt (403, confirmed blocked, not retried per instructions). Findings: 0% non-brand presence (45/45 absent); brand queries present but actively degraded by mygravelmonkey.com collision in 2 of 5 cases, including one confirmed instance of a competitor's trust/review data being used to answer a legitimacy question about MGG. hellogravel.com dominant (~56% of non-brand prompts). Wrote owner manual checklist (§5, ~6hr/week + 2.5hr/month realistic cadence), tooling options (§4), and 30/60/90-day KPI targets (§6) gated on the existing prerender + hub rollout plan in `aeo-plan.md` §4.
