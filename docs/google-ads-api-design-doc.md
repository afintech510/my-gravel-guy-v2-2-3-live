# My Gravel Guy — Google Ads API Integration Design Document

**Company:** My Gravel Guy (mygravelguy.com)
**Date:** March 2, 2026
**Google Ads Customer ID:** 842-452-6917
**Contact:** admin@mygravelguy.com

---

## 1. Company Overview

My Gravel Guy is an e-commerce platform specializing in bulk construction materials delivery, including gravel, crushed stone, sand, topsoil, and mulch. Customers place orders online with instant delivered pricing calculated based on product type, quantity, and delivery ZIP code. We serve homeowners and contractors across the United States with a minimum order of 3 tons per product.

**Website:** https://mygravelguy.com
**Platform Stack:** React/TypeScript web application with Supabase backend

---

## 2. Purpose of Google Ads API Access

We are requesting Google Ads API access for the following use cases:

### 2.1 Conversion Tracking & Reporting
- Import offline and server-side conversion events into Google Ads
- Track purchase completions, checkout initiations, and lead generation events
- Enhanced conversion support for better attribution accuracy
- Programmatic access to campaign performance data for internal reporting dashboards

### 2.2 Google Merchant Center Product Sync
- Automated product feed management via Content API for Shopping
- Real-time inventory and pricing updates (prices are dynamic based on delivery location)
- Product data quality monitoring and error resolution

### 2.3 Campaign Management
- Programmatic bid adjustments based on product availability and delivery capacity
- Automated budget allocation across campaigns based on regional demand
- Keyword performance monitoring and optimization

---

## 3. Technical Architecture

### 3.1 System Overview

```
[mygravelguy.com]  -->  [Supabase Backend]  -->  [Google Ads API]
   (React App)           (Edge Functions)         (Conversions, Shopping)
       |                      |
       v                      v
   [GA4 Tracking]     [Google Merchant Center]
   (G-VWSWTSDH99)      (Product Feed)
```

### 3.2 Conversion Flow

1. Customer visits mygravelguy.com via Google Ads click
2. GA4 tracks user journey events (page_view, add_to_cart, begin_checkout)
3. On purchase completion, a `purchase` event fires with transaction_id, value, and items
4. GA4 key events are imported into Google Ads for conversion attribution
5. Google Ads API will be used to supplement with enhanced conversions (hashed email/phone)

### 3.3 Product Feed Flow

1. Product catalog is stored in Supabase database (products table)
2. A Supabase Edge Function generates a Google Shopping-compliant XML feed
3. Feed URL: served via edge function endpoint
4. Google Merchant Center fetches the feed on a scheduled basis
5. Google Ads API will be used to monitor product status and resolve disapprovals

### 3.4 Data Storage & Security

- All API credentials stored as environment variables in Supabase Edge Function secrets
- OAuth 2.0 authentication for API access
- No customer PII is sent to Google Ads beyond what is required for enhanced conversions (hashed email)
- API calls are made server-side only (never from the client browser)

---

## 4. API Usage Estimates

| Metric | Estimated Volume |
|--------|-----------------|
| Conversion uploads | 50-200 per month |
| Product feed updates | Daily |
| Campaign data reads | Weekly |
| API calls per day | < 500 |

---

## 5. User Interaction

- **End users (customers):** No direct interaction with Google Ads API. Customers interact only with the mygravelguy.com website.
- **Admin users:** Internal team accesses a dashboard to view order data, campaign performance, and product feed status. API calls are triggered automatically or by admin actions (e.g., syncing products).

---

## 6. Compliance

- We comply with Google Ads API Terms of Service
- We do not resell or redistribute Google Ads data
- We do not use the API on behalf of third parties
- API access is used exclusively for managing our own Google Ads account
- We adhere to Google's data handling and privacy policies

---

## 7. Development Timeline

| Phase | Description | Target |
|-------|-------------|--------|
| Phase 1 | Enhanced conversion tracking | Q2 2026 |
| Phase 2 | Automated product feed sync | Q2 2026 |
| Phase 3 | Campaign performance reporting | Q3 2026 |

---

## 8. Contact Information

- **Primary Developer:** admin@mygravelguy.com
- **Website:** https://mygravelguy.com
- **Google Ads Account:** 842-452-6917
- **GA4 Property:** G-VWSWTSDH99
