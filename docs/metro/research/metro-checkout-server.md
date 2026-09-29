# Metro checkout — server side (agent A1-CHECKOUT-SERVER, updated by A1v2-METRO-VERIFY-SERVER,
# then A1v3-METRO-CHECKOUT-HARDENING)

Status: DONE. `npx vitest run src/metro src/pages/metro` (639 tests at the time this line was
written; see `docs/metro/research/metro-checkout-rereview.md`'s "Resolution" section for the
current count), `npx tsc --noEmit -p tsconfig.app.json` (no new errors — 19 pre-existing errors
remain in unrelated files this agent never touched: OrderDetailModal.tsx, CrushedStoneLanding.tsx,
DeliveryConfirm.tsx, MarketMaterialPage.tsx), and `npx eslint src/metro scripts/metro
src/pages/metro` (clean as of this line; `scripts/metro/margin-scenarios.ts`'s 4
`no-explicit-any` findings were fixed by a later agent — see the rereview doc) all pass.

## Current design (authoritative) — read this first

This doc accumulated three passes (A1 → A1v2 → A1v3) and a mid-stream redesign; large parts of it
below (everything under "## FOR A2 / CLIENT [ORIGINAL...]" down to the end, except where a
subsection is explicitly marked otherwise) describe **superseded v1/v2 designs kept only for
history**. The design actually live in the code today (verified by reading
`src/metro/checkout/{contract,serverQuote,verifyLogic,conversion,emailTemplates}.ts`,
`supabase/functions/{create-metro-checkout,verify-metro-payment,metro-stripe-webhook}/index.ts`,
and `supabase/functions/_shared/metro-conversion-runner.ts`) is:

- **One order id, generated once.** `create-metro-checkout` generates `orderId =
  generateMetroOrderId(now)` in the `ORDER-METRO-<epoch-ms>-<rand>` form
  (`METRO_ORDER_ID_PREFIX` in `contract.ts`). There is no `CART-METRO-` prefix, no staging id, and
  no rename step anywhere in the current code — `verifyLogic.ts`'s `METRO_ORDER_ID_RE =
  /^ORDER-METRO-(.+)$/` rejects anything else (including a stale cached `CART-METRO-` id) as
  `invalid` (400).
- **No `orders` row is ever inserted before payment.** `create-metro-checkout` never calls
  `.insert()` — the entire order (validated request + server-recomputed quote) is serialized into
  the Stripe Checkout Session's `metadata` via `buildMetroCheckoutMetadata` (`conversion.ts`) and
  lives there, and only there, until a payment is verified.
- **The row is inserted after payment is verified**, by whichever of `verify-metro-payment`
  (called from `/metro-order-confirmed`) or `metro-stripe-webhook` (called by Stripe on
  `checkout.session.completed`/`checkout.session.async_payment_succeeded`) gets there first. Both
  call the same shared helper, `supabase/functions/_shared/metro-conversion-runner.ts`'s
  `convertMetroSession`, which re-derives the order from the session's metadata, re-quotes
  server-side at the session's `created` timestamp, and does the idempotent
  insert-with-race-resolution described in the "2026-09-28 hardening pass" section directly below
  (still accurate, current).
- **G1 fix — owner alert + webhook retry on a genuine insert failure.** If `convertMetroSession`
  returns `{ kind: "error" }` (a real DB failure after Stripe has already confirmed the payment —
  not a `23505` unique violation, which is handled as `already_processed`/`review_required`
  instead), `metro-conversion-runner.ts`'s `sendMetroConversionErrorAlert` sends an internal-only
  `[ORDER MAY BE LOST]` email to `order.support@mygravelguy.com`
  (`buildOrderInsertFailedInternalHtml` in `emailTemplates.ts`), and `metro-stripe-webhook/
  index.ts` returns **500** specifically for this outcome (every other outcome still 200s) so
  Stripe's own retry mechanism gets a chance to self-heal a transient DB issue.
  `verify-metro-payment/index.ts` deliberately does **not** also send the alert on this same
  outcome (dedupe decision, documented in `sendMetroConversionErrorAlert`'s doc comment) — it
  still returns the customer a reassuring "payment received, we're confirming your order" response
  either way.
- **G2 fix — a real `.d.ts` for the bundle.** `scripts/metro/export-metro-checkout-bundle.mjs` now
  also emits `supabase/functions/_shared/metro-checkout.bundle.d.ts` (via `tsc
  --emitDeclarationOnly` over the real source, not hand-duplicated types), and
  `metro-conversion-runner.ts` type-imports the bundle with `// @deno-types="./metro-checkout.
  bundle.d.ts"` immediately above the `import { ... } from "./metro-checkout.bundle.js"` line, so
  a type-checker (`deno check`/`tsc`) run against the runner now resolves
  `MetroOrderEmailData`/`MetroServerQuote`/`MinimalStripeSession`/`ParsedMetroCheckout`/
  `MetroOrderErrorAlertData` instead of erroring "no exported member".
- **G3 fix — richer Enhanced Conversions data.** `MetroConfirmedOrder` (`contract.ts`) now carries
  optional `customerName`/`customerPhone`, populated in `verifyLogic.ts`'s `buildConfirmedOrder`
  from `row.delivery_name`/`row.billing_name` and `row.delivery_phone`, and
  `src/pages/metro/MetroOrderConfirmedPage.tsx` threads them into
  `trackMetroPurchaseConversion`/`setEnhancedConversionData`
  (`src/metro/services/metroPurchaseTracking.ts`), which now also documents its real caller in its
  header comment instead of a stale `PaymentSuccess.tsx` reference.

See `docs/metro/research/metro-checkout-rereview.md` for the adversarial review that found
G1–G4 and its "Resolution" section for what changed and the current test count.

## 2026-09-28 hardening pass (A1v3-METRO-CHECKOUT-HARDENING)

Implements the fixes from `docs/metro/research/metro-checkout-security-review.md` that were in
scope for this agent (F3, F4, F6, F7, F8, F9 — F1/F2/F5 are about the legacy `verify-payment`
function and `orders` RLS, out of scope here). The single biggest change: **no `orders` row is
ever inserted before payment is verified** (fixes F3 — unauthenticated `create-metro-checkout`
calls could previously create a `status='cart'` row with attacker-supplied
name/email/phone/address that `process-abandoned-carts` would later email/text, and which
allowed unlimited DB-row spam).

### v3 flow

```mermaid
sequenceDiagram
    participant C as Customer browser
    participant CMC as create-metro-checkout
    participant S as Stripe Checkout
    participant OCP as /metro-order-confirmed
    participant VMP as verify-metro-payment
    participant WH as metro-stripe-webhook
    participant DB as orders table

    C->>CMC: POST checkout request (metro/zip/category/variant/qty/date/contact/address)
    CMC->>CMC: sanitizeCheckoutRequest + validateRequest (caps, quantity step/cap)
    CMC->>CMC: buildServerQuote (re-quote from price book, never trust client price)
    Note over CMC,DB: NO DB WRITE — order id + full order data go into Stripe metadata only
    CMC->>S: checkout.sessions.create({ metadata: {...everything...}, capture_method: manual })
    S-->>C: redirect to Stripe Checkout page
    C->>S: completes payment (card authorized)
    S-->>C: redirect to /metro-order-confirmed?session_id=&order_id=
    par Page-driven conversion
        OCP->>VMP: { sessionId, orderId }
        VMP->>S: sessions.retrieve(session_id, {expand: payment_intent})
        VMP->>VMP: validateSession + mapPaymentIntentStatus
        VMP->>VMP: parseMetroCheckoutMetadata + re-quote at session.created time
        VMP->>VMP: evaluateAmountAndPrice (amount_total + recomputed price both must match)
        VMP->>DB: idempotent INSERT (order_id, status, stripe_session_id, ...)
        VMP-->>OCP: MetroVerifyResponse (unchanged contract)
    and Webhook-driven conversion (fires independently, covers the tab-closed case)
        S->>WH: checkout.session.completed / async_payment_succeeded (signed)
        WH->>WH: verify signature (STRIPE_METRO_WEBHOOK_SECRET, SubtleCryptoProvider)
        WH->>S: paymentIntents.retrieve (webhook payload has no expanded PI)
        WH->>DB: idempotent INSERT (same shared logic as VMP)
        WH-->>S: 200 OK
    end
    Note over VMP,WH: Whichever of the two gets there first inserts the row; the other finds it\nalready exists (or races the insert and loses) and reports alreadyProcessed with no\nduplicate notifications — see conversion.ts's resolveInsertRace.
```

Key design points:

