# `verify-payment`'s undeclared `paymentStatus` bug — what it is, what it means for live orders today, and what metro does about it

**Status:** investigation only. `supabase/functions/verify-payment/index.ts` has been restored
to exactly match `HEAD` (`git diff HEAD -- supabase/functions/verify-payment/index.ts` is empty)
— nothing in this file was changed. Metro's checkout flow was redesigned to be fully isolated
from this function instead (see `docs/metro/research/metro-checkout-server.md`).

## 1. The bug

`supabase/functions/verify-payment/index.ts` reads a variable named `paymentStatus` at three
call sites, but that name is **never declared anywhere in the file** — not as a `const`/`let`,
not as a function parameter, not destructured from anything:

- Line 538 — `status: paymentStatus,` (building the CART→ORDER update payload)
- Line 668 — `status: paymentStatus,` (building a fresh order-insert row, the fallback path)
- Line 736 — `payment_status: paymentStatus,` (the success response body)

The value that was clearly *meant* to be used is computed just above, under a different name,
`orderStatus`:

```ts
// lines 283–311
let orderStatus = 'pending';
if (verificationResult.used_fallback) {
  orderStatus = 'processed';
} else if (verificationResult.paymentVerified) {
  orderStatus = verificationResult.isAuthorized ? 'authorized' : 'paid';
}
...
if (isDepositPayment && orderStatus === 'paid') {
  orderStatus = 'Deposit Paid';
}
```

`orderStatus` is computed, logged, and then never read again. `paymentStatus` is read three
times and never computed. This has every hallmark of a rename that only touched the assignment
site and missed the three read sites (or vice versa).

## 2. Evidence this is pre-existing and not metro-related

- `git diff origin/main -- supabase/functions/verify-payment/index.ts` returns **no diff** — the
  bug is already on production `main`, not something introduced by any metro work.
- Nothing under `src/metro/**` or `supabase/functions/create-metro-checkout/**` touches this
  file. The bug exists independent of metro entirely.
- In ESM (Deno edge functions always run in strict-mode ESM), reading an undeclared identifier
  throws `ReferenceError: paymentStatus is not defined`. This throw happens inside the function
  body that is wrapped in a `try { ... } catch (dbError) { ... }` block spanning lines 274–757
  (the whole "Database operation with guest support" section). The `catch` swallows the error:

  ```ts
  // line 754
  } catch (dbError) {
    console.error('Database operation failed:', dbError);
    verificationResult.error = 'Database operation failed';
  }
  ```

  Execution falls through to the final `return new Response(JSON.stringify(verificationResult), ...)`
  at line 760 — which still has `success: true, paymentVerified: true` from the Stripe
  verification step earlier in the function (lines 186–202), just **no `orders` key**, because
  the code never reaches the `return` at line 733 that would have included it.

