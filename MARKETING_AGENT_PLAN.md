# Marketing Operations Agent — Full Roadmap

> Saved 2026-03-01. This is the long-term plan. See session work for what's been implemented so far.

## Architecture

**Cron-triggered Supabase Edge Functions** (same pattern as `process-abandoned-carts`):
- VPS crontab calls Edge Functions via `curl` on schedule
- All state stored in Supabase tables
- LLM call for intelligent analysis (provider-switchable: Gemini/OpenAI/Claude)
- Admin dashboard reads from DB tables
- Recommend-only mode — no auto-execution without admin approval

## Key Decisions

- **Google Ads account**: Exists (Customer ID: `842-452-6917`)
- **Meta Ads account**: Needs creation (Meta Business Verification takes 1-2 weeks)
- **Agent autonomy**: Recommend-only with admin approval
- **LLM**: Start with Gemini 2.5 Flash ($0.04/mo), switchable to GPT-4o or Claude Sonnet

## AI Model Comparison (for agent intelligence layer)

| Model | Tier | Input/1M | Output/1M | Monthly Est. | Notes |
|-------|------|----------|-----------|-------------|-------|
| Gemini 2.5 Flash | Budget | $0.15 | $0.60 | ~$0.04 | Free tier available |
| GPT-4o-mini | Budget | $0.15 | $0.60 | ~$0.04 | Reliable structured output |
| Claude Haiku 4.5 | Budget | $1.00 | $5.00 | ~$0.32 | Best instruction-following |
| Gemini 3.1 Pro | Mid | $1.25 | $10.00 | ~$0.56 | Native grounding |
| GPT-4o | Mid | $2.50 | $10.00 | ~$0.68 | Strong all-around |
| Claude Sonnet 4.5 | Mid | $3.00 | $15.00 | ~$0.95 | Best reasoning |

## Phase 1: Fix Structured Data — DONE (Session 2)

Added `shippingDetails`, `hasMerchantReturnPolicy`, `sku`, `brand` to ProductDetail.tsx JSON-LD.

## Phase 2: Tracking Infrastructure — DONE (Session 2)

- Google Ads conversion tag (`AW-8424526917`) added to index.html
- Purchase conversion tracking added to PaymentSuccess.tsx
- `trackGoogleAdsConversion()` helper added to analytics.ts

## Phase 3: API Integration (Edge Functions) — FUTURE

### 3A. Merchant Center Sync
- `supabase/functions/merchant-center-sync/index.ts`
- Google Service Account auth (not manual OAuth)
- Weekly cron via VPS

### 3B. Google Search Console Fetch
- `supabase/functions/search-console-fetch/index.ts`
- Search analytics + crawl errors
- Daily cron

### 3C. Google Ads API
- `supabase/functions/google-ads-api/index.ts`
- Campaign metrics + budget adjustments
- **Blocked on developer token approval**

### 3D. Meta Marketing API (deferred)
- `supabase/functions/meta-ads-api/index.ts`
- **Blocked on Meta Business verification**

## Phase 4: Marketing Agent — FUTURE

### Agent Orchestrator (`supabase/functions/marketing-agent/index.ts`)
Daily cron: gather data → run heuristic rules → LLM analysis → store recommendations → alert on critical issues

### Heuristic Rules
**SEO:** High impressions/low CTR → fix meta tags | Not indexed → investigate | Zero impressions 14d → refresh content
**Ads:** ROAS < 1.0 → reduce budget | ROAS > 3.0 → increase budget | High clicks/no conversions → negative keyword
**Merchant Center:** Disapproved → alert | Stale sync → trigger resync
**Cross-channel:** Compare organic vs paid CPA → shift budget to winner

## Phase 5: Admin Dashboard — FUTURE

Route: `/dashboard/marketing`
- Agent status, recommendations feed, search performance, ads performance, merchant center status, settings

## Database Tables Needed

```sql
marketing_agent_logs, marketing_agent_recommendations, marketing_agent_config,
search_console_data, search_console_pages, ads_performance_data
```

## API Credentials Needed

| Secret | Service | Lead Time |
|--------|---------|-----------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Merchant Center + Search Console | Same day |
| `GOOGLE_MERCHANT_ID` | Merchant Center | Same day |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API | Days-weeks |
| `GOOGLE_ADS_REFRESH_TOKEN` | Google Ads API | After dev token |
| `META_ACCESS_TOKEN` | Meta Marketing API | 1-2 weeks |
| LLM API key (Gemini/OpenAI/Anthropic) | Agent intelligence | Same day |