- **create-metro-checkout** (`supabase/functions/create-metro-checkout/index.ts`) re-quotes and
  validates exactly as before, but instead of inserting a `cart` row it calls
  `buildMetroCheckoutMetadata` (`src/metro/checkout/conversion.ts`) to serialize the entire order
  into the Stripe Checkout Session's `metadata` (flat string→string). See
  `src/metro/checkout/contract.ts`'s `METRO_CHECKOUT_METADATA_KEYS` for the full, documented key
  list (33 keys today — well under Stripe's 50-key cap; longest key is 17 chars, well under the
  40-char cap; every value is bounded by `METRO_INPUT_CAPS`/short enums, well under the 500-char
  cap). `orderId` is generated once, here, with the new prefix `ORDER-METRO-<ts>-<rand>`
  (`METRO_ORDER_ID_PREFIX` in `contract.ts` — no more `CART-METRO-` staging prefix, since there's
  no row to rename anymore).
- **Stripe line items now use exact integer-cents math** (`buildLineItemCents` in
  `serverQuote.ts`, fixes F8) — the three possible line items (material, Saturday fee, rush fee)
  always sum to exactly `amount_total` in cents, with any rounding remainder reconciled onto the
  base-price line.
- **verify-metro-payment** (`supabase/functions/verify-metro-payment/index.ts`) and the new
  **metro-stripe-webhook** (`supabase/functions/metro-stripe-webhook/index.ts`) both call the same
  shared I/O helper, `supabase/functions/_shared/metro-conversion-runner.ts`, which:
  1. Validates the session belongs to this order and `metadata.source === 'metro-checkout'`.
  2. Maps PaymentIntent status; `unpaid` → no DB effect at all, `{success:false, status:'unpaid'}`.
  3. Checks for an existing `orders` row by `order_id` first (idempotency fast path) —
     found → `alreadyProcessed: true`, no notifications, no re-insert.
  4. Otherwise parses the session metadata (`parseMetroCheckoutMetadata`), re-derives the order,
     and **re-quotes server-side using `buildServerQuote` at the session's `created` timestamp**
     (never "now" — a delivery date can flip from available to `DATE_UNAVAILABLE` purely because
     the clock moved forward past a cutoff; re-quoting at creation time avoids that false
     mismatch). Asserts BOTH `session.amount_total === round(metadata.serverTotal * 100)` AND the
     recomputed total matches `metadata.serverTotal` within `METRO_PRICE_TOLERANCE`
     (`evaluateAmountAndPrice` in `conversion.ts`).
  5. On a match: inserts the row with `status: 'authorized' | 'paid'` (from the PaymentIntent),
     sends the customer confirmation + internal notification emails (first conversion only).
  6. On a mismatch: inserts the row with `status: 'review_required'` and a note explaining why,
     sends an **internal-only** alert (never a customer email), and the API response is the
     existing `{success:false, status:'mismatch'}` shape — `MetroVerifyResponse` needed no new
     variant.
  7. **Insert-race handling**: after inserting, re-selects every row sharing that `order_id`
     (in case the other of {page, webhook} inserted its own row in the interim) and keeps only
     the earliest by `created_at` (`resolveInsertRace` — `orders.id` is a random UUID in this
     schema, not a sortable/sequential id, so `created_at` is the tie-break actually used, with
     `id` as a last-resort deterministic tie-break for identical timestamps). The loser deletes
     its own duplicate row and reports `alreadyProcessed: true` with no notifications; only the
     winner notifies.
- **`not_found`** is now reserved strictly for "the Stripe session doesn't exist or isn't a
  metro-checkout session" — it can no longer mean "no DB row yet" (there's no separate DB lookup
  state anymore; the order is derived from the session itself).