- This throw is **unconditional or in every one of the three prefix branches** the function
  handles (`QUOTE-` at line 317, `CART-` at line 529, and the fresh-insert fallback at line 609),
  because `paymentStatus` is referenced in all three: `orderIdFromCart` update object (line 538,
  reached from the `CART-` branch), the fresh-insert record (line 668, reached whenever
  `!data` after either branch — i.e. always, for anything that isn't a `QUOTE-`), and the
  response body (line 736, reached on *every* successful path). So regardless of which order-id
  prefix a caller sends, the DB-write block throws before it can write anything, every time.

## 3. What ACTUALLY happens today for a live order (traced through `PaymentSuccess.tsx`)

The live `/checkout` page (`src/pages/Checkout.tsx`) generates a fresh `ORDER-<timestamp>-<rand>`
id (line 345) and calls `create-auth-hold` — it does **not** insert any row into `orders` before
redirecting to Stripe. (`create-auth-hold/index.ts` doesn't touch the `orders` table either —
confirmed by reading the whole 156-line file.) So by the time the customer lands back on
`/payment-success`, there is no pre-existing `orders` row for this purchase at all.

`PaymentSuccess.tsx`'s `processPaymentSuccess` (starting line 132) calls `verify-payment` with
`{ paymentIntentId: stripeId, orderId, backupData, skipDbInsert: false }` (line 221). Because of
the bug above:

1. Stripe verification itself succeeds (`data.success === true`, `data.paymentVerified === true`)
   — that part of `verify-payment` runs before the broken DB block and is unaffected.
2. The DB-write block throws internally and is swallowed; the response has no `orders` key.
3. Back in `PaymentSuccess.tsx`, line 301: `if (data.orders && data.orders.length > 0)` is
   **false** (there is no `data.orders`).
4. Falls to line 346: `else if (checkoutOrderBackup && !dbInsertComplete) { await
   handleDatabaseInsert(checkoutOrderBackup, currentOrderId, data, stripeId); }` — this branch
   runs instead.
5. `handleDatabaseInsert` (line 395) calls `insertOrderToDatabase` (`src/services/
   orderInsertService.ts`), which does a plain `INSERT` (not an update — there's nothing to
   update) of one row per cart item, with `order_id: currentOrderId` (the same `ORDER-…` id from
   `Checkout.tsx`), **`status: 'confirmed'`** (hardcoded, line 115 of `orderInsertService.ts`),
   the Stripe session/payment-intent ids, and all delivery/contact fields from
   `checkoutOrderBackup.items`.
6. On success, `handleDatabaseInsert` also (all client-side, in this same function):
   - Fires the GA4 `purchase` event and calls `trackGoogleAdsConversion('purchase', ...)`
     (lines 494–534), deduped via the `mgg_purchase_fired_<orderId>` localStorage key.
   - Calls `setEnhancedConversionData(...)` with the customer's email/phone/address for Google's
     enhanced conversions.
   - Calls `handleEmailSending` (line 538) → `sendBothOrderEmails` (`src/services/
     emailService.ts`) → two `supabase.functions.invoke('send-email', ...)` calls: a customer
     order-confirmation email and an internal notification email to
     `order.support@mygravelguy.com`.
   - Does **not** send any SMS. `src/hooks/useOrderSMS.ts`'s `send-order-sms` invocation is only
     wired to a manually-triggered admin UI button elsewhere in the app, not to any automatic
     post-payment flow.

**Bottom line: the bug is effectively harmless for the live, unmodified `/checkout` flow.**
`verify-payment`'s Stripe verification (the part that actually matters — confirming the payment
happened) still works. The DB write, purchase tracking, and emails all happen anyway, just
via a different code path (`handleDatabaseInsert`, entirely client-side) that was clearly built
as a fallback/auto-insert mechanism and today runs on *every* live order, not just as a fallback.
This is very likely *why* the bug has gone unnoticed — the system has a redundant path that
happens to cover for it.

There is a secondary "auto-insert" `useEffect` (lines 802–851) that also calls a
checkout-style DB insert 2.5 seconds after load if nothing else has inserted yet, as a second
safety net — further evidence the client-side path is treated as the real mechanism, not an
edge case.

## 4. Do CART- rows from the live checkout ever get stuck at `status = 'cart'` and email a paying customer?

Traced `src/services/cartInsertService.ts` and `src/pages/Checkout.tsx`:

