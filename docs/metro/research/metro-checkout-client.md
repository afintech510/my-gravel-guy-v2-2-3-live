# Metro checkout — client side

Status: DONE (isolated design, agent A2v2-METRO-CONFIRM-CLIENT). Supersedes the original
A2-CHECKOUT-CLIENT design below, which piggybacked on the live `/payment-success` +
`verify-payment` pipeline. Per an orchestrator decision, metro checkout is now **fully
isolated** from that live pipeline: `verify-payment` has a latent, undeclared-`paymentStatus`
bug on `main`, and live orders are finalized there via `PaymentSuccess.tsx`'s own
client-side fallback-insert behavior — reusing any of that for metro risked regressing real,
paying customers. Metro now has its own confirmation page and its own edge function
(`verify-metro-payment`, owned by agent A1v2 — see `metro-checkout-server.md`), and touches
zero lines of `PaymentSuccess.tsx` or `verify-payment`.

`npx vitest run src/metro src/pages/metro` — **596/596 passing**. `npx tsc --noEmit -p
tsconfig.app.json` — zero new errors in any file this agent touched (pre-existing errors in
unrelated legacy pages — `OrderDetailModal.tsx`, `DeliveryConfirm.tsx`,
`MarketMaterialPage.tsx`, `CrushedStoneLanding.tsx` — are untouched/unowned). `npx eslint` on
every touched file — zero errors/warnings.

## The isolated design

1. **`create-metro-checkout`'s `success_url`** (owned by A1v2, server-side) now points at
   `METRO_CONFIRMATION_PATH` (`/metro-order-confirmed`) with `?session_id={CHECKOUT_SESSION_ID}
   &order_id=CART-METRO-…`, not `/payment-success`.
2. **`src/pages/metro/MetroOrderConfirmedPage.tsx`** (new, this agent's) is the *only*
   finalization page for a metro order. On mount it reads `session_id` + `order_id` from the
   query string and calls `supabase.functions.invoke(METRO_VERIFY_FUNCTION, { body: {
   sessionId, orderId } })` — `METRO_VERIFY_FUNCTION` resolves to `verify-metro-payment`,
   **never** `verify-payment`. The call is guarded against React StrictMode's dev-mode
   double-invoke via a `useRef` flag that's set synchronously before the async call starts
   (the ref survives the mount/cleanup/remount cycle since the underlying component instance
   is never actually unmounted).
   - Handles both response shapes per `MetroVerifyResponse` (`src/metro/checkout/contract.ts`):
     a plain `{ data }` with `success: false` (still a 2xx), and a non-2xx `FunctionsHttpError`
     whose JSON body (`error.context.json()`) is parsed and handled identically — the
     customer never sees a difference, and raw error text/codes are never rendered.
   - States: `verifying` (spinner) → `success` (order summary: material, quantity, delivered
     total, delivery date, delivery address, the same authorization-hold wording as
     `DetailsStep.tsx`/the live `/checkout` page: *"Your card is authorized for $X. You will
     NOT be charged until your delivery is confirmed — the final charge only happens after
     that."*; a "what happens next" 3-step block; a contact block with the metro's phone
     number), `unpaid` (reassuring copy + a "Back to your order" link), or a generic `error`
     state (covers `invalid` / `mismatch` / `not_found` / `error` from the server, a network
     failure, an unparsable error body, or missing `session_id`/`order_id` query params) —
     always a fixed, reassuring message + contact phone/email + the order id as a reference,
     **never** the server's raw error string.
   - On `success`, fires `trackMetroPurchaseConversion(orderId, [row])` from
     `metroPurchaseTracking.ts` with `transaction_id` = the response's `orderId` (the
     `ORDER-METRO-…` id, post-flip) and `value` = the server's own `order.total`.
     `trackMetroPurchaseConversion` has its own internal
     `mgg_purchase_fired_<orderId>` localStorage dedupe guard (pre-existing, unchanged) —
     the page always calls it on `success` regardless of the response's `alreadyProcessed`
     flag, and relies on that guard (not `alreadyProcessed`) to prevent a double-fire on a
     page refresh or a second `success` response for the same order. Clears the pending
     -checkout localStorage record (below) once `success` is reached.
   - Resolves a full `Metro` object (for `MetroLayout`, so the page gets the same
     header/footer/phone number as the rest of the metro site) from `METROS` by slug — the
     slug comes from the verify response's `order.metroSlug` once available, or from the
     pending-checkout record's `serverQuote.metroSlug` before/if that response never arrives.
     If no metro can be resolved (e.g. an `error`/`missing_params` state reached before any
     slug is known), the page falls back to a plain, unstyled-chrome wrapper rather than
     crashing — `MetroHeader`/`MetroFooter` are skipped, but the app's own
     `TopBanner`/`Navbar`/`Footer` are *also* hidden for this route (see App.tsx change
     below), so this only ever shows a bare centered card, never double chrome.
   - `<Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>` — this page is a
     one-time transactional confirmation, never meant to be indexed or linked to externally.
