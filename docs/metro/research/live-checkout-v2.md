# live-checkout-v2 — fixing the live `/checkout` -> `/payment-success` path (S1-LIVE-CHECKOUT-FIX)

**Status:** implemented, side-by-side, disabled by default (env vars unset). `verify-payment` and
`create-auth-hold` are byte-identical to `HEAD` (`git diff HEAD -- supabase/functions/verify-payment
supabase/functions/create-auth-hold` is empty).

## 1. Findings this closes

- **F2** (`docs/metro/research/verify-payment-paymentstatus-bug.md`) — `verify-payment/index.ts`
  references an undeclared `paymentStatus` at three DB-write sites; every DB write throws and is
  silently swallowed by the outer `catch (dbError)`. Live orders are instead saved client-side by
  `PaymentSuccess.tsx`'s `handleDatabaseInsert` (a direct `supabase.from('orders').insert(...)`
  from the browser), which also fires GA4/Google Ads and sends both order emails.
- **F1** (`docs/metro/research/metro-checkout-security-review.md`) — `verify-payment` never binds
  the verified Stripe session/PaymentIntent to the `orderId` it's about to write, and never
  compares the Stripe-paid amount to the order's total. A cheap real payment can, in principle, be
  replayed against a different, more expensive order id.
- **Unnamed finding, called out directly in the S1 brief** — `create-auth-hold` trusts every
  client-supplied item price entirely when building the Stripe Checkout Session; a tampered
  client can request a $1 hold for a $1,000 order.

## 2. Design: side-by-side v2, env-var cutover

`create-auth-hold-v2` and `verify-payment-v2` are new, independent edge functions. The v1
functions are untouched. The client never hardcodes a function name — `src/services/
checkoutFunctions.ts` is the single source of truth:

```ts
getCreateAuthHoldFunctionName() // import.meta.env.VITE_CREATE_AUTH_HOLD_FUNCTION || 'create-auth-hold'
getVerifyPaymentFunctionName()  // import.meta.env.VITE_VERIFY_PAYMENT_FUNCTION  || 'verify-payment'
isCheckoutV2Enabled()           // true if either env var points at a non-default name
```

Callers: `src/pages/Checkout.tsx` (create-auth-hold) and `src/pages/PaymentSuccess.tsx`
(verify-payment — this is the **only** client call site for verify-payment across every checkout
entry point: the regular cart checkout, the quote-conversion flow (`QuoteCheckout.tsx` ->
`create-quote-checkout` -> redirects to `/payment-success?quote_id=...`), and the landing page
flow (`landingStripeCheckout.ts` -> `create-payment` -> redirects to `/payment-success` too).
Centralizing the indirection in `PaymentSuccess.tsx` therefore covers all three without needing to
touch `QuoteCheckout.tsx` or `landingStripeCheckout.ts` — neither calls `create-auth-hold` or
`verify-payment` directly, so there was nothing to change in either file.

With both env vars unset, the only difference in the default path versus before this change is the
function-name indirection itself — proven by `src/services/checkoutFunctions.test.ts` and by
`git diff HEAD -- supabase/functions/verify-payment supabase/functions/create-auth-hold` being
empty. Cutover = set `VITE_VERIFY_PAYMENT_FUNCTION=verify-payment-v2` and
`VITE_CREATE_AUTH_HOLD_FUNCTION=create-auth-hold-v2` in the production build env. Rollback = unset
both (no redeploy of the v1 functions needed — they were never touched).

## 3. Price-validation decision: enforce a hard floor, flag the rest

The brief offered two options: fully recompute and enforce server-side pricing, or "detect and
flag" if that's too complex/uncertain. **Decision: a hybrid.** create-auth-hold-v2 does *not*
attempt to reproduce the legacy `/cart` flow's full pricing (ZIP-adjustment + coupon + deposit
math) server-side, because — unlike metro's `src/metro/checkout/serverQuote.ts`, which is the
single, already-server-authoritative source of truth for metro pricing — this repo has no
centralized, server-reproducible implementation of ZIP-based price adjustment for the legacy
catalog. `CartItem.basePrice`'s own comment in `src/contexts/CartContext.tsx` documents this:
*"Original product price before ZIP code adjustments"* — the adjustment itself happens somewhere
upstream of the cart (product/calculator pages) and was not something this agent could find
centralized and safely portable to Deno without risking a *worse* bug: silently rejecting
legitimate, already-discounted live orders on a production site.