- `cartInsertService.ts`'s `insertCartToDatabase` (called from `src/components/cart/
  EnhancedDeliveryForm.tsx`, a "save my cart" affordance) inserts `CART-<timestamp>` rows with
  `status: 'cart'`. This is a **separate feature from the actual purchase flow** — a snapshot
  saved for later, not a checkout-in-progress row.
- `Checkout.tsx`'s `handleCheckout` (the button that actually starts a Stripe session) **never
  reads or reuses** any existing `CART-` id. It always mints a brand-new `ORDER-<timestamp>-
  <rand>` id (line 345) and never inserts a `cart`-status row for it before redirecting to
  Stripe.
- `create-auth-hold/index.ts` does have a branch (lines 80–83) that would preserve an incoming
  `orderId` if it already starts with `CART-` — but nothing in the current UI ever calls it with
  one, so that branch is dead code in practice today.

**Conclusion: for the current live `/checkout` → `create-auth-hold` → `/payment-success` flow,
there is no pre-existing `cart`-status row to get stuck.** The purchase always creates a brand
new `orders` row with `status: 'confirmed'` directly (via `handleDatabaseInsert`, step 5 above).
So `process-abandoned-carts` (`supabase/functions/process-abandoned-carts/index.ts`, lines
163–170) — which queries `status = 'cart' AND delivery_email IS NOT NULL AND created_at <
now() - 1h`, with **no filter on `order_id` prefix** — will never see that purchase's row at
all, because it's never `'cart'`.

The one adjacent (but different) scenario that *is* real today: a customer who used the
"save cart" feature (creating a `CART-…` row) and later completes an unrelated purchase through
the normal flow will still have their old saved-cart row sitting at `status = 'cart'` forever —
that row is unrelated to any order they paid for, was never meant to convert, and (working as
designed) will still receive the abandoned-cart email sequence addressed to the same email
address. This is pre-existing behavior, unrelated to the `paymentStatus` bug, and out of scope
here — flagging only because it's adjacent to the question asked.

**Why this matters for metro:** the *original* metro-checkout design (before this redesign)
depended on `create-metro-checkout` inserting a `status: 'cart'` row (`CART-METRO-…`) and
`verify-payment`'s `CART-` branch (lines 529–606) flipping it to `authorized`/`paid` after
Stripe redirect. Because of this bug, that flip **would never have happened** — the
`CART-METRO-…` row would stay at `status: 'cart'` indefinitely even for a customer who paid in
full, and `process-abandoned-carts` **would** pick it up (it has a non-null `delivery_email` and
no prefix filter) and send that paying customer up to three "you left something in your cart"
emails over the following days. That's the regression the orchestrator flagged and the reason
metro now has its own isolated `verify-metro-payment` function instead of reusing this branch.

## 5. What would change if someone fixed the bug

The smallest fix is additive: alias the already-computed `orderStatus` under the name the rest
of the file expects (`const paymentStatus = orderStatus;`, placed right after `orderStatus` is
finalized around line 311) — no other line needs to change. A prior draft of this work applied
exactly that fix and was rejected in review specifically because of its blast radius on the
*live* system, not because the fix itself is wrong. If applied:

- The `CART-`/`QUOTE-`/fresh-insert DB-write block in `verify-payment` would start actually
  succeeding, for every order type, not just metro.
- For the **existing, live, non-metro `/checkout` flow**, this would mean `verify-payment`
  itself would successfully return `data.orders` for the first time. `PaymentSuccess.tsx`'s
  branch at line 301 would then take the `data.orders` path **instead of**
  `handleDatabaseInsert`. Two consequences worth an owner's attention before ever deploying this
  fix:
  1. **GA4/Google Ads purchase tracking would silently stop firing** for regular checkout
     orders — the `data.orders` branch (lines 301–344) does not fire any purchase-tracking
     event at all; only `handleDatabaseInsert` (lines 494–534) does. This is the exact gap
     A2v2 found and patched narrowly for metro order-ids only in `PaymentSuccess.tsx` — fixing
     `paymentStatus` would reintroduce the same gap for the *majority* of live traffic.
  2. Order rows would end up with `status: 'paid'`/`'authorized'` (from `orderStatus`'s real
     logic) instead of the current hardcoded `'confirmed'` from `insertOrderToDatabase`. Any
     downstream code, dashboard filter, or report that expects `status: 'confirmed'` for live
     orders would need to be checked against the new values first.
  - Emails would still send either way (both paths call an equivalent
    email-sending step), so that part is not at risk.
- It would also make cart-to-order conversion functional for any feature that actually relies on
  it (e.g., a genuine "save cart, come back and pay later" flow, if one is ever built against the
  `CART-` branch) — today, nothing in the live product depends on that branch actually running.

## 6. Recommendations (not implemented — for the owner to decide)

1. **Leave `verify-payment` untouched for now.** It is not broken for the live flow in a
   customer-visible way; the client-side fallback fully covers it. Metro proceeds independently
   via `verify-metro-payment`.
2. **If/when the owner wants to fix it**, do so as its own dedicated, carefully-tested change —
   not bundled with a feature branch — specifically because of the GA4 tracking-path swap in
   §5.1. The safest sequence: (a) add the `paymentStatus` alias, (b) in the same change, either
   move the purchase-tracking call into the `data.orders` branch of `PaymentSuccess.tsx` too (so
   both paths track), or accept that `handleDatabaseInsert`'s tracking should be duplicated/
   generalized, (c) manually verify a real Stripe test-mode order still fires GA4 purchase and
   still lands with a sane `status` value before deploying to production.
3. **Longer term**, consider deleting the entire "fresh order insert" and "CART- conversion"
   branches from `verify-payment` (lines 316–697) if `handleDatabaseInsert` is going to remain
   the actual mechanism for live orders — dead, throwing code is worse than no code, and its
   presence is what makes this bug easy to miss (nothing *looks* broken from the outside).
4. **Separately worth flagging**: the "save cart" feature's orphaned `CART-` rows (§4) are a
   pre-existing, low-severity annoyance (an unrelated abandoned-cart email to someone who already
   bought something else) — not urgent, not part of this investigation's scope, but easy to fix
   later by either not persisting to `orders` for the save-cart feature, or excluding rows that
   never had a `create-auth-hold`/checkout attempt from the abandoned-cart query.