3. **`src/App.tsx`** — one new lazy route: `<Route path="/metro-order-confirmed"
   element={<MetroOrderConfirmedPage />} />`, placed next to the other metro routes. The
   `isMetroPage` chrome-hiding check (which controls whether the classic `TopBanner`/
   `Navbar`/`Footer` render) was extended additively: `location.pathname ===
   '/metro-order-confirmed' || METROS.some(...)` — so this route hides the classic chrome
   exactly like every other metro page, whether or not `MetroLayout` ends up rendering its
   own header/footer inside the page.
4. **`src/metro/services/metroCheckoutService.ts`** — `startMetroCheckout` no longer writes
   *any* of the live `/cart → /checkout` flow's localStorage keys (`checkout-order-backup` /
   `checkout-in-progress` / `checkout-order-id` via `storeCheckoutBackup()`). Those are read
   by `PaymentSuccess.tsx`, and since metro no longer sends the customer there at all, writing
   them served no purpose and risked interfering with an unrelated live checkout in progress
   in another tab. Instead, on a successful `redirect` result it writes one small metro-only
   record to a new key, `mgg-metro-pending-checkout` (exported as
   `METRO_PENDING_CHECKOUT_KEY`):
   ```ts
   { orderId: string; serverQuote: MetroServerQuote; createdAt: number }
   ```
   Two new accessors ship alongside it: `getMetroPendingCheckout()` (parses and validates the
   stored record, returns `null` on anything missing/malformed — never throws) and
   `clearMetroPendingCheckout()` (called by `MetroOrderConfirmedPage` on `success`). This
   record is **only** a display/GA4 fallback for the confirmation page — it is never read by
   any Supabase function and never required for the order itself to exist (the order row is
   fully written by `create-metro-checkout` at insert time, and flipped to
   paid/authorized by `verify-metro-payment`).
   `StartMetroCheckoutDeps.storeBackup` was renamed to `storePendingCheckout` (test-only
   injection point) — this is the only breaking change to the service's public shape.
5. **`public/robots.txt`** — `Disallow: /metro-order-confirmed` added to every user-agent
   group that carries a `Disallow` list (11 groups: Googlebot, Google-Extended, Bingbot,
   OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot, Claude-SearchBot,
   Applebot-Extended, `*`) — `Twitterbot`/`facebookexternalhit` (which only ever carry
   `Allow: /`) were correctly left untouched.
6. **Prerender / sitemap** — verified read-only, no changes needed: `/metro-order-confirmed`
   is not in `scripts/generate-prerender-routes.mjs`'s hand-curated `STATIC_ROUTES`, not
   produced by the metro-routes `tsx` exporter (home/category/town only), and not in
   `scripts/prerender/extra-routes.json`. Same for `scripts/generate-sitemap.mjs`'s
   `STATIC_PAGES` / metro-routes exporter / extra-routes. Confirmed via `grep -rn
   "metro-order-confirmed"` across all of `scripts/` — zero hits outside the files this agent
   owns.

## What was removed from the original (A2-CHECKOUT-CLIENT) design

- `metroCheckoutService.ts` no longer imports or calls `storeCheckoutBackup` from
  `src/utils/paymentUtils.ts`, and no longer builds an `orders`-table-shaped backup item
  (`buildBackupItem`/`writeBackup`) keyed to `verify-payment`'s fallback-insert field names.
  That entire mechanism existed solely so `verify-payment`'s `CART-` branch (and its
  generic "no cart row found" fallback) could finalize a metro order — it's now dead code
  for metro, since metro never calls `verify-payment` at all.