- **Every user-supplied field is HTML-escaped** before being interpolated into any notification
  email (`src/metro/checkout/emailTemplates.ts`'s `escapeHtml` + template builders — fixes F4).
- **Input caps** (`METRO_INPUT_CAPS`, `METRO_QUANTITY_MAX`/`METRO_QUANTITY_STEP` in `contract.ts`,
  enforced by `sanitizeCheckoutRequest`/`validateRequest` in `serverQuote.ts` — fixes F6/F7/F9):
  name ≤100, email ≤254 (+format), mobile ≤20 (+basic phone-shape regex), street ≤200, city ≤100,
  state exactly 2 letters, zip exactly 5 digits, dropNotes ≤500, each utm value ≤200 with a
  10-key allowlist, quantity >0 and ≤500 (chosen: largest configured truck capacity across both
  metros today is 28 tons / 20 yd — ×10 headroom would be 280; rounded up to a flat, easy-to-quote
  500) and must be on the half-unit step the client UI already enforces. All free-text fields are
  trimmed and stripped of control characters (newlines preserved only in `dropNotes`).
- `MetroVerifyResponse` (the contract `MetroOrderConfirmedPage.tsx` consumes) is **unchanged** —
  the page needed no behavioral edits, only a comment update (it was already prefix-agnostic:
  it just forwards whatever `order_id` is in the URL query string to `verify-metro-payment`).
  `metroCheckoutService.ts` likewise needed no functional change — it stores whatever `order_id`
  the server returns, which is now the final `ORDER-METRO-` id from the very first response.

### Metadata key list (`METRO_CHECKOUT_METADATA_KEYS`, `src/metro/checkout/contract.ts`)

`source, orderId, metroSlug, zip, categorySlug, variantSlug, quantity, deliveryDate, zoneSlug,
name, mobile, street, city, state, dropNotes, serverTotal, expectedTotal, userId, userEmail,
isGuest, depositOption, fullOrderAmount, gclid, gbraid, wbraid, utm_source, utm_medium,
utm_campaign, utm_term, utm_content, landing_page_url, referrer, user_agent` — 33 keys. Email is
deliberately **not** a metadata key; it's carried as `userEmail` (for parity with
create-auth-hold's existing key set) and separately as the Stripe session's native
`customer_email` field. `user_agent` is captured from the real request header server-side in
`create-metro-checkout` (never trusted from the client's `utmData` body) — see
`ALLOWED_UTM_KEYS` in `contract.ts` for why it's excluded from the client-supplied utm allowlist.

### Env vars (v3 additions)

| Var | Purpose | Default | Used by |
|---|---|---|---|
| `STRIPE_METRO_WEBHOOK_SECRET` | Signing secret for the metro Stripe webhook endpoint (Stripe dashboard → Developers → Webhooks → this endpoint → "Signing secret") | required | `metro-stripe-webhook` |

All other env vars (`stripe`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
`METRO_CHECKOUT_ALLOW_UNCONFIRMED`, `METRO_CHECKOUT_EXTRA_ORIGINS`, `RESEND_API_KEY`) are
unchanged from the table further down this doc. `SUPABASE_SERVICE_ROLE_KEY` is no longer needed
by `create-metro-checkout` (it never touches the DB anymore) but is still required by
`verify-metro-payment` and `metro-stripe-webhook`.

### Owner steps: Stripe dashboard webhook setup

1. Stripe dashboard (**live mode**, once ready — use **test mode** for the manual test plan
   below) → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://losrkjvrcambvgijfism.supabase.co/functions/v1/metro-stripe-webhook`.
3. Events to select: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
   only (no other events are consumed — `isMetroCheckoutWebhookEvent` in `verifyLogic.ts` ignores
   everything else, and metro-only, via `metadata.source === 'metro-checkout'`, so this same
   Stripe account's other webhook consumers — if any — are unaffected either way).
4. Copy the endpoint's **Signing secret** (`whsec_...`) and set it as the `STRIPE_METRO_WEBHOOK_SECRET`
   secret on the Supabase project (`supabase secrets set STRIPE_METRO_WEBHOOK_SECRET=whsec_...`
   or via the dashboard).
5. Deploy: `supabase functions deploy create-metro-checkout verify-metro-payment metro-stripe-webhook`.
6. `supabase/config.toml` already has `[functions.metro-stripe-webhook]` with `verify_jwt = false`
   (Stripe calls this with no Supabase auth — the webhook signature is the only trust boundary).

### TEST-mode plan additions (Stripe TEST mode only — never production)

Steps 1-11 further down this doc (unchanged in substance — `create-metro-checkout` no longer
creates a DB row, so step 3 "check the `orders` table" now happens only *after* step 5's verify
call, not right after step 2) still apply. New for v3:

12. **Tab-close / webhook-only conversion test**: complete a Stripe TEST checkout as in step 4,
    but do **not** let `/metro-order-confirmed` call `verify-metro-payment` (e.g. navigate away
    immediately, or block the request in devtools). Confirm the `orders` row still appears
    (inserted by `metro-stripe-webhook` instead) within a few seconds of Stripe sending the
    `checkout.session.completed` event. You can also replay this without a real browser via the
    Stripe CLI: `stripe listen --forward-to
    https://<project>.functions.supabase.co/metro-stripe-webhook` then `stripe trigger
    checkout.session.completed` (note: `stripe trigger` synthesizes a generic event, not one tied
    to a real metro checkout session's metadata, so `isMetroCheckoutWebhookEvent` will correctly
    ignore it unless you construct a custom fixture with `metadata.source: 'metro-checkout'` —
    the Stripe CLI's `--override` flags or the dashboard's "send test webhook" replay-from-a-real-
    event feature are the practical way to get a realistic payload).
13. **Double-conversion race test**: complete a real TEST checkout, then fire both a
    `verify-metro-payment` call AND a simulated webhook event for the same session at
    (approximately) the same time. Confirm exactly one `orders` row exists afterward, exactly one
    notification pair was sent (check Resend logs / inbox count), and the "losing" caller's
    response still resolves successfully (`alreadyProcessed: true` for `verify-metro-payment`;
    `metro-stripe-webhook` always 200s regardless).
14. **Price-mismatch / review_required test**: after `create-metro-checkout` returns a session
    (don't complete payment yet), manually flip a variant's `nodePricePerUnit` in the relevant
    `src/metro/config/*.ts` file (a local/staging-only edit) so the price book no longer matches
    what's in the session's metadata, then complete payment and call `verify-metro-payment`.
    Confirm: `{success:false, status:'mismatch'}` (409), and in the DB a row **is** inserted with
    `status: 'review_required'` and a note containing `[REVIEW REQUIRED]` + the mismatch reason,
    and only the internal review-alert email was sent (not the customer confirmation).

### Migration decision

`supabase/migrations-drafts/20260928170000_metro_orders_unique_session.sql` adds an **optional** partial
unique index on `orders(stripe_session_id) WHERE order_id LIKE 'ORDER-METRO-%'` — **not applied**
by this agent (no live DB access; migrations in this repo are applied manually/via CI outside
this session). It's safe to apply at any time (scoped to a prefix with zero existing rows) and
would upgrade the insert-race handling from "best-effort re-select-and-delete" to a hard DB-level
guarantee (the insert code already handles the resulting `23505` unique-violation via
`isUniqueViolation` in `conversion.ts`, so applying the migration requires no further code
changes). Owner: review and run via your normal migration-apply step whenever convenient.

### Residual risks (v3)

- **Race-resolution tie-break uses `created_at`, not `id`** — `orders.id` is a random UUID in this
  schema, not sortable by creation order, so "keep the earliest id" (as an id-only rule) doesn't
  mean what it would for a sequential id; `created_at` is the actual chronological signal used,
  with `id` only as a last-resort deterministic tie-break for identical timestamps. Documented in
  `resolveInsertRace`'s doc comment in `conversion.ts`.
- **Without the optional migration applied**, the insert-race guard is purely application-level
  (read-after-write re-select-and-delete) — a sufficiently pathological interleaving could in
  theory leave two rows briefly visible to a third reader between one caller's insert and its own
  cleanup pass. Applying the migration closes this gap at the DB level.
- **The idempotency fast-path (existing-row lookup) does not clean up pre-existing duplicate rows**
  it merely finds — only the insert-triggered race path actively deletes duplicates. In practice
  duplicates should only ever be created by the insert-race path itself, which does clean up, so
  this is a defense-in-depth gap rather than an expected occurrence.
- **`fallbackQuoteFromMetadata`** (`supabase/functions/_shared/metro-conversion-runner.ts`) is
  used only in the extremely unlikely case where the metro/category/variant/zip recorded in
  metadata can no longer be resolved against the current price-book config at all (e.g. a
  category was removed between checkout and payment) — it hardcodes `unit: 'ton'` regardless of
  the category's real unit, so a `review_required` row built this way could show the wrong unit
  label until a human corrects it. The dollar total is unaffected (it comes straight from
  metadata, not from the fallback quote's per-unit math).
- **F1/F2/F5 remain unfixed** (out of scope for this agent — see
  `docs/metro/research/verify-payment-paymentstatus-bug.md` and the security review's own
  verdict). This feature is `create-metro-checkout`/`verify-metro-payment`/`metro-stripe-webhook`
  only, fully isolated from `verify-payment`, and stays gated dark
  (`priceBookConfirmed: false` for every metro) regardless.

## Staging / test mode (2026-09-28, ST-STAGING agent)

Full staging setup (VPS architecture, DNS, TLS, basic-auth, CI deploy workflow, owner runbook) is
in `docs/metro/STAGING.md`. This section covers the server-side Stripe live/test split those
staging requests actually exercise.

### How live/test mode is selected

`supabase/functions/_shared/stripe-mode.ts` (orchestrator-authored contract) is now wired into all
three metro Stripe functions:

- **`create-metro-checkout`**: `resolveStripeModeForOrigin(req.headers.get("origin"))`. A request's
  `Origin` header in `STAGING_ORIGINS` (comma-separated, e.g.
  `https://staging.mygravelguy.com`) → **test mode**, `STRIPE_TEST_SECRET_KEY`. Everything else
  (including a missing/unrecognized Origin) → **live mode**, `stripe` (the existing live key env
  var, unchanged). Fails closed with a 500 if the resolved mode's key isn't configured — a staging
  request never silently falls back to the live key.
- **`verify-metro-payment`**: `resolveStripeModeForSessionId(sessionId)` picks the key used to
  *retrieve* the session (a `cs_test_…` id → test key). Once the session comes back, the
  authoritative signal for everything downstream (order status/tags/notification subject, and the
  `METRO_CHECKOUT_ALLOW_UNCONFIRMED` gate — see below) is Stripe's own `session.livemode`, not the
  id-prefix heuristic.
- **`metro-stripe-webhook`**: tries `STRIPE_METRO_WEBHOOK_SECRET` (live) then
  `STRIPE_METRO_WEBHOOK_SECRET_TEST` (test) to verify the inbound signature — fails closed (400)
  if neither verifies. Once verified, `event.livemode` (Stripe's own signal, from the *verified*
  event, not the raw payload) picks which API secret key (`stripe` vs `STRIPE_TEST_SECRET_KEY`) is
  used for the subsequent `paymentIntents.retrieve` call — fails closed (500) if that mode's key
  isn't configured.
- A new additive helper, `resolveStripeModeForLivemode(livemode, env?)`, was added to
  `stripe-mode.ts` for the webhook's event.livemode-based lookup (same fail-closed contract as the
  other two `resolveStripeModeFor*` functions; the exported API those two already had was not
  changed).

### `METRO_CHECKOUT_ALLOW_UNCONFIRMED` can no longer enable unconfirmed LIVE checkouts

Before this change, `METRO_CHECKOUT_ALLOW_UNCONFIRMED=true` alone was enough to let
`create-metro-checkout` quote (and `verify-metro-payment`/`metro-stripe-webhook` recompute) a price
for a metro whose price book isn't confirmed yet (`priceBookConfirmed: false`) — a real risk if
that env var were ever left on in production. It's now gated on test mode too, in all three
functions:

```
allowUnconfirmed = (METRO_CHECKOUT_ALLOW_UNCONFIRMED === "true") && (mode === "test")
```

`mode` comes from `resolveStripeModeForOrigin` in `create-metro-checkout` (staging Origin) and from
the verified `session.livemode`/`event.livemode` in `verify-metro-payment`/`metro-stripe-webhook`.
**The env var name and its owner-facing meaning are unchanged** — it's still "allow checkout
against an unconfirmed price book" — it just now can only ever do that for a staging/test-mode
request, never for a real customer on `mygravelguy.com`. A forgotten `METRO_CHECKOUT_ALLOW_UNCONFIRMED=true`
left set in the Supabase project's env is now inert for live traffic.

### Origin allowlist for redirect URLs

`create-metro-checkout`'s success/cancel URLs (`resolveMetroCheckoutOrigin`, `serverQuote.ts`) now
allowlist `STAGING_ORIGINS` in addition to the existing hardcoded origins and
`METRO_CHECKOUT_EXTRA_ORIGINS` — otherwise a staging checkout's Stripe redirect would silently fall
back to `https://mygravelguy.com` after payment instead of returning to staging.

### Test-mode order behavior

A session Stripe itself marks as test (`session.livemode === false` / `event.livemode === false`,
i.e. it went through Stripe **TEST mode**, meaning **no real charge ever occurred**) converts to an
`orders` row differently from a normal conversion (`supabase/functions/_shared/
metro-conversion-runner.ts`'s `convertMetroSession` / `sendMetroConversionNotifications`, plus
`buildMetroOrderRowFromMetadata` in `src/metro/checkout/conversion.ts`):

- **`status: 'test'`** — never `'authorized'`/`'paid'`, even though the underlying test
  PaymentIntent did reach `requires_capture`/`succeeded`. Keeps test rows structurally
  distinguishable from real orders in every downstream query (fulfillment dashboards, accounting
  exports, etc.) without needing to also filter on tags. An amount/price mismatch in test mode
  still routes to `'review_required'` (worth knowing about) rather than `'test'`.
- **`tags`**: `['metro', <metroSlug>, 'test']` instead of `['metro', <metroSlug>]` — the `'test'`
  tag is additive so metro/metroSlug-based dashboard filtering still works unchanged; filtering on
  `'test'` (or on `status = 'test'`, which is simpler and sufficient on its own) finds every test
  order.
- **`notes`** gets an extra `[TEST] Stripe test-mode checkout — not a real payment.` sentence.
- **Notifications**: both the customer confirmation email and the internal
  `order.support@mygravelguy.com` email still send (so the whole flow, including the email
  templates, can be verified end-to-end from staging) — every subject line gets a `[TEST] ` prefix
  (`sendMetroConversionNotifications`) so nobody mistakes one for a real order. The
  `review_required` internal alert and the G1 order-insert-failure alert
  (`sendMetroConversionErrorAlert`) get the same prefix when the underlying session was test-mode.
- The client response (`MetroVerifyResponse`, `src/metro/checkout/contract.ts`) gained `'test'` as
  a third possible value of the success variant's `status` field (`'authorized' | 'paid' | 'test'`)
  — `MetroOrderConfirmedPage.tsx` was not changed and needs no change: it only branches on
  `response.success`/`response.status === 'unpaid'`, never on the specific authorized/paid/test
  value, so a test-mode order already renders the normal success view.

### Cleanup SQL for test orders

Test orders are real rows in the shared **production** `orders` table (there is only one Supabase
project — see `docs/metro/STAGING.md` "Shared Supabase" risk) — periodically clean them out:

```sql
-- Preview what would be deleted:
select order_id, created_at, status, tags, total_price, delivery_email
from orders
where status = 'test'
order by created_at desc;

-- Delete:
delete from orders where status = 'test';
```

(`status = 'test'` alone is sufficient and simpler than also matching on `tags @> '{test}'` — every
row this pass ever writes with the `'test'` tag also has `status = 'test'`, by construction above.)

### Client staging banner

`src/metro/components/layout/MetroLayout.tsx` renders a small fixed "STAGING — Stripe test mode"
banner when `import.meta.env.VITE_STAGING === 'true'` — set only by the staging build (see
`docs/metro/STAGING.md`'s build args). Purely a visual reminder for testers; not a security
boundary (basic-auth + noindex at the proxy/HTML level are what keep staging away from real
customers/Google — see STAGING.md).

### What was deliberately NOT changed

`supabase/functions/verify-payment*`, `create-auth-hold*`, `src/pages/PaymentSuccess.tsx`,
`src/metro/lib/**`, `src/metro/config/**`, `src/metro/types.ts` — none of the live
`/cart → /checkout → /payment-success` flow, and none of the metro price-book/pricing-engine
internals, were touched by this pass. `stripe-mode.ts`'s existing exported API
(`parseOrigins`, `isStagingOrigin`, `resolveStripeModeForOrigin`, `resolveStripeModeForSessionId`)
is unchanged; only the new `resolveStripeModeForLivemode` export was added.

## 2026-09-28 redesign: metro is fully isolated from `verify-payment`

The original design below (§ "FOR A2 / CLIENT [ORIGINAL]", kept for history) had
`/payment-success` calling the live, shared `verify-payment` function to flip a `CART-METRO-…`
row to paid/authorized, via its existing `CART-` branch. That branch is **dead code on
production `main`** — a pre-existing, undeclared `paymentStatus` reference throws inside a
swallowed `try/catch` on every request, regardless of order prefix. Full trace, evidence, and
what the live system actually does instead:
**`docs/metro/research/verify-payment-paymentstatus-bug.md`**.

The orchestrator rejected patching `verify-payment` to fix this (too much blast radius on the
live `/cart` → `/checkout` → `/payment-success` flow — see that doc's §5 for exactly what would
change). Metro now has its **own, fully isolated** conversion path instead:

- `create-metro-checkout`'s `success_url` now points at `METRO_CONFIRMATION_PATH`
  (`/metro-order-confirmed`, `src/metro/checkout/contract.ts`) — a new client route (owned by
  agent A2v2) — instead of the shared `/payment-success`.
- That route calls a brand-new edge function, `verify-metro-payment`
  (`METRO_VERIFY_FUNCTION` in `contract.ts`), documented in full below. It never touches
  `verify-payment`, never touches `create-auth-hold`, and is not reachable by any non-metro
  order id. **Updated by the later hardening pass above:** `orderId` must match `^ORDER-METRO-`
  only today — the `^(CART|ORDER)-METRO-` form quoted here described the intermediate (v2)
  design, before the "no DB row before payment" hardening removed the `CART-` prefix entirely.
- `verify-payment/index.ts` itself is **completely untouched** — restored to exactly match
  `HEAD` (confirmed via `git diff HEAD -- supabase/functions/verify-payment/index.ts` = empty).
  This remains true today.

> **Superseded (v1 design).** Everything below this point, through the end of the "Manual test
> plan" and "Risks / open decisions" sections, documents the checkout design **before** the
> 2026-09-28 hardening pass (top of this doc) removed the pre-payment DB row. It's kept for
> history — mainly because the request/response *shapes*, the validation order, the `product_id`
> scheme, and the bundling mechanics it describes are all still accurate — but do **not** trust
> anything here that talks about: a `CART-METRO-` id/prefix, an `orders` row being inserted by
> `create-metro-checkout`, a `status='cart'` row being looked up and UPDATEd by
> `verify-metro-payment`, or `metro-stripe-webhook` as a "not built yet" follow-up. All four of
> those are contradicted by "## Current design (authoritative)" and the "2026-09-28 hardening
> pass" section at the top of this file, which reflect what the code actually does today. The
> sentence immediately below ("Everything below the `create-metro-checkout` 'Design' section...
> still accurate — only its `success_url` changed") is itself one of those superseded claims —
> the hardening pass changed far more than the `success_url` (removed the DB insert entirely,
> changed the order-id prefix, etc.); left in place, unedited, as an example of exactly the kind
> of stale claim this banner is warning about.

## FOR A2 / CLIENT [ORIGINAL — see redesign note above; `backupData`/`/payment-success` path is
no longer used by metro]

This section was written early per the working rules; A2 had already independently landed
`src/metro/services/metroCheckoutService.ts` by the time this was filled in, and it matches
everything below exactly (same `product_id` format, same backup item shape, same error-code
mapping) — cross-checked by reading that file. Nothing here should require a client-side change.

### Request

`POST` (via `supabase.functions.invoke('create-metro-checkout', { body })`) with a body matching
`MetroCheckoutRequest` in `src/metro/checkout/contract.ts` exactly — no fields were added.

### Response

- Success (200): `MetroCheckoutSuccess` — `{ url, session_id, order_id, serverQuote }`.
- Error (400/403/409/422/500): `MetroCheckoutError` — `{ error, code, serverQuote? }`. Because the
  function returns the real HTTP status for errors (not 200-with-error-body), `supabase-js`
  surfaces these as a `FunctionsHttpError`; read the body via `error.context.json()`.
- `serverQuote` is attached on `BELOW_MINIMUM` and `PRICE_CHANGED` as well as success, so the
  client can show the corrected price without a second round trip.

### ~~Minimum `backupData` shape for `/payment-success` → `verify-payment`~~ (superseded)

**No longer applicable to metro.** The paragraphs that used to be here described the
`backupData`/`localStorage` contract `/payment-success` and `verify-payment` needed. Metro no
longer redirects to `/payment-success` at all, so none of it applies — kept only in git history
for anyone auditing the original design. See "verify-metro-payment" below for the current
contract, which is a simple `{ sessionId, orderId }` POST with no `backupData`/localStorage
involved.

## Design

New edge function `supabase/functions/create-metro-checkout/index.ts` (Deno, `verify_jwt = false`,
guest checkout allowed same as `create-auth-hold`):

1. Optionally verify the JWT (guest allowed, same helper pattern as `create-auth-hold`/
   `verify-payment`).
2. Parse the JSON body and pass it to `buildServerQuote(request, new Date(), { allowUnconfirmed })`
   — the single source of truth for validation, zone/date/price lookup, and price-tolerance
   checking (`src/metro/checkout/serverQuote.ts`). `allowUnconfirmed` comes from
   `METRO_CHECKOUT_ALLOW_UNCONFIRMED === 'true'`.
3. On any non-ok result, return the mapped HTTP status with `{ error, code, serverQuote? }`.
4. **Superseded (v1 design) — see "Current design (authoritative)" at the top of this doc.** This
   step originally read: on ok, generate `orderId = generateMetroOrderId(now)` (`CART-METRO-
   <epoch-ms>-<rand>`), build the `orders` insert row via `buildMetroOrderRow(request, serverQuote,
   orderId)`, and **insert it before creating the Stripe session** (service-role client) —
   `verify-metro-payment` needs a `status='cart'` row with this exact `order_id` to find and
   convert after Stripe redirects back. **None of that is true anymore.** As of the hardening
   pass, `create-metro-checkout` performs **no DB write of any kind** — `orderId` is still
   generated here (`generateMetroOrderId(now)`), but in the `ORDER-METRO-<epoch-ms>-<rand>` form,
   and instead of an insert, the order is serialized into the Stripe Checkout Session's `metadata`
   via `buildMetroCheckoutMetadata` (`conversion.ts`). The row doesn't exist until
   `verify-metro-payment`/`metro-stripe-webhook` insert it, once, after payment is verified.
5. Resolve the redirect origin against an allowlist (`resolveMetroCheckoutOrigin`) and build a
   Stripe Checkout Session: `payment_intent_data.capture_method: 'manual'` (authorization hold,
   identical to `create-auth-hold`), `billing_address_collection: 'required'`, `customer_email`,
   three possible line items (delivered material at `basePrice`, Saturday fee, rush fee — each its
   own line so the Stripe Checkout page itself shows the fee breakdown), and `metadata` mirroring
   `create-auth-hold`'s keys (`orderId, userId, userEmail, isGuest, depositOption:'false',
   fullOrderAmount`) plus `source:'metro-checkout', metroSlug, zoneSlug, variantSlug,
   deliveryDate` — `source` and `orderId` in this metadata are what `verify-metro-payment`
   validates the Stripe session against before ever writing to the DB.
6. If Stripe session creation throws, best-effort delete the just-inserted cart row (so it can't
   later get emailed by `process-abandoned-carts` as an abandoned cart that was never actually
   offered to the customer) and return 500 `SERVER_ERROR`.
7. Return `{ url, session_id, order_id, serverQuote }`.

### What changed in `create-metro-checkout` for the redesign

Exactly one line: `success_url` now points at `${origin}/metro-order-confirmed?session_id=
{CHECKOUT_SESSION_ID}&order_id=${orderId}` instead of `${origin}/payment-success?...`. Everything
else in this function — validation, quoting, the DB insert, the Stripe session shape, the
cleanup-on-Stripe-failure behavior — is unchanged from the original design above.

Everything price/validation-related is pure TypeScript in `src/metro/checkout/serverQuote.ts`
(no I/O), reusing `src/metro/lib/pricing.ts` (`findZoneByZip`, `quote`, `getCategory`,
`getVariant`, `formatUnit`) and `src/metro/lib/dates.ts` (`getDeliveryDayOptions`) — the same
functions the client's `useMetroOrder.ts`/`computeQuote` calls, so server and client totals match
exactly for the same inputs (verified by the parity test, see below). The server **never** trusts
client-supplied `isSaturday`/`isRush` (the contract doesn't even have those fields on the
request) — both are derived purely from matching `deliveryDate` against
`getDeliveryDayOptions(metro, now)`.

### Validation order (`buildServerQuote`)

1. `validateRequest` — structural checks only (types/presence/formats; zero domain lookups) →
   `INVALID_INPUT` (400).
2. Metro exists (`getMetro(metroSlug)`) → `INVALID_INPUT` (400) if not — an unrecognized metro
   slug is a malformed request, not a "confirm this is your delivery area" situation.
3. `metro.priceBookConfirmed === false && !allowUnconfirmed` → `PRICE_BOOK_UNCONFIRMED` (403).
   Both DFW and Long Island are unconfirmed today, so **this feature ships dark** — the edge
   function can be deployed safely with zero customer-facing effect until an owner flips a price
   book to confirmed and/or explicitly sets the staging override.
4. Zone lookup by zip (`findZoneByZip`) → `OUT_OF_AREA` (422) if none.
5. Category/variant lookup → `INVALID_INPUT` (400) if either slug is unknown.
6. `deliveryDate` must exactly match one of `getDeliveryDayOptions(metro, now)` → `DATE_UNAVAILABLE`
   (422) otherwise. `isSaturday`/`isRush` are read off the matched day option, never the request.
7. `quote()` from `pricing.ts` computes the real total. `result.belowMinimum` →
   `BELOW_MINIMUM` (422), **with `serverQuote` attached** so the client can show the corrected
   minimum without guessing.
8. `|expectedTotal − server total| > METRO_PRICE_TOLERANCE` (0.01, from `contract.ts`) →
   `PRICE_CHANGED` (409), **with `serverQuote` attached**.
9. Otherwise `{ ok: true, quote: serverQuote }`. The Stripe amount is built **only** from this
   `serverQuote`, never from anything in the request.

## DB row mapping (`buildMetroOrderRow`) — Superseded (v1 design)

**This whole table describes the pre-hardening `buildMetroOrderRow` function, which no longer
exists.** The current row-building function is `buildMetroOrderRowFromMetadata` in
`src/metro/checkout/conversion.ts` (called post-payment, from `metro-conversion-runner.ts`) — same
`product_id`/`material_slug`/`market_slug` scheme (see "`product_id` decision" below, still
accurate), but `order_id` is always the final `ORDER-METRO-` id (never `CART-METRO-`), `status` is
always `'authorized' | 'paid' | 'review_required'` (never `'cart'` — there is no cart stage
anymore), and `stripe_session_id`/`stripe_payment_intent_id` are populated on insert (this table
never had those columns, since the v1 design only learned them later, at conversion time). The
table below is left as originally written for historical reference:

| `orders` column | Value |
|---|---|
| `order_id` | `CART-METRO-<epoch-ms>-<rand>` |
| `status` | `'cart'` |
| `product_id` | `` `metro:${metroSlug}:${categorySlug}:${variantSlug}` `` — see product_id decision below |
| `material_slug` | `` `${categorySlug}/${variantSlug}` `` (no metro prefix — this is the per-material grouping column; `market_slug` carries the metro) |
| `market_slug` | `metroSlug` |
| `unit`, `unit_price`, `base_price`, `total_price`, `quantity`, `delivery_date` | from `serverQuote` |
| `delivery_street/city/state/zip/name/phone/email` | from `request.address`/`request.contact` (`city` → `null` when absent — the client currently never sends it) |
| `delivery_instructions` | `request.dropNotes ?? null` |
| `notes` | Human-readable summary: zone name+slug, truck plan, Saturday/rush fee lines (only if >0), and a literal `"metro-checkout v1."` tag for grep-ability |
| `saturday_fee_amount`, `expedite_fee_amount` | `serverQuote.saturdayFee`, `serverQuote.rushFee` |
| `tags` | `['metro', metroSlug]` |
| `billing_name`, `billing_email` | `request.contact.name`, `request.contact.email` |
| `gclid, gbraid, wbraid, utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page_url, referrer, user_agent` | from `request.utmData`, each `?? null` (mirrors `verify-payment`'s own UTM-application pattern) |

`created_at`/`updated_at` are left unset (DB default), same as every other Insert path in this
codebase that doesn't explicitly stamp them.

### `product_id` decision — was it an FK blocker?

**No.** Read every migration touching `product_id` plus the generated `src/integrations/
supabase/types.ts`. The `orders` table's `product_id` column has **no foreign-key constraint** —
confirmed two ways:
- `types.ts`'s `orders` table entry lists `Relationships: []`.
- The two `product_id UUID REFERENCES products(id)` FKs that do exist in migrations
  (`20260201173903_…`, `20260206070534_…`) belong to unrelated tables (`market_materials`,
  `supplier_quotes`), not `orders`.
- `orders.product_id` is typed `string` (required, no FK), and existing non-metro rows already use
  free-text human slugs (e.g. `"gravel-gray-34"`, see `src/services/reviewService.ts` sample data).

So `product_id` is free text. Chose `` `metro:${metroSlug}:${categorySlug}:${variantSlug}` `` — a
metro-prefixed compound slug so these rows are unambiguous and can never collide with the legacy
product catalog. `material_slug` carries the shorter `<category>/<variant>` form for per-material
dashboard grouping independent of metro.

### Other DB-safety checks performed (all clear)

- **No CHECK constraint** on `orders.status` anywhere in `supabase/migrations/` — `'cart'` is
  already the value both `verify-payment` and `process-abandoned-carts` query against.
- **No triggers** on `public.orders` at all (`grep -rn "ON public.orders" supabase/migrations/`
  returns nothing) — so no trigger can reject/mutate this insert.
- `enforce_market_material_slug_immutability` (the trigger named in the brief) is on
  `public.market_materials`, **not** `orders` — irrelevant to this insert.
- `process-abandoned-carts` (`supabase/functions/process-abandoned-carts/index.ts`) queries any
  `status='cart'` row with a non-null `delivery_email` older than 1 hour, regardless of
  `order_id` prefix. Metro cart rows **will** be picked up and get the same 3-email abandoned-cart
  sequence as any other cart — this is desirable/expected (recovers abandoned metro carts too),
  not a bug, and needs no changes there.

## `verify-payment`: was it changed?

**No.** `supabase/functions/verify-payment/index.ts` is byte-for-byte identical to `HEAD` —
confirmed via `git diff HEAD -- supabase/functions/verify-payment/index.ts` (empty). A prior
draft of this work patched it (aliasing `orderStatus` to the undeclared `paymentStatus` it reads
at three call sites); the orchestrator rejected that patch specifically because of its blast
radius on the live `/cart` → `/checkout` → `/payment-success` flow (it would have swapped which
code path handles every live order — see `docs/metro/research/verify-payment-
paymentstatus-bug.md` §5 for the full consequence analysis). That bug is real, pre-existing on
production `main`, and completely independent of metro — full trace, evidence for what the live
site actually does today despite it, and recommendations are all in that doc. Metro works around
it entirely instead of fixing it: see `verify-metro-payment` below.

## `verify-metro-payment` — the new, isolated conversion function

`supabase/functions/verify-metro-payment/index.ts` (Deno, `verify_jwt = false`). **Summary
corrected — the original sentence here ("Converts a `CART-METRO-…` row to `ORDER-METRO-…` +
`authorized`/`paid` status") described the superseded v2 design; see "### Flow" below for the
same correction in detail.** As of the current design: re-derives the order from a verified
Stripe Checkout Session's `metadata` and inserts exactly one `orders` row, idempotently
(`authorized`/`paid`/`review_required` status), with no dependency on `verify-payment` or
`create-auth-hold`. Shares its conversion logic with `metro-stripe-webhook` via
`supabase/functions/_shared/metro-conversion-runner.ts`.

### Request / response contract (`src/metro/checkout/contract.ts`)

- `MetroVerifyRequest = { sessionId: string; orderId: string }`. **STALE as of the v3 redesign
  above (G4, docs/metro/research/metro-checkout-rereview.md):** this paragraph originally
  described the v2 (`CART-METRO-…` staging row) design, where `orderId` could legitimately arrive
  in either `CART-METRO-…` or `ORDER-METRO-…` form. As of the "2026-09-28 redesign" section at the
  top of this file, there is no more `CART-` staging id at all — `create-metro-checkout` generates
  the final `ORDER-METRO-…` id once, up front, and that's the only id ever in play. `orderId` must
  now match `^ORDER-METRO-(.+)$` (`METRO_ORDER_ID_RE` in `src/metro/checkout/verifyLogic.ts`);
  anything else (including a stale cached `CART-METRO-…` id from a pre-redesign browser session)
  is rejected as `invalid` (400) — see `validateVerifyRequest`'s doc comment in that file.
- `MetroVerifyResponse` — success: `{ success: true, orderId, status: 'authorized' | 'paid',
  alreadyProcessed: boolean, order: MetroConfirmedOrder }`; error: `{ success: false, status:
  'unpaid' | 'invalid' | 'mismatch' | 'not_found' | 'error', error: string }`.
- `MetroConfirmedOrder` carries everything the confirmation page needs to render without a second
  round trip: `orderId, metroSlug, variantName, quantity, unit, total, deliveryDate,
  deliveryStreet, deliveryCity?, deliveryState, deliveryZip, zoneName?, truckPlan?,
  customerEmail`, plus (G3 fix, `docs/metro/research/metro-checkout-rereview.md`) optional
  `customerName?`/`customerPhone?`, sourced from `row.delivery_name`/`row.billing_name` and
  `row.delivery_phone` and fed to Google Ads Enhanced Conversions by
  `src/metro/services/metroPurchaseTracking.ts`. `variantName` is resolved from the metro
  price-book config via `market_slug` + `material_slug` (not stored verbatim on the row);
  `zoneName`/`truckPlan` are parsed back out of the `notes` column `buildMetroOrderRowFromMetadata`
  (`conversion.ts` — supersedes the old `buildMetroOrderRow` named further down this doc) writes
  in a deterministic format.
- HTTP status per response (`httpStatusForResponse` in `verifyLogic.ts`): success → 200,
  `invalid` → 400, `not_found` → 404, `mismatch` → 409, `unpaid` → 200 (a normal, expected state
  — not an error), `error` → 500.
- The response body also always includes a `notifications` field (not in the typed contract,
  additive/informational only): `{ customerEmail: boolean, internalEmail: boolean }` on a first
  conversion, or `null` when `alreadyProcessed: true` (no notifications sent on repeat calls).

### Flow — Superseded (v1/v2 design)

**The numbered steps below describe the pre-hardening flow, where `verify-metro-payment` looked
up an existing `CART-METRO-` row and UPDATEd it.** That row no longer exists to look up — the
current flow is the "v3 flow" sequence diagram + bullet list in the "2026-09-28 hardening pass"
section at the top of this doc (session validate → payment-status map → idempotency check by
`order_id` → parse metadata → re-quote at session-creation time → amount/price check → **INSERT**
the row → insert-race resolution), implemented in `convertMetroSession`
(`supabase/functions/_shared/metro-conversion-runner.ts`) and called identically by both
`verify-metro-payment` and `metro-stripe-webhook`. Left as originally written below for history:

1. Validate the request shape (`validateVerifyRequest`) — `orderId` must match
   `^(CART|ORDER)-METRO-`, `sessionId` must be a non-empty string.
2. `stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })` — same Stripe
   version/import as `create-auth-hold`/`verify-payment` (`stripe@14.21.0` via esm.sh, apiVersion
   `2023-10-16`, `Deno.env.get("stripe")` secret).
3. `validateSession` — the session's `metadata.source` must be `'metro-checkout'` and
   `metadata.orderId` must equal the CART- form of the requested order id. This is what stops the
   endpoint from being usable to "verify" an arbitrary Stripe session against an arbitrary metro
   order id.
4. `mapPaymentIntentStatus` reads the **PaymentIntent's** status (never the Checkout Session's own
   `status`/`payment_status`, which read `'complete'`/`'paid'` even for a manual-capture
   authorization hold that hasn't been charged): `requires_capture` → `'authorized'`, `succeeded`
   → `'paid'`, anything else → `'unpaid'` (returned immediately, 200, no DB changes — the customer
   just hasn't finished paying yet, e.g. the confirmation page loaded before Stripe's own redirect
   fully settled).
5. Look up the `CART-METRO-…` row (`status = 'cart'`). If found: check `amountMatches(session.
   amount_total, row.total_price)` (cents vs. `round(dollars * 100)`). On mismatch, best-effort
   append a note to the row (`buildMismatchNote` — appends, never overwrites the zone/truck-plan
   notes the confirmation page's display parser depends on) and return `mismatch` (409) — **the
   row is never converted on a mismatch**, so nothing is marked paid at the wrong price.
6. On a matching amount: idempotent conversion — `UPDATE orders SET status = <status>, order_id =
   'ORDER-METRO-…', stripe_session_id, stripe_payment_intent_id, updated_at WHERE order_id =
   'CART-METRO-…' AND status = 'cart' RETURNING *`. If a row comes back, this is the first
   successful conversion: fire notifications (below), then return `{ success: true,
   alreadyProcessed: false, ... }`.
7. If the update affected 0 rows (a concurrent request already converted it between the SELECT in
   step 5 and this UPDATE), or if no `CART-` row was found at all in step 5 (a repeat call after
   conversion already happened — the normal case for a page reload on `/metro-order-confirmed`),
   look up the `ORDER-METRO-…` row directly. Found → return it with `alreadyProcessed: true` and
   **no notifications**. Not found at all → `not_found` (404).

### Notifications (only on first conversion)

Traced what the live checkout flow actually sends for a new paid order
(`src/pages/PaymentSuccess.tsx`'s `handleDatabaseInsert` → `handleEmailSending` →
`sendBothOrderEmails`, `src/services/emailService.ts`) so metro's server-side equivalent matches:
two `supabase.functions.invoke('send-email', ...)` calls with the service-role client — a
customer order-confirmation email and an internal notification to
`order.support@mygravelguy.com` — reusing the existing `send-email` function (no new email
function created). Skipped (with `customerEmail: false, internalEmail: false, skipped:
'no_customer_email'`) if the row somehow has no email on it. Both sends run via
`Promise.allSettled` and failures are logged + reflected in the response's `notifications` field
but **never fail the verification response itself** — a customer whose payment succeeded always
gets a success response even if Resend is down.

Two things the live flow does that are intentionally **not** duplicated here:
- **SMS** — `src/hooks/useOrderSMS.ts`'s `send-order-sms` invocation is wired to a manually
  triggered admin UI button elsewhere in the app, not to any automatic post-payment flow. There is
  no automatic SMS to duplicate.
- **GA4 / Google Ads purchase tracking** — client-side only in the live flow
  (`handleDatabaseInsert`'s `window.gtag('event', 'purchase', ...)` +
  `trackGoogleAdsConversion`). This edge function has no browser to fire that in; A2v2's
  `/metro-order-confirmed` page fires the metro equivalent
  (`src/metro/services/metroPurchaseTracking.ts`) client-side once it has this function's
  response, same dedup-by-localStorage-key pattern the live flow uses.

### Pure logic (`src/metro/checkout/verifyLogic.ts`, bundled)

Every decision above — request validation, session validation, status mapping, amount check,
the conversion-update payload shape, notes parsing, and response/HTTP-status shaping — is pure,
I/O-free TypeScript in `verifyLogic.ts`, unit tested in `verifyLogic.test.ts` (46 tests; the
current suite tests request validation against the live `^ORDER-METRO-(.+)$` regex — a bare
`CART-METRO-` id is now rejected as `invalid`, not normalized, correcting the "CART-/ORDER-
normalization" phrasing this line used before the hardening pass — plus rejection of non-metro/
QUOTE- ids, session validation incl. source/orderId mismatch, PaymentIntent status mapping for
every status value,
row-status round-tripping for the alreadyProcessed path, amount matching incl. floating-point
rounding hazards, mismatch-note append-not-replace behavior, the conversion-update payload,
notes parsing incl. fee lines in between and unparseable input, `buildConfirmedOrder`'s
metro-config resolution and its fallback when the metro/variant can't be resolved, and the full
success/error/HTTP-status matrix). The edge function (`verify-metro-payment/index.ts`) is a thin
I/O shell around it: Stripe retrieve, two Supabase reads, one Supabase update, two
`functions.invoke` calls.

## Bundling for Deno

`scripts/metro/export-metro-checkout-bundle.mjs` uses esbuild (already a transitive Vite
dependency — no new package added, same approach as `scripts/metro/export-price-book.mjs`) to
bundle `src/metro/checkout/bundleEntry.ts` — a small entry file that (as of the hardening pass)
does `export * from './serverQuote'; export * from './verifyLogic'; export * from './conversion';
export * from './emailTemplates';`, since esbuild's `outfile` mode only supports one entry point
and `create-metro-checkout`, `verify-metro-payment`, `metro-stripe-webhook`, and
`metro-conversion-runner.ts` all need to import named exports from the same single checked-in
file — (+ transitive `src/metro/**` imports, including `contract.ts`'s constants) into
`supabase/functions/_shared/metro-checkout.bundle.js` — a generated, checked-in ESM file with a
header comment. `platform: 'neutral'` (not `'node'`, unlike `export-price-book.mjs`) since this
bundle is actually imported by Deno functions at runtime (not just executed once inside the Node
build script) and the source has zero Node-specific APIs. The one non-relative-import exception in
`serverQuote.ts`/`verifyLogic.ts` — `import type {
Database } from '../../integrations/supabase/types'` — is a **type-only** import, erased entirely
by esbuild's TS transform, so it never reaches the bundle (verified: `grep "integrations/supabase"
metro-checkout.bundle.js` → no match).

**G2 fix — a real `.d.ts` alongside the bundle** (`docs/metro/research/metro-checkout-
rereview.md`). The same script now also emits `supabase/functions/_shared/
metro-checkout.bundle.d.ts`, generated from the real TypeScript compiler (`tsc
--emitDeclarationOnly` over `bundleEntry.ts`'s dependency graph, not hand-duplicated types) so the
declarations are guaranteed to match source. `metro-conversion-runner.ts` references it with a
`// @deno-types="./metro-checkout.bundle.d.ts"` comment immediately above its `import { ... } from
"./metro-checkout.bundle.js"` line — the Deno-standard way to attach a separate declaration file
to a `.js` import — so `MetroOrderEmailData`, `MetroServerQuote`, `MinimalStripeSession`,
`ParsedMetroCheckout`, and `MetroOrderErrorAlertData` all resolve under `deno check`/`tsc` instead
of erroring "no exported member".

**Re-run `node scripts/metro/export-metro-checkout-bundle.mjs`** any time `serverQuote.ts`,
`verifyLogic.ts`, `conversion.ts`, `emailTemplates.ts`, or anything under `src/metro/**` either
imports changes, before `supabase functions deploy create-metro-checkout verify-metro-payment
metro-stripe-webhook`. `src/metro/checkout/bundleParity.test.ts` fails with a "re-run the export
script" message if the checked-in bundle drifts from source for `serverQuote.ts`'s exports (it
re-runs `buildServerQuote`/`buildMetroOrderRowFromMetadata` — the current function name;
supersedes the old `buildMetroOrderRow` referenced elsewhere in this doc's superseded sections —
from both the source module and the generated bundle for every metro × zone × variant at 3
quantities each — 424 comparisons — and asserts identical output). `verifyLogic.ts`
is pure and I/O-free with no external state to drift on (no config/date dependency the way
`serverQuote.ts` has), so it doesn't have a separate parity suite — its own 46-test unit suite
runs directly against the source module, and the bundle exports are proven to exist by
`verify-metro-payment/index.ts` importing them (a TypeScript/Deno compile-time check, effectively,
the next time the function is deployed or type-checked).

## Env vars

This table predates `metro-stripe-webhook` and only lists `create-metro-checkout`/
`verify-metro-payment` — see the "Env vars (v3 additions)" table in the "2026-09-28 hardening
pass" section at the top of this doc for `STRIPE_METRO_WEBHOOK_SECRET`, required by
`metro-stripe-webhook`. Otherwise still accurate:

| Var | Purpose | Default | Used by |
|---|---|---|---|
| `stripe` | Stripe secret key (same name `create-auth-hold` uses) | required | both |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | standard | required | both |
| `SUPABASE_ANON_KEY` | standard (optional-JWT verification) | required | `create-metro-checkout` |
| `METRO_CHECKOUT_ALLOW_UNCONFIRMED` | set `'true'` to bypass the `PRICE_BOOK_UNCONFIRMED` gate for owner staging tests against an unconfirmed price book | unset/false | `create-metro-checkout` |
| `METRO_CHECKOUT_EXTRA_ORIGINS` | comma-separated extra allowed origins for the Stripe success/cancel redirect (beyond `https://mygravelguy.com`, `https://www.mygravelguy.com`, `http://localhost:8080`) | unset | `create-metro-checkout` |
| `RESEND_API_KEY` | already required by the existing `send-email` function, which `verify-metro-payment` invokes — no new secret needed | required (pre-existing) | `send-email` (invoked by `verify-metro-payment`) |

No new secrets are introduced by `verify-metro-payment` — it reuses `stripe` and the standard
Supabase service-role credentials, and calls the existing `send-email` function rather than
talking to Resend directly.

## Owner deploy steps

**Updated for the hardening pass** — step 2 below originally listed only two functions; deploy
must now include `metro-stripe-webhook` too (see "Owner steps: Stripe dashboard webhook setup" at
the top of this doc for the full webhook-registration procedure, which this list doesn't repeat).

1. `node scripts/metro/export-metro-checkout-bundle.mjs` (regenerates both
   `metro-checkout.bundle.js` and, as of G2, `metro-checkout.bundle.d.ts`; already checked in as
   of this change, but re-run if `src/metro/checkout/**` changed since).
2. `supabase functions deploy create-metro-checkout verify-metro-payment metro-stripe-webhook`
   (`config.toml` already has `[functions.create-metro-checkout]`,
   `[functions.verify-metro-payment]`, and `[functions.metro-stripe-webhook]`, all
   `verify_jwt = false`).
3. Set secrets if not already set at the project level: `stripe` and `RESEND_API_KEY` should
   already exist (shared with `create-auth-hold` / `send-email`); `STRIPE_METRO_WEBHOOK_SECRET`
   is new (see the webhook setup steps at the top of this doc). Optionally set
   `METRO_CHECKOUT_ALLOW_UNCONFIRMED=true` and/or `METRO_CHECKOUT_EXTRA_ORIGINS` for staging.
4. **`verify-payment` does NOT need to be redeployed** — it was never touched. (This corrects the
   prior draft of this doc, which asked the owner to redeploy it with a fix that was
   subsequently rejected.)
5. A2v2's new `/metro-order-confirmed` client route must ship in the same deploy as these
   functions — `create-metro-checkout`'s `success_url` now points there unconditionally (though
   the feature is still gated dark by `priceBookConfirmed`, so this is low-risk either way).
6. Feature stays dark until an owner sets a metro's `priceBookConfirmed: true` in
   `src/metro/config/*.ts` (a source change, not a deploy step) — both DFW and Long Island are
   `false` today.

## Manual test plan (Stripe TEST mode only — never against production)

**Corrected for the current design** — the numbered steps below originally assumed the
pre-hardening `CART-METRO-` row-then-convert flow (they were written before the "no DB row
before payment" change); they're corrected in place here to match what the code actually does
today, and combine with steps 12–14 in "TEST-mode plan additions" (top of this doc) for full
coverage of the dual page/webhook conversion paths.

1. In a local/staging Supabase project (never production), set `METRO_CHECKOUT_ALLOW_UNCONFIRMED=
   true` and use a Stripe **test-mode** secret key for `stripe`. Deploy or run all three functions
   (`create-metro-checkout`, `verify-metro-payment`, `metro-stripe-webhook`).
2. `curl -X POST https://<project>.functions.supabase.co/create-metro-checkout -H "content-type:
   application/json" -d '{...}'` with a valid DFW request (see Request/response examples below).
   Confirm: 200, `url` starts with `https://checkout.stripe.com/`, `order_id` starts with
   `ORDER-METRO-`, `serverQuote.total` matches a hand-computed price.
3. Check the Supabase `orders` table: **no row exists yet** for that `order_id` — this is the
   whole point of the hardening pass (no DB row before payment). The order lives only in the
   Stripe Checkout Session's `metadata` at this point.
4. Complete the Stripe test checkout with `4242 4242 4242 4242`. Confirm redirect to
   `/metro-order-confirmed?session_id=cs_test_...&order_id=ORDER-METRO-...`.
5. Call `verify-metro-payment` directly (or via the confirmation page): `{ sessionId:
   "cs_test_...", orderId: "ORDER-METRO-..." }`. Confirm: `success: true`, `status: 'authorized'`
   (manual capture, not yet charged), `alreadyProcessed: false`, `notifications: { customerEmail:
   true, internalEmail: true }`, and in the DB: a row now exists with that `order_id`, `status` is
   `'authorized'`, `stripe_payment_intent_id`/`stripe_session_id` populated — this is the **first**
   time the row is created, not a status flip on a pre-existing row.
6. Call `verify-metro-payment` again with the same `sessionId`/`orderId` (simulate a page reload).
   Confirm: `success: true`, `alreadyProcessed: true`, `notifications: null`, and that no second
   confirmation/internal email was sent (check Resend logs or inbox counts).
7. Amount/price-mismatch test: after `create-metro-checkout` returns a session (don't pay yet),
   edit a variant's `nodePricePerUnit` in the relevant `src/metro/config/*.ts` file (local/staging
   only) so re-quoting at conversion time no longer matches the session metadata's `serverTotal`,
   then complete payment and call `verify-metro-payment`. Confirm: `success: false, status:
   'mismatch'` (409), and in the DB a row **is** inserted with `status: 'review_required'` and a
   `notes` column containing `[REVIEW REQUIRED]` plus the mismatch reason — only the internal
   review-alert email is sent, never the customer confirmation (this replaces the old plan, where
   a pre-existing cart row's `total_price` was hand-edited; that row no longer exists to edit).
8. Session/order mismatch test: call `verify-metro-payment` with a valid `sessionId` from a
   *different* metro order's checkout but this order's `orderId`. Confirm `success: false, status:
   'invalid'` (400), no DB changes.
9. Unpaid test: call `verify-metro-payment` immediately after `create-metro-checkout` (before ever
   completing the Stripe page). Confirm `success: false, status: 'unpaid'` (200), no DB changes.
10. Negative cases on `create-metro-checkout` itself (unchanged from the original design): submit
    with a stale/wrong `expectedTotal` → expect 409 `PRICE_CHANGED` with a `serverQuote`; submit a
    ZIP outside any zone → 422 `OUT_OF_AREA`; submit a `deliveryDate` not in the current day list →
    422 `DATE_UNAVAILABLE`; unset `METRO_CHECKOUT_ALLOW_UNCONFIRMED` and resubmit → 403
    `PRICE_BOOK_UNCONFIRMED`.
11. Cancel from Stripe → confirm redirect to `cancelPath` and that **no `orders` row was ever
    created** (unlike the old plan, which expected a `cart` row to persist for
    `process-abandoned-carts` to pick up later — under the current design there's nothing for
    `create-metro-checkout` to have inserted, so an abandoned/canceled metro checkout now leaves
    zero DB trace and can never trigger an abandoned-cart email/SMS to an unverified address; see
    the "Current design (authoritative)" summary at the top of this doc).

### Request/response examples

Request:
```json
{
  "metroSlug": "dallas-fort-worth",
  "zip": "75201",
  "categorySlug": "gravel",
  "variantSlug": "pea-gravel",
  "quantity": 10,
  "deliveryDate": "2026-10-05",
  "contact": { "name": "Jane Doe", "email": "jane@example.com", "mobile": "2145551234" },
  "address": { "street": "123 Main St", "state": "TX", "zip": "75201" },
  "expectedTotal": 312.5,
  "cancelPath": "/dallas-fort-worth"
}
```

Success (200) — `order_id` corrected below to the current `ORDER-METRO-` form (this example
originally showed `CART-METRO-`, the superseded v1/v2 prefix):
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_...",
  "order_id": "ORDER-METRO-1735689600000-a1b2c3",
  "serverQuote": {
    "metroSlug": "dallas-fort-worth", "zoneSlug": "dfw-core", "zoneName": "Core",
    "categorySlug": "gravel", "variantSlug": "pea-gravel", "variantName": "Pea Gravel (3/8\")",
    "unit": "ton", "quantity": 10, "deliveryDate": "2026-10-05",
    "isSaturday": false, "isRush": false, "truckPlan": "10 tons (Large dump)",
    "basePrice": 312.5, "saturdayFee": 0, "rushFee": 0, "total": 312.5, "pricePerUnit": 31.25
  }
}
```

Price-changed error (409):
```json
{ "error": "The price for this order has changed. Please review the updated total.",
  "code": "PRICE_CHANGED", "serverQuote": { "...": "same shape as above, current total" } }
```

### `verify-metro-payment` request/response examples

Request — `orderId` corrected below to the current `ORDER-METRO-` form (this example originally
showed `CART-METRO-`; `create-metro-checkout` now returns the final `ORDER-METRO-` id from its
very first response, so that's the only id the client ever has to send here):
```json
{ "sessionId": "cs_test_...", "orderId": "ORDER-METRO-1735689600000-a1b2c3" }
```

Success — first conversion (200):
```json
{
  "success": true,
  "orderId": "ORDER-METRO-1735689600000-a1b2c3",
  "status": "authorized",
  "alreadyProcessed": false,
  "order": {
    "orderId": "ORDER-METRO-1735689600000-a1b2c3",
    "metroSlug": "dallas-fort-worth",
    "variantName": "Pea Gravel (3/8\")",
    "quantity": 10, "unit": "ton", "total": 312.5,
    "deliveryDate": "2026-10-05",
    "deliveryStreet": "123 Main St", "deliveryCity": "Dallas",
    "deliveryState": "TX", "deliveryZip": "75201",
    "zoneName": "Core", "truckPlan": "10 tons (Large dump)",
    "customerEmail": "jane@example.com"
  },
  "notifications": { "customerEmail": true, "internalEmail": true }
}
```

Success — repeat call after conversion (200, `alreadyProcessed: true`, no notifications resent):
```json
{ "success": true, "orderId": "ORDER-METRO-...", "status": "authorized",
  "alreadyProcessed": true, "order": { "...": "same shape" }, "notifications": null }
```

Amount mismatch (409):
```json
{ "success": false, "status": "mismatch",
  "error": "The charged amount does not match this order's total. Please contact support." }
```

Not yet paid (200 — expected/normal, not an error):
```json
{ "success": false, "status": "unpaid", "error": "Payment has not completed yet." }
```

## Risks / open decisions

- **`verify-payment` was NOT touched** — see the redesign note at the top of this doc and
  `docs/metro/research/verify-payment-paymentstatus-bug.md` for the bug it has, why it was left
  alone, and what the live site actually does instead. Nothing about deploying metro requires any
  change to that function.
- Feature is gated fully dark (`priceBookConfirmed: false` for both metros) — safe to deploy
  `create-metro-checkout`, `verify-metro-payment`, and `metro-stripe-webhook` at any time with
  zero live effect until an owner flips that flag.
- Line-item design choice: 1–3 Stripe line items (material, Saturday fee, rush fee) rather than a
  single combined line, so the Stripe Checkout page itself shows the fee breakdown. If the owner
  would rather show one line, that's a one-line change in `create-metro-checkout/index.ts`'s
  `lineItems` construction — documented here so it's easy to revisit without re-deriving the
  design.
- Did not touch `create-auth-hold` at all, per instructions.
- Origin allowlist: unrecognized `Origin` headers fall back to `https://mygravelguy.com` rather
  than erroring, to avoid ever building an open-redirect URL; `METRO_CHECKOUT_EXTRA_ORIGINS` is
  the owner's escape hatch for a staging domain.
- **Superseded by the hardening pass — both gaps below are now closed.** This bullet originally
  flagged two gaps: (1) unpaid abandoned metro carts staying `status='cart'` and getting the
  standard 3-email `process-abandoned-carts` sequence (intended, same as any other abandoned
  cart), and (2) a customer who pays but closes the tab before `/metro-order-confirmed` finishes
  calling `verify-metro-payment` staying stuck at `status='cart'` despite having paid, with the
  recommended follow-up being a not-yet-built `metro-stripe-webhook` function. **Both are now
  resolved by the current design**: gap (1) no longer applies to metro at all — `create-metro-
  checkout` never inserts a `cart` row in the first place (see "Current design (authoritative)"
  at the top of this doc), so there's nothing for `process-abandoned-carts` to pick up. Gap (2) is
  exactly what `metro-stripe-webhook` (`supabase/functions/metro-stripe-webhook/index.ts`) was
  built to close — it's live today, not a future recommendation, and converts the order
  independently of whether the customer's own browser ever calls `verify-metro-payment`.
- **Superseded.** This bullet originally read: "`verify-metro-payment`'s amount check compares
  against the CART- row's `total_price`, which `create-metro-checkout` already re-derived from the
  price book server-side... so a mismatch here would mean something changed the row between insert
  and payment." There is no more CART- row to compare against — the current amount/price check
  (`evaluateAmountAndPrice` in `conversion.ts`) compares the verified Stripe session's
  `amount_total` against the session `metadata`'s `serverTotal` (both fixed at
  `create-metro-checkout` time) AND a fresh re-quote computed at the session's `created`
  timestamp, so a mismatch now means either the price book changed between checkout and payment,
  or a genuine Stripe-side discrepancy — not a stale-DB-row race, since there's no row until after
  this check passes.
