# METRO-UI-QA — mobile/desktop QA pass, prefill support, tests

Branch `feature/metro-ui`, nothing committed. Continuation of an earlier interrupted/rate-limited METRO-UI-QA run. Owns `src/metro/components/**`, `src/metro/hooks/**`, `src/pages/metro/**`, `docs/metro/screenshots/**`, this doc.

## What this pass found already done

The earlier (interrupted) session had already:
- Fixed the hardcoded `"75201"` ZIP placeholder — `ZipStep.tsx` now derives it per metro from `order.metro.zones[0]?.zips[0]` (confirmed live: DFW shows `75001`/`75201`-range, Long Island shows `11934`).
- Fixed a dark-mode bug where OS `prefers-color-scheme: dark` (via `next-themes`'s `.dark` class on `<html>`) made shadcn form controls render dark-on-dark inside the always-light metro UI — `MetroLayout.tsx` re-declares the light HSL custom properties inline.
- Fixed a mobile horizontal-overflow bug in `OrderFlow`'s two-column grid (`grid-cols-1` base + `min-w-0`).
- Written `OrderFlow.test.tsx` (5 tests) but never run it — see bugs found below.

## Checklist walked (390×844 mobile, 1440×900 desktop)

| Check | DFW (ZIP 75201 → Gravel → Pea Gravel → 10 → Saturday → fake details) | Long Island (Southampton town page → Mulch → Black Mulch → 5 yd → weekday) |
|---|---|---|
| No horizontal overflow (`scrollWidth ≤ innerWidth`) | Verified at every step, mobile + desktop | Verified (home + Southampton town + quantity step) |
| Sticky price bar doesn't cover inputs | Verified — `OrderFlow`'s `pb-24 md:pb-0` clearance keeps the submit button fully visible above the mobile sticky bar | N/A (screenshots stop at quantity step per task scope) |
| Tap targets ≥44px | 7 violations found and fixed (below) | Same shared components, same fix applies |
| Keyboard/focus on radio tiles | `CategoryStep`/`VariantStep`/`DayStep` all use native `<button role="radio">` (focusable, Enter/Space-activatable by default) with `focus-visible:outline` styling — verified by code read, not changed this pass | Same components |
| Error: bad ZIP → waitlist | Verified live (ZIP 90210 → "We're not there yet" + Notify me / Try another ZIP, both 44px) | Not re-tested (same component) |
| Error: below zone minimum | Verified live + `vitest` (`quoteResult.belowMinimum` alert, Continue disabled) | Not re-tested (same component) |
| Error: missing phone/email | **Not clicked live** — see Safety note below. Verified statically (`street`/`name`/`mobile`/`email` inputs all have `required`) and via the existing "blocks submit... when SMS/email consent unchecked" test | — |
| Dark OS preference keeps light theme | Verified live by forcing `document.documentElement.classList.add('dark')` — page stayed light | — |
| ZIP prefill (town pages) | `MetroTownPage` passes `initialZip={town.zip}`; Southampton lands straight on the category step | Verified live |
| `?qty=&unit=&category=&variant=&zip=` prefill | Implemented this pass — see below | Implemented this pass |

### Safety note
Per the task's CRITICAL instruction (dev server uses **production Supabase**), the "Request my delivery" button was never clicked in the live browser, and no order/waitlist data was submitted. All submit-path behavior (missing consent, missing fields, message contents) is covered by `vitest` with `metroQuoteService` fully mocked (`vi.mock`, network-spy assertions confirm `fetch` is never called).

### Environmental note
A separate, concurrently-running pricing agent was actively editing `src/metro/config/data/dfwCatalog.ts` during this session (per this task's own briefing: "pricing agent updating DFW prices"). That triggered several full-page Vite HMR reloads mid-walkthrough, resetting in-progress form state and changing the dollar figures shown between screenshots (e.g. Pea Gravel priced at $105.50/ton in one capture, $63.50–$90/ton in later ones as the catalog was edited live). This is expected given the shared dev environment, not a UI bug — screenshots' prices reflect whatever the catalog held at capture time.

## Bugs found and fixed

1. **Quantity +/− stale-closure bug** (`QuantityStep.tsx`) — the decrease/increase handlers read the `quantity` closure value directly (`setQuantity(Math.max(0.5, Math.round((quantity - 0.5) * 2) / 2))`) instead of a functional `setState` updater. Invisible to `fireEvent`-driven tests (each call flushes a render first), but reproducible live: two `.click()` calls issued in the same synchronous task (React 18 automatic batching) both computed from the same starting value instead of accumulating (10 → 9.5 instead of 10 → 9). Fixed both handlers to use `setQuantity(prev => ...)`. Added a regression test (`act()`-wrapped double-click) that fails on the old code and passes on the fix.

2. **No `?qty=&unit=&category=&variant=&zip=` prefill support** — the guides calculator's "Order in DFW/Long Island" CTA has linked to `/{metro}/{category}-delivery?qty=&unit=` since it shipped, but `OrderFlow`/`useMetroOrder` only ever supported prop-based `initialCategory`/`initialZip`/`initialVariantSlug`, silently dropping the query string. Implemented:
   - `useMetroOrder` gained `initialQuantity`/`initialQuantityUnit` options, applied once a category is resolvable (converting units via `tonsPerYard` if the query's unit differs from the category's native sell unit, rounded to the nearest half-unit like the rest of the quantity UI).
   - `OrderFlow` gained a `usePrefillOptions` hook (`useSearchParams`) that reads `zip`/`category`/`variant`/`qty`/`unit`, validates each against the metro's own config (unknown category/variant slugs are silently ignored), and merges them with the page-supplied props — **query params win when both are present**.
   - Fixed a follow-on bug this surfaced: `selectVariant`'s "first pick defaults to at least 10 units" floor (`Math.max(prev, zone?.minUnits ?? 10, 10)`) unconditionally overwrote an already-applied prefill quantity when a category (but not variant) was preselected and the visitor then picked a variant by hand. `selectVariant` now checks the same "already applied" ref before falling back to the floor default.
   - 3 new tests cover: same-unit prefill via query string (zip+category+variant+qty+unit all in the URL), cross-unit conversion (yd→ton), and the prop-plus-query-string mix that mirrors `MetroCategoryPage` + the calculator CTA.

3. **Tap targets under 44px** — the shared shadcn `Button` component's `sm` (36px) and `icon`/`default` (40px) size variants are used throughout the order flow. Since `src/components/ui/button.tsx` is shared site-wide (out of this agent's ownership), fixed via `min-h-[44px]`/`min-w-[44px]` overrides on each metro-owned call site instead:
   - `OrderFlow.tsx` — "Go back" icon button (40×40 → 44×44)
   - `QuantityStep.tsx` — 5 quick-pick buttons (36px → 44px), decrease/increase icon buttons (40×40 → 44×44)
   - `ZipStep.tsx` — "Check delivery", "Notify me", "Try another ZIP" (40px → 44px)
   - `Confirmation.tsx` — "Start another order" (40px → 44px)
   - `MetroHeader.tsx` — "Order" nav CTA (36px → 44px)

4. **Pre-existing, never-run test asserted on a field that doesn't exist** — `OrderFlow.test.tsx`'s submit test checked `submission.message` for variant/quantity/date substrings, but `useMetroOrder.submit()` passes the raw structured order (`variant`, `quantity`, `day`, …) to `submitMetroOrderRequest` — the message string is only built *inside* the real service function (`buildOrderSummary` in `metroQuoteService.ts`), which the test mocks away entirely. Fixed the assertions to check the structured fields (`submission.variant.name`, `submission.quantity`, `submission.day.isSaturday`) that are actually present, without touching `metroQuoteService.ts` (outside this agent's file ownership).

5. **Duplicate/stale screenshots** — `qa-dfw-day-mobile.png`/`qa-dfw-quantity-mobile-fixed.png` and `qa-dfw-darkmode-check.png`/`qa-dfw-quantity-calc-mobile.png` were byte-identical (confirmed via `md5sum`), and `qa-dfw-category-mobile.png` was byte-identical to `qa-dfw-home-mobile.png` (an early capture landed before the category-click had registered). Root cause: this session's screenshot tool intermittently returns a stale/cached frame (visible as `UnknownVizError` on the first attempt, then a same-content success on retry). Re-captured all three with verified-distinct `md5sum`s before saving.

## Screenshots (`docs/metro/screenshots/`)

All mobile shots are 390×844, desktop 1440×900. Byte-verified distinct (no two files share an md5).

- `qa-dfw-home-mobile.png` / `qa-dfw-home-desktop.png` — DFW home, ZIP step
- `qa-dfw-category-mobile.png` — category tiles (2×2 grid)
- `qa-dfw-variant-mobile.png` — variant list (single-column, full-width cards)
- `qa-dfw-quantity-mobile-fixed.png` / `qa-dfw-quantity-desktop.png` — quantity step, default 10 tons, truck plan
- `qa-dfw-quantity-calc-mobile.png` — coverage calculator expanded (50×12 ft, depth 3in) with "Use this amount"/"Continue" both visible, unobstructed by the sticky bar
- `qa-dfw-day-mobile.png` — delivery-day grid with Saturday/Rush fee tags
- `qa-dfw-details-filled-mobile.png` — Delivery details step with fake data filled in, consent unchecked, sticky total bar clear of the submit button
- `qa-dfw-outofarea-mobile.png` — waitlist state for ZIP 90210
- `qa-dfw-darkmode-check.png` — DFW home with `.dark` forced on `<html>`, still light
- `li-home.png` — Long Island home, ZIP placeholder `11934` (was hardcoded `75201`)
- `li-town-southampton.png` — Southampton town page, auto-checked ZIP lands on category step

## Verification

- `npx tsc --noEmit -p tsconfig.app.json` — zero errors in `src/metro/**` or `src/pages/metro/**` (pre-existing errors elsewhere, e.g. `OrderDetailModal.tsx`, are unrelated to this agent's files)
- `npx eslint src/metro/components src/metro/hooks src/pages/metro` — 0 errors, 1 pre-existing warning (`FaqSection.tsx` fast-refresh export-shape warning, not touched)
- `npx vitest run src/metro` — **53/53 passing** (was 0 run before this pass; `OrderFlow.test.tsx` alone: 9/9, up from 5 written-but-broken tests)

## Remaining / not done this pass

- Native text inputs (ZIP, street, name, mobile, email) render at 40px height (shadcn `Input` default), under the 44px tap-target guideline. Not fixed — `Input` is a shared primitive like `Button`, and unlike buttons a text field's "tap target" convention is less settled; flagged for a follow-up decision rather than changed unilaterally.
- The SMS-consent checkbox's visible glyph is 16×16, but sits inside a full-width clickable `<label>` (standard `htmlFor` pattern), so the effective tap target is large. Not changed — flagging only because the raw checkbox element itself is small.
- Did not build a full per-page screenshot set for `MetroCategoryPage`/`MetroTownPage` beyond the town page already required by the task; spot-checked `dallas-fort-worth/sand-delivery` for overflow/heading correctness only (no issues found).
- Did not simulate real `Tab` keypresses in the live browser (the browser tool has no dedicated key-press primitive here); keyboard operability was verified by code inspection (native `<button role="radio">`, no `tabIndex={-1}` traps, visible `focus-visible:outline`).
- Concurrent pricing-agent edits to `dfwCatalog.ts` mean the dollar amounts baked into these screenshots are a point-in-time snapshot, not final DFW pricing — expected, not a defect.
