# MyGravelGuy Session Log

## Session 1 — 2026-02-27

### What Was Accomplished
- Complete codebase review and learning of the MyGravelGuy project
- Created comprehensive memory files (MEMORY.md, architecture.md, pricing.md, deployment.md)
- Created CLAUDE.md project guide
- Created `/open-session` and `/close-session` skills (`.claude/commands/`)
- Verified SSH connectivity to Hetzner VPS (`hampton-vps` → root@5.161.88.134)
- Updated `.claude/settings.local.json` with SSH and server permissions
- Assessed Hetzner VPS capacity for self-hosting (25GB free, 2.2GB RAM available)
- Identified transition plan from Lovable to self-hosted

### Decisions Made
- **Shared VPS**: Will share the existing Hetzner VPS (5.161.88.134) with Host Hampton — both are lightweight enough
- **Docker deployment**: MyGravelGuy will be a simple Docker container (multi-stage: node build → nginx serve static SPA)
- **Supabase stays**: Backend (DB, Auth, Edge Functions) stays on Supabase cloud — only the frontend static files move to VPS
- **Nginx integration**: Add a new server block to the existing nginx container for the MGG domain
- **Cloudflare SSL**: Use same Cloudflare Origin Certificate approach as Host Hampton

### Known Issues / Blockers
- Need to know the production domain name (mygravelguy.com?) to configure DNS and nginx
- Need to check current DNS provider and how domain is managed
- VPS has 25GB free disk and ~2.2GB available RAM — sufficient but should monitor
- Host Hampton already uses ports 80/443 via its nginx — MGG needs to be added as a virtual host

### Current Project State
Project fully reviewed and documented. SSH access to Hetzner VPS confirmed working. Ready to begin self-hosting transition — need domain/DNS details to proceed with nginx and Cloudflare configuration.

### Updated Priority TODO (in order)
1. Confirm domain name and DNS provider for MyGravelGuy
2. Create Dockerfile and docker-compose for MGG static site
3. Add MGG server block to Hetzner nginx config
4. Set up Cloudflare Origin Certificate for MGG domain
5. Deploy and test on VPS with staging subdomain
6. DNS cutover from Lovable to Hetzner
7. Verify all functionality post-migration

### Files Changed This Session
- `.claude/commands/open-session.md` — created (session start skill)
- `.claude/commands/close-session.md` — created (session end skill)
- `.claude/settings.local.json` — updated with SSH/server permissions
- `CLAUDE.md` — created (project guide for Claude Code)
- `SESSION_LOG.md` — created (this file)

## Session 2 — 2026-03-03

### What Was Accomplished
- Deployed enhanced delivery confirmation system to VPS (SMS verification, signature canvas, IP/location logging)
- Fixed delivery confirm page rendering inside site navbar/footer — added `isStandalonePage` check in App.tsx
- Fixed critical React re-render bug: `Wrap` and `OrderSummary` components defined inside `DeliveryConfirm` caused unmount/remount on every state change, destroying input focus and canvas pixel data
- Rewrote SignatureCanvas to use native DOM event listeners and refs instead of React state
- Added logo, order #, Stripe payment ID display, and enhanced legal verbiage to delivery confirmation page
- Added `stripe_payment_id` column to `delivery_confirmations` table (Supabase migration)
- Created manual order for Jordan Romeo (22 tons #57 Crushed Stone, $1,594.98, Brooksville FL)
- Helped with Google Ads API application (business model description, design doc, multiple Q&A answers)
- Created `docs/google-ads-api-design-doc.md` for Google Ads API application
- Fixed Google Search Console structured data warnings: added `aggregateRating`, `review`, `priceValidUntil` to ProductDetail.tsx and MarketMaterialPage.tsx
- Verified `shippingDetails` and `hasMerchantReturnPolicy` were already present

### Decisions Made
- **Standalone page pattern**: `/delivery-confirm` route skips navbar/footer via `isStandalonePage` check in App.tsx — reusable for future standalone pages
- **Component identity fix**: Never define React components inside render functions — causes unmount/remount cycle destroying DOM state
- **Native canvas events**: Use native DOM event listeners + refs for canvas drawing to avoid React re-renders during interaction
- **Structured data approach**: Using hardcoded aggregate rating (4.8/5, 36 reviews) from actual DB data; featured review from real customer (Jake)
- **Order ID format**: Timestamp-based from `created_at` field (e.g., `20260302-230812`)
- **Fulfillment status enum**: Values are capitalized (`'Delivered'` not `'delivered'`)

### Known Issues / Blockers
- Google Ads API application still needs MCC account creation for developer token
- `docs/google-ads-api-design-doc.md` needs to be converted to PDF for Google Ads API upload
- Google Search Console needs to recrawl site to clear structured data warnings
- Delivery confirmation test row uses token `00000000-...0001` with phone `+16314008080`

### Current Project State
All requested features deployed and live on VPS. Delivery confirmation system fully functional with SMS verification, signature capture, and IP/location logging. Structured data issues resolved. Google Ads API application partially completed (needs MCC account).

### Updated Priority TODO (in order)
1. Convert Google Ads design doc to PDF and finish API application (needs MCC account)
2. Test delivery confirmation flow end-to-end with real delivery
3. Monitor Google Search Console for structured data validation
4. Continue self-hosting transition planning (domain/DNS cutover from Lovable)

### Files Changed This Session
- `src/pages/DeliveryConfirm.tsx` — major rewrite: fixed component identity bugs, added logo/order details/legal verbiage
- `src/App.tsx` — added `isStandalonePage` conditional for standalone routes
- `src/components/dashboard/OrderDetailModal.tsx` — added `stripe_payment_id` to confirmation snapshot
- `src/pages/ProductDetail.tsx` — added aggregateRating, review, priceValidUntil structured data
- `src/pages/MarketMaterialPage.tsx` — added aggregateRating, review, priceValidUntil structured data
- `docs/google-ads-api-design-doc.md` — created (Google Ads API application design documentation)
- Supabase migration: `add_stripe_payment_id_to_delivery_confirmations`