Instead (`src/services/checkoutV2/pricing.ts`):

- **Deposit checkouts** (`depositOption: true`) are checked *exactly* — Checkout.tsx always
  charges a flat $199 regardless of cart contents, so this is fully verifiable and labeled `ok`.
- **Non-deposit checkouts**: every item's submitted per-unit price is compared against
  `products.price` (looked up server-side by `product_id`). A price below 50%
  (`PRICE_FLOOR_RATIO`) of the DB price is **rejected outright** — `create-auth-hold-v2` returns
  `409 { error: "PRICE_CHANGED", code: "PRICE_CHANGED" }` and no Stripe session is created. 50% was
  chosen with headroom over the largest real discount found in this codebase
  (`src/components/cart/CouponCode.tsx`'s built-in coupons top out at 10% / $50 flat) plus unknown
  ZIP-surcharge room, while still catching the named threat (a near-zero submitted price).
  Anything at or above the floor is labeled `unverifiable`, **never** `ok` — this module cannot
  positively confirm a ZIP/coupon-adjusted price is *correct*, only that it isn't absurdly low, and
  it says so honestly in Stripe session metadata (`priceCheck: 'ok' | 'mismatch' | 'unverifiable'`)
  rather than claiming false confidence.
- A product id that doesn't resolve in the `products` table, or a products-table read failure, is
  also `unverifiable` (fails open, not closed) — this keeps a DB hiccup from blocking checkout
  entirely; it's logged (`console.warn`/`console.error`) for visibility.

`verify-payment-v2` never uses `unverifiable` to reject anything after payment — it's purely
informational (visible in the Stripe session metadata, and thus in Stripe's own dashboard, for
manual spot-checks). The one thing verify-payment-v2 *does* enforce hard is **amount binding**
(section 4) — that catches the case a floor-evasion attacker actually cares about (getting charged
less than the real total), independent of whether the per-item price "looked" plausible.

## 4. v1 -> v2 behavior differences

| | v1 (`verify-payment`, `create-auth-hold`) | v2 (`*-v2`) |
|---|---|---|
| DB writes | Always throws (F2) — client (`handleDatabaseInsert`) does the real insert | Server creates rows; client never inserts on the v2 path |
| Session <-> order binding | None (F1) | `orderId` + `amount_total` bound to session metadata (checkout-v2 sessions) or the DB's own stored quote total (quote conversions) |
| Item price validation | None | Hard floor (50% of DB price) enforced at create time; everything else flagged, not blocked |
| Status values | Intended to be `pending`/`authorized`/`paid`/`processed`/`Deposit Paid` but never written (throws first); client instead hardcodes `status: 'confirmed'` | Correctly written (`src/services/checkoutV2/statusMapping.ts`), plus a new `review_required` value |
| Idempotency | None — a page reload / retry could double-insert (mitigated in practice by the client-side `dbInsertComplete` flag, which doesn't survive a real reload) | Re-processing the same `stripe_session_id` returns the existing rows (`alreadyProcessed: true`), never re-inserts or re-emails |
| Emails | Sent client-side (`src/services/emailService.ts`, unescaped interpolation in `src/utils/emailTemplates.ts`) | Sent server-side, same templates, every user-supplied field HTML-escaped first (`src/services/checkoutV2/emailPayload.ts`) |
| GA4 / Google Ads purchase tracking | Fired client-side from `handleDatabaseInsert`, deduped via `mgg_purchase_fired_<orderId>` in localStorage | Fired client-side from `PaymentSuccess.tsx`'s new `fireV2PurchaseTracking`, sourced from the v2 response, same dedupe key/localStorage guard, same event shape |
| A tampered/stale cart price | Silently accepted (create-auth-hold has no validation at all) | Rejected with `409 PRICE_CHANGED` before any Stripe session is created; `Checkout.tsx` shows *"Prices have updated since you added these items to your cart..."* |
| A genuine session/order mismatch (the F1 exploit) | Would silently flip the wrong order to paid, if F2 were ever fixed in isolation | Never silently accepted — the real, paid order (bound to the session's own metadata orderId, never the attacker-requested one) is inserted with `status: 'review_required'` and an internal alert email fires. The payment is never "dropped": a human always gets a record + an alert. |
| `backupData.customer` vs `backupData.customerInfo` | v1 reads `backupData.customer?.email` — but `src/utils/paymentUtils.ts`'s actual backup object only ever sets a `customerInfo` field, never `customer`. This is a latent v1 bug: the guest-checkout email-match branches always read `undefined` there. | v2 reads the correct field, `backupData.customerInfo?.email` |
| Sessions **not** created by create-auth-hold-v2 or create-quote-checkout (landing page's separate, un-migrated `create-payment` function) | Unbound (same as v1) | Still unbound — verify-payment-v2 has no server-controlled artifact to bind against for this third entry point (`create-payment` is not in this agent's ownership and was not modified). Falls back to v1-equivalent trust (requestedOrderId + backupData), but still gets the F2 status fix, idempotency, and server-side emails. **This is the one open gap** — see section 6. |
| `verify-payment`'s dead `CART-` conversion branch (lines 529-606) | Present but unreachable in practice (nothing in the live product calls `create-auth-hold` with a `CART-` id) | Not ported — see `src/services/checkoutV2/orderRecords.ts`'s module doc. The separate, unrelated "save cart" feature (`src/services/cartInsertService.ts`) still writes `CART-` rows today; that's untouched by this work either way. |

## 5. What's NOT bound, and why (the honest gap)

`src/services/checkoutV2/binding.ts` classifies every Stripe session verify-payment-v2 sees into
one of three origins:

1. **`checkout-v2`** — created by `create-auth-hold-v2`. Fully bound: `orderId` + `amount_total`
   checked against session metadata this agent's own function wrote.
2. **`quote-conversion`** — created by the existing, unmodified `create-quote-checkout`
   (metadata `{quote_id, type: "quote_conversion"}`). Bound against the DB's own stored
   `orders.total_price` sum for that quote — arguably *stronger* than case 1, since the quote rows
   are themselves a server-authoritative price a human already set.
3. **`unrecognized`** — anything else, in practice the landing page's `create-payment` function
   (`src/services/landingStripeCheckout.ts`). That function is not in this agent's ownership list
   and was not modified, and it writes no metadata this agent controls, so there is nothing to
   bind against. verify-payment-v2 falls back to v1's trust model for these specifically (never
   silently drops the order, never fabricates a mismatch) rather than mislabeling every
   landing-page purchase as tampered.

**Recommendation for the owner:** either (a) leave `VITE_VERIFY_PAYMENT_FUNCTION`/
`VITE_CREATE_AUTH_HOLD_FUNCTION` unset until the landing page is migrated to its own `-v2`
equivalent of `create-payment`, or (b) accept the gap — it's no worse than today for that one
entry point, and every other entry point strictly improves.

## 6. What F5 / RLS lockdown requires from this

The end state described in the S1 brief is: anonymous browsers can NOT insert/update `orders`
directly; order creation must happen server-side. After this change, on the v2 path:

- `PaymentSuccess.tsx` never calls `.from('orders').insert()`/`.update()` — `handleDatabaseInsert`,
  `handleCheckoutStyleDatabaseInsert`, `handleTestDatabaseInsert`, and the auto-insert `useEffect`
  are all guarded with an `isCheckoutV2Enabled()` early-return (belt-and-suspenders: every call
  site also independently checks the flag before calling them).
- `QuoteCheckout.tsx` still does two direct, unauthenticated client-side writes that are
  **unaffected by this work** and would need RLS to keep allowing them (or a server-side
  replacement) even after cutover: `handleSaveDeliveryInfo`'s `.from('orders').update(...)`
  (editing a `Quote`-status row's delivery details before payment) and `fetchQuoteData`'s
  `.select()` read. Both are reads/updates of a not-yet-paid `Quote` row the customer is actively
  reviewing, not order creation — out of this agent's ownership (`QuoteCheckout.tsx` isn't in the
  S1 file list beyond "use the indirection", and it doesn't call either target function).
- The separate "save cart" feature (`src/services/cartInsertService.ts`, `EnhancedDeliveryForm.tsx`)
  still does a direct client-side `CART-` insert — also unaffected, also out of scope here (flagged
  as a known, pre-existing, low-severity issue in the F2 research doc already).
- `src/pages/Checkout.tsx`'s hidden `testDatabaseInsertion` dev/test button still does a direct
  client-side insert (`status: 'test'`) — unrelated to the real checkout flow, not wired to any
  user-facing button, left as-is.

So: once F5's RLS migration locks down anonymous `INSERT`/`UPDATE` on `orders`, the v2 checkout
path (cart purchase + quote-conversion-via-payment) needs **zero** additional client-side write
permission — it's fully server-side already. The two items above (quote delivery-info editing,
save-cart) are separate, pre-existing client-side write paths that RLS will need to keep
accommodating (or that a future agent should migrate server-side) independent of this work.

## 7. Idempotency

`verify-payment-v2` looks up existing `orders` rows by `stripe_session_id` (or
`stripe_payment_intent_id` for a direct `pi_...` retrieval) before doing anything else. If rows
already exist, it returns them verbatim with `alreadyProcessed: true` — no re-insert, no
re-send of either email. This covers: the customer reloading `/payment-success`, a retry after a
transient network error, and the tab-close-then-reopen case. (Unlike metro's design, there's no
webhook-based second writer racing the customer's own page load here, so no race-resolution logic
is needed — a single writer, guarded by the idempotency check, is sufficient.)

## 8. Staging test plan (Stripe TEST mode, staging origin)

Prerequisite: `STAGING_ORIGINS` includes the staging origin and `STRIPE_TEST_SECRET_KEY` is set
(per `supabase/functions/_shared/stripe-mode.ts`, unmodified, read by both v2 functions).
`VITE_VERIFY_PAYMENT_FUNCTION=verify-payment-v2` / `VITE_CREATE_AUTH_HOLD_FUNCTION=create-auth-hold-v2`
set in the staging build.

1. **Normal cart checkout** — add 1-2 items, complete Stripe TEST checkout. Expect: redirect to
   `/payment-success`, order rows visible with `status: 'authorized'` (manual-capture hold),
   customer + internal emails received, GA4 `purchase` fires once (check
   `localStorage['mgg_purchase_fired_<orderId>']` is set after the first load, and reload the page
   — no second `purchase` event, no `alreadyProcessed: false` on the second load).
2. **Coupon applied** — apply `SAVE5`/`FIRST50`/`FREE25` before checkout, confirm order rows'
   `total_price` reflects the proportional discount (matches `computeItemFinalPricing`) and the
   confirmation email shows the coupon section.
3. **Deposit option** — toggle deposit, confirm the Stripe charge is exactly $199, order status is
   `Deposit Paid` once captured (or `authorized` while still a hold), `deposit_amount`/
   `balance_due` populated correctly.
4. **Quote conversion** — create a `Quote`-status order (admin flow), open `/quote-checkout/<id>`,
   accept and pay in Stripe TEST mode. Confirm the `Quote` row(s) flip to the converted `ORDER-...`
   id with the correct status, `quote_converted: true`, and that the amount bound correctly against
   the DB's stored quote total (no `review_required`).
5. **Tampered price (create-auth-hold-v2 rejection)** — via devtools, edit a cart item's price
   downward below 50% of its DB price before clicking "Continue to Payment". Expect a 409 and the
   "Prices have updated..." toast; no Stripe session created (Stripe dashboard shows nothing new).
6. **Session/order mismatch (F1 exploit simulation)** — complete a real cheap TEST checkout for
   order A, then manually call `verify-payment-v2` with A's real `session_id` but a different
   `orderId` (order B's). Expect: order B is **not** touched; a `review_required` row is inserted
   under order A's own (session-bound) id, and the internal alert email arrives.
7. **Reload success page** — after a successful purchase, refresh `/payment-success` (same URL,
   same `session_id`). Expect `alreadyProcessed: true` in the network response, order details
   still render, **no** duplicate order rows, **no** duplicate emails, GA4 does not re-fire.
8. **Tab close before redirect completes** — start checkout, close the tab before Stripe redirects
   back. Reopen `/payment-success?session_id=...&order_id=...` manually with the same session id.
   Expect the order to convert normally on this first real visit (no dependency on the original
   tab having stayed open — there is no webhook in this design, so this specifically confirms the
   customer's own later visit is sufficient, matching the "customer's own confirmation-page call"
   pattern already used by the legacy flow).

## 9. Cutover / rollback

- **Cutover:** set `VITE_VERIFY_PAYMENT_FUNCTION=verify-payment-v2` and
  `VITE_CREATE_AUTH_HOLD_FUNCTION=create-auth-hold-v2` in the production build environment, deploy
  both new edge functions (`supabase functions deploy create-auth-hold-v2 verify-payment-v2`),
  rebuild/redeploy the frontend.
- **Rollback:** unset both env vars and rebuild/redeploy the frontend. No edge-function redeploy
  needed — `verify-payment`/`create-auth-hold` were never touched and keep running unchanged the
  entire time. The `-v2` functions can be left deployed but unused.
- Before either flip, regenerate the Deno bundle if any `src/services/checkoutV2/**` or
  `src/utils/emailTemplates.ts` source changed: `node scripts/checkout/export-checkout-v2-bundle.mjs`,
  then re-run `npx vitest run src/services/checkoutV2` (the `bundleParity.test.ts` suite fails
  loudly if the checked-in bundle drifts from source).

## 10. Verification performed

- `npx vitest run src/services/checkoutV2 src/services/checkoutFunctions.test.ts` — 57/57 passing
  (pricing, metadata, binding, status mapping, idempotency, email-escaping, order-record building,
  bundle parity).
- `npx vitest run src/services src/pages src/metro` — all green except two pre-existing,
  out-of-scope failures from concurrent agent work on this shared branch, neither touching
  anything owned by this task:
  - `src/metro/checkout/bundleParity.test.ts` — expected per the S1 brief ("another agent is
    changing pricing; report it separately"); confirmed by `git status` showing
    `src/metro/lib/pricing.ts`/`src/metro/checkout/*.ts` as modified by someone else on this
    branch, unrelated to `src/services/checkoutV2/**`.
  - `src/services/products/exponentialPricing.test.ts` — unrelated product-pricing formula test,
    not part of the checkout flow at all; not modified by this agent.
- `npx tsc --noEmit -p tsconfig.app.json` — zero new errors from any file this agent touched
  (`src/services/checkoutV2/**`, `src/services/checkoutFunctions.ts`, `src/pages/Checkout.tsx`,
  `src/pages/PaymentSuccess.tsx`); the pre-existing errors in `OrderDetailModal.tsx`,
  `CrushedStoneLanding.tsx`, `DeliveryConfirm.tsx`, `MarketMaterialPage.tsx`, and (transitively,
  via another agent's `src/metro/checkout/stripeMode.test.ts`) `supabase/functions/_shared/
  stripe-mode.ts`'s ambient `Deno` global are all in files this agent never edited.
- `npx eslint src/services/checkoutV2 src/services/checkoutFunctions.ts scripts/checkout` — zero
  errors/warnings. `npx eslint src/pages/Checkout.tsx src/pages/PaymentSuccess.tsx` — zero *new*
  errors/warnings from this agent's edits (all remaining `no-explicit-any`/`exhaustive-deps`
  findings are on pre-existing lines this agent did not write, confirmed by inspecting each flagged
  line).
- `git diff HEAD -- supabase/functions/verify-payment supabase/functions/create-auth-hold` — empty.

## 11. Ownership / files touched

`supabase/functions/create-auth-hold-v2/index.ts`, `supabase/functions/verify-payment-v2/index.ts`,
`supabase/functions/_shared/checkout-v2.bundle.js` + `.d.ts` (generated, checked in),
`supabase/config.toml` (two new `[functions.*]` blocks, add-only), `src/services/checkoutV2/**`
(contract, pricing, metadata, binding, statusMapping, idempotency, emailPayload, orderRecords,
bundleEntry + tests), `src/services/checkoutFunctions.ts` (+ test), `scripts/checkout/
export-checkout-v2-bundle.mjs`, `src/pages/Checkout.tsx` (indirection + minimal v2-only
PRICE_CHANGED handling), `src/pages/PaymentSuccess.tsx` (indirection + v2-only trust-the-server
rendering/tracking + v1-only guards on every client-side `orders` write path), this document.