- `src/pages/PaymentSuccess.tsx` is back to its pre-metro state (`git diff` against `HEAD` is
  empty) — the guarded `trackMetroPurchaseConversion` call and its import, previously added
  there, have been removed. `metroPurchaseTracking.ts` itself is unchanged and is now called
  from `MetroOrderConfirmedPage.tsx` instead.
- The pre-existing GA4 gap this agent's predecessor found and patched inside
  `PaymentSuccess.tsx` (verify-payment's `data.orders` branch never firing a purchase
  conversion) is **no longer metro's problem to work around** — it may still be worth a
  follow-up ticket for whatever *other* feature relies on that branch (e.g. `QUOTE-`
  conversions), but metro doesn't touch that code path anymore.

## Gating (unchanged)

`isMetroCheckoutEnabled(metro) = metro.priceBookConfirmed === true &&
import.meta.env.VITE_METRO_CHECKOUT_ENABLED === 'true'`. Both DFW and Long Island are
`priceBookConfirmed: false` today, so checkout (and therefore this whole confirmation page)
is unreachable in production regardless of the env flag.

## Test results

`npx vitest run src/metro src/pages/metro` — **596/596 passing**:
- `metroCheckoutService.test.ts` (23 tests) — `isMetroCheckoutEnabled` gating (3), every
  `create-metro-checkout` response-code mapping (redirect + pending-checkout record shape,
  PRICE_CHANGED, PRICE_BOOK_UNCONFIRMED, SERVER_ERROR, OUT_OF_AREA/DATE_UNAVAILABLE/
  BELOW_MINIMUM/INVALID_INPUT ×4, network error, invoke-throws, UTM passthrough), a dedicated
  assertion that the live `/checkout` flow's three localStorage keys are never written, and
  `getMetroPendingCheckout`/`clearMetroPendingCheckout` round-trip + malformed-data handling.
- `MetroOrderConfirmedPage.test.tsx` (9 tests, new) — success (summary rendered + the
  `purchase` GA4 event fired exactly once, `invoke` called exactly once with the right body);
  the `mgg_purchase_fired_<orderId>` guard already set → no second `purchase` event even
  though the mocked response's `alreadyProcessed` is `true`; the pending-checkout record is
  cleared on success; `unpaid` → back link points at the pending record's metro; a
  `FunctionsHttpError` body is handled identically to a 200 failure response; a
  network/invoke failure falls back to the generic error state without throwing; missing
  `session_id`/`order_id` → error state with zero `invoke` calls; React `StrictMode`
  double-mount → `invoke` still called exactly once.
- `useMetroOrder.checkout.test.tsx` (6 tests, pre-existing, updated only for the
  `storeBackup` → `storePendingCheckout` dep rename) — all still passing.
- `OrderFlow.test.tsx` (9, pre-existing, unmodified), `bundleParity.test.ts` (424),
  `metroPurchaseTracking.test.ts` (3), `config.test.ts` / `pricing.test.ts` / `dates.test.ts`
  / `serverQuote.test.ts` (A1/pre-existing) — all passing, untouched by this agent.

`npx tsc --noEmit -p tsconfig.app.json` — zero new errors in any file this agent touched
(verified by grepping the output for this agent's filenames — zero matches; the remaining
errors are the same pre-existing ones in unrelated legacy pages noted above).

`npx eslint` on every touched file (`App.tsx`, `metroCheckoutService.ts`,
`metroCheckoutService.test.ts`, `useMetroOrder.checkout.test.tsx`,
`MetroOrderConfirmedPage.tsx`, `MetroOrderConfirmedPage.test.tsx`) — zero errors/warnings.

No build was run (`npm run build` / `build:prerender` were not run per instructions), so no
`public/sitemap.xml` regeneration happened as part of this work.

## Manual test plan for the owner (Stripe TEST mode only — do NOT run against production)

Once a metro's `priceBookConfirmed` flips to `true`, `verify-metro-payment` (A1v2's edge
function) is deployed, and a Stripe **test**-mode secret is wired into both
`create-metro-checkout`'s and `verify-metro-payment`'s environment:

