# DFW Partner Outreach Kit

Status: docs/research kit, 2026-09-28. Built for the owner to run DFW partner-yard
outreach by phone (this kit does not itself contact anyone). Companion research:
`docs/metro/research/dfw-pricing-v2.md` (pricing), `docs/metro/research/
external-llm-competitor-synthesis.md` (competitor/partner shortlist),
`docs/metro/METRO-STRATEGY.md` (fulfillment model), `src/metro/config/dallasFortWorth.ts`
+ `src/metro/config/data/dfwCatalog.ts` (the live 22-SKU catalog and zones this kit is
built around).

## What's in this kit

| File | What it's for |
|---|---|
| `partner-due-diligence.md` | Research on Silver Creek Materials, Lowery Sand & Gravel, and Soil Building Systems (location, hours, ownership, materials, delivery, reviews, certifications) plus the SBS Reddit topsoil-complaint investigation and a recommendation. Read this first. |
| `call-script.md` | Cold-call script for the owner to call a yard owner/manager: opener, ELM credibility, the ask, 12 qualification questions, 9 objection responses, voicemail/text/email follow-ups, and a call log. |
| `partner-agreement-one-page.md` | Plain-English fulfillment partner agreement TEMPLATE (not legal advice — have counsel review) to send once a yard says yes in principle. |
| `price-sheet-template.md` / `.csv` | The sheet a partner fills in with their pricing for all 22 MGG DFW SKUs, by zone, with truck/minimum/lead-time/seasonality columns. Send the `.csv` to the partner; the `.md` explains each column. |
| `economics.md` | Per-order unit economics for 3 representative SKUs at the partner's likely (yard-median) price vs. MGG's delivered price — gross margin $ and %, plus what happens if a partner quotes 10% above median. Read before negotiating price. |

## Recommended order of outreach

1. **Silver Creek Materials** (Fort Worth, 76108) — call first. Most cross-confirmed
   candidate across prior research (4/4 external LLM engines independently flagged it),
   longest published hours/fleet detail, strongest visible review base (4.3★/~300), no
   red flags found in due diligence. See `partner-due-diligence.md` §2.
2. **Lowery Sand & Gravel** (Arlington, 76011) — call second. Already delivery-only (no
   pickup) — structurally the closest fit to what MGG needs, existing net-terms credit
   practice for approved accounts (useful in payment-terms negotiation), 47 years in
   business. See `partner-due-diligence.md` §3.
3. **Soil Building Systems** (Dallas, 75229) — call third, **with the quality-control
   conditions in `partner-due-diligence.md` §4 attached specifically to their soil/
   compost/garden-mix SKUs**, not their gravel/aggregate lines. SBS is the most
   established of the three (est. 1972, largest composting facility in North Texas,
   real online order-and-delivery page) but carries an unresolved, unverifiable-this-pass
   Reddit complaint about their flagship "Ready to Plant Soil" blend and no confirmed
   third-party compost-testing certification — see the due-diligence doc for exactly
   what to ask before routing live soil/compost orders to them.
4. **Backups** (Select Sand & Gravel, Texas Sand & Gravel, Texas Hardscape Materials,
   Earth Haulers, Big Tex Stone, JBS Express McKinney) — only if one of the top 3 falls
   through, or to fill `dfw-north`/`dfw-outer` coverage that none of the top 3 reach
   (all three sit in `dfw-core`; JBS Express McKinney is the best-identified `dfw-north`
   candidate so far — see `partner-due-diligence.md` §5–6).

## Per-yard pitch angle (one paragraph each)

**Silver Creek Materials:** Lead with scale and fit — they're vertically integrated
(mining, composting, recycling) on a large Fort Worth facility, already the most
cross-confirmed partner candidate in MGG's own research, and Reddit-sourced sentiment
(unverified this pass, see due-diligence doc) specifically praises their willingness to
load small/sub-minimum orders — exactly the order size MGG's DFW customers are likely to
place. Pitch: "you already do the small, flexible loads other yards turn away — we just
bring you more of exactly that."

**Lowery Sand & Gravel:** Lead with structural fit — they're delivery-only, no pickup,
which means their entire operation is already built around exactly what MGG needs (a
dispatcher that loads a truck and delivers on request), not a walk-in counter business
being asked to change how it works. Pitch: "you already run your business as a delivery
dispatcher — we're just one more phone line ringing with orders, and we handle
everything before the truck leaves your yard."

**Soil Building Systems:** Lead with their manufacturing credibility and reach — the
oldest of the three (1972), the largest composting facility in North Texas, a real
online order-and-delivery system already live, and the widest published delivery radius
of any yard on the shortlist (Shreveport to Waco). Pair the pitch with a direct,
non-accusatory QC question early in the relationship (see `call-script.md`'s
qualification questions #1 and the due-diligence doc's SBS conditions) rather than
raising the Reddit complaint as an accusation — the goal is a QC conversation that
protects both sides, not a gotcha.

## Notes on scope

- This kit is docs/research only. No emails, calls, or form submissions have been sent
  by this pass — every "call" reference above is a script for the owner to use, not a
  record of contact made.
- No MGG Google Business Profile will exist in DFW (owner decision). A partner yard's
  own GBP may mention MGG ordering only with the partner's consent — this is written
  into `partner-agreement-one-page.md`'s Branding & co-marketing section and should be
  raised on the call, not assumed.
- Every price in `economics.md` and `price-sheet-template.md`'s EXAMPLE row is derived
  from `docs/metro/research/dfw-pricing-v2.md` / `docs/metro/research/data/dfw/
  slug-stats.json` and the live `dallasFortWorth.ts` pricing formula — none of it is a
  signed partner price, and `dallasFortWorth.ts`'s `priceBookConfirmed: false` should
  stay `false` until real price sheets come back from signed partners.

## Change log
- 2026-09-28: Created. Kit overview, recommended 4-step outreach order (Silver Creek →
  Lowery → SBS-with-conditions → backups), one-paragraph pitch angle per yard, and scope
  notes (docs/research only, no MGG DFW GBP, all pricing is placeholder pending signed
  sheets).