1. Run `VITE_METRO_CHECKOUT_ENABLED=true npx vite --port 8084` locally (do **not** run this
   against the production Supabase project's live Stripe keys).
2. Walk a metro order flow to the contact step; confirm the CTA reads "Continue to secure
   payment — $X" and the auth-hold disclaimer is visible (unchanged from before).
3. Submit with valid contact info; confirm redirect to a Stripe **test**-mode checkout page
   (URL starts `https://checkout.stripe.com/...`, test-mode banner visible) with the correct
   line items.
4. Complete payment with a Stripe test card (`4242 4242 4242 4242`); confirm redirect to
   `/metro-order-confirmed?session_id=cs_test_...&order_id=CART-METRO-...` — **not**
   `/payment-success`. Confirm the page shows a brief "Confirming your order…" spinner, then
   the order summary (material, quantity, delivered total, delivery date, delivery address,
   the authorization-hold copy, "what happens next," and the metro's phone number in the
   page's own header/footer).
5. Check GA4 DebugView or the Network tab for a `gtag` `purchase` call with the right
   `transaction_id` (the `ORDER-METRO-…` id) and `value` (the delivered total).
6. Reload `/metro-order-confirmed` on the same URL (simulating a refresh); confirm the order
   summary still renders (via `alreadyProcessed: true` from `verify-metro-payment`) but the
   GA4 `purchase` event does **not** fire a second time.
7. Open the same confirmation URL in a *second* tab/window while the first is still open, to
   approximate React StrictMode's double-invoke in dev — confirm only one `verify-metro
   -payment` network call per tab (StrictMode itself is a dev-only concern covered by the
   automated test; this step is about confirming no duplicate-tab weirdness in practice).
8. Visit `/metro-order-confirmed` directly with no query params, and separately with a
   `session_id`/`order_id` that doesn't match any real session (e.g. edit the URL); confirm
   both show the reassuring generic error message with the metro's phone number and the
   order id (if present) — never a raw Stripe/Supabase error string.
9. Back out of a Stripe test session (browser back button or Stripe's own cancel link) and
   confirm landing back on the original order page (`cancelPath`), with the metro pending
   -checkout record still intact/re-attemptable (check
   `localStorage['mgg-metro-pending-checkout']` in devtools).
10. Confirm `view-source:` on `/metro-order-confirmed` (or the Network tab response headers)
    shows `<meta name="robots" content="noindex, nofollow">`, and that the URL is absent from
    `/sitemap.xml` and disallowed in `/robots.txt`.
11. Flip `VITE_METRO_CHECKOUT_ENABLED` off (or leave `priceBookConfirmed: false`) and confirm
    the flow is pixel-identical to today's quote-request path — this whole page is
    unreachable by construction until checkout is enabled for a metro.

## Owner decisions / risks

- **Live GA4 gap in `verify-payment`'s `data.orders` branch** (found by A2-CHECKOUT-CLIENT,
  now reverted out of `PaymentSuccess.tsx` along with the rest of the metro-specific patch)
  is back to being nobody's problem within this branch's scope — flagging again in case it's
  worth a follow-up ticket for whichever other feature (e.g. `QUOTE-` conversions) relies on
  that response shape.
- **Metro-slug resolution for `MetroLayout`** depends on either the verify response's
  `order.metroSlug` (only present on `success`) or the pending-checkout record's
  `serverQuote.metroSlug` (written client-side at checkout time, so it survives an `error`/
  `unpaid` state reached before any server response). If a visitor lands on
  `/metro-order-confirmed` with no pending-checkout record in localStorage (e.g. a different
  browser/device than the one that started checkout) *and* the verify call fails outright,
  the page falls back to bare chrome (no `MetroHeader`/`MetroFooter`) rather than guessing a
  metro — flagged as an acceptable edge case rather than over-built for a state that
  shouldn't happen in the normal same-browser Stripe redirect flow.
- **`PriceSummary`'s `basePrice` breakdown line** still shows the client's own `basePrice`
  (not the server's) during a `price_changed` state — pre-existing note from
  A2-CHECKOUT-CLIENT, unrelated to this agent's isolation work, still an open minor cosmetic
  item.
- Dev server was not left running; no build was run; no production forms/buttons were
  submitted at any point; the one `git checkout HEAD -- src/pages/PaymentSuccess.tsx` was the
  only git working-tree mutation performed, and its diff is empty.
