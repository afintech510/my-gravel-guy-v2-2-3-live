# MyGravelGuy — Database Schema Reference

**Backend**: Supabase (PostgreSQL)
**Project ID**: `losrkjvrcambvgijfism`
**URL**: `https://losrkjvrcambvgijfism.supabase.co`

---

## Table Overview (by row count)

| Table | Rows | Purpose |
|---|---|---|
| service_zip_codes | 33,783 | ZIP code coverage + price adjustments |
| location_search | 14,026 | Analytics: user location searches |
| price_tiers | 834 | Precomputed price lookup tiers |
| messages | 333 | SMS conversations (Twilio) |
| abandoned_cart_emails | 218 | Cart recovery email tracking |
| orders | 200 | Orders + quotes (core business table) |
| delivery_locations | 196 | SEO location pages |
| products | 47 | Product catalog |
| customer_reviews | 36 | Customer ratings & reviews |
| order_status_history | 27 | Order status change log |
| suppliers | 22 | Supplier network |
| leads | 15 | Lead capture |
| blog_posts | 11 | Blog CMS |
| expenses | 11 | Business expense tracking |
| expense_categories | 9 | Expense category taxonomy |
| google_shopping_sync_log | 7 | Google Shopping feed sync log |
| blog_categories | 4 | Blog category taxonomy |
| supplier_quotes | 4 | Quotes from suppliers |
| delivery_confirmations | 3 | Delivery verification records |
| rate_limits | 3 | API rate limiting |
| market_materials | 3 | Market-specific material pages |

---

## Core Tables

### `orders` — Orders & Quotes
The central business table. Holds both paid orders and quote requests.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| order_id | text | Human-readable ID (e.g., `20260302-230812` or `ORDER-20260302-230812-2`) |
| status | text | `cart`, `Quote`, `pending`, `confirmed`, `processing`, `delivered` |
| fulfillment_status | enum | `Quote Needed`, `Quote Sent`, `New Order`, `Pending`, `Assigned`, `Scheduled`, `Delivered`, `Cancelled`, `Archived` |
| product_id | text | FK to products |
| quantity | numeric | Amount in tons or yards |
| unit | text | `ton` or `yard` |
| unit_price | numeric | Price per ton/yard |
| total_price | numeric | Total order price |
| base_price | numeric | Base price before adjustments |
| zip_adjust | numeric | ZIP code price multiplier applied |
| delivery_name | text | Customer name |
| delivery_email | text | Customer email |
| delivery_phone | text | Customer phone |
| delivery_street | text | Delivery address |
| delivery_city | text | City |
| delivery_state | text | State (2-letter or full name) |
| delivery_zip | text | ZIP code |
| delivery_date | date | Requested delivery date |
| delivery_time_preference | text | AM/PM/anytime |
| delivery_instructions | text | Special instructions |
| billing_name | text | Billing name |
| billing_email | text | Billing email |
| stripe_session_id | text | Stripe checkout session |
| stripe_payment_intent_id | text | Stripe payment intent |
| is_deposit_payment | boolean | Whether $199 deposit was used |
| deposit_amount | numeric | Deposit amount paid |
| balance_due | numeric | Remaining balance |
| payment_terms | text | Payment terms |
| supplier_id | text | Assigned supplier |
| supplier_charges | numeric | Our cost from supplier |
| supplier_paidby | enum | How supplier was paid |
| sales_person | text | Assigned salesperson |
| sales_commission | numeric | Commission amount |
| notes | text | Internal notes |
| tags | text[] | Order tags |
| coupon | text | Applied coupon code |
| expedite_fee_pct | numeric | Expedite surcharge % |
| expedite_fee_amount | numeric | Expedite surcharge $ |
| saturday_fee_pct | numeric | Saturday delivery surcharge % |
| saturday_fee_amount | numeric | Saturday delivery surcharge $ |
| quote_converted | boolean | Whether quote was converted to order |
| quote_expires_at | timestamp | Quote expiration |
| quote_status | text | Quote-specific status |
| quoted_price | numeric | Quoted price (may differ from final) |
| quote_notes | text | Quote notes |
| original_quote_id | text | Links converted order to original quote |
| confirmation_deadline_at | timestamptz | Order confirmation deadline |
| confirmed_at | timestamptz | When customer confirmed |
| market_slug | text | Landing page market (for attribution) |
| material_slug | text | Landing page material (for attribution) |
| utm_source | text | UTM source |
| utm_medium | text | UTM medium |
| utm_campaign | text | UTM campaign |
| utm_term | text | UTM term |
| utm_content | text | UTM content |
| gclid | text | Google Ads click ID |
| gbraid | text | Google Ads app click ID |
| wbraid | text | Google Ads web click ID |
| landing_page_url | text | First page visited |
| referrer | text | HTTP referrer |
| user_agent | text | Browser user agent |
| ga4_purchase_fired | boolean | Whether GA4 purchase event fired |
| attachment_files | text[] | Uploaded files |
| created_at | timestamptz | Order creation time |
| updated_at | timestamptz | Last update |
| delivered_at | timestamptz | Actual delivery time |
| fulfillment_eta | date | Estimated delivery date |

### `products` — Product Catalog

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Display name (e.g., "Crushed Gravel 3/4\"") |
| slug | text | URL slug |
| category | text | Category slug (e.g., `crushed-gravel`) |
| description | text | Full description |
| short_description | text | Brief description |
| price | numeric | Base price per unit |
| unit | text | `ton` or `yard` |
| size | text | Material size (e.g., "3/4\"") |
| application | text | Usage type (Driveway, Walkway, etc.) |
| color | text | Color variant |
| images | text[] | Array of image URLs |
| ton_yard_ratio | text | Conversion factor |
| zip_code_ratio | text | ZIP adjustment ratio |
| pricing_a | real | Exponential curve coefficient A |
| pricing_b | real | Exponential curve coefficient B |
| pricing_c | real | Exponential curve coefficient C |
| metadata | text | Additional metadata |

### `service_zip_codes` — Geographic Coverage & Pricing

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| zip | text | ZIP code |
| city | text | City name |
| state_id | text | State abbreviation |
| state_name | text | Full state name |
| county_name | text | County |
| lat / lng | numeric | Coordinates |
| population | integer | Population |
| density | numeric | Population density |
| price_adjustment | numeric | Price multiplier (default 1.0) |
| timezone | text | Timezone |
| county_fips | text | County FIPS code |

**Coverage**: 33,783 ZIP codes across all 50 states + DC.

### `suppliers` — Supplier Network

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Supplier/company name |
| email | text | Contact email |
| phone | text | Contact phone |
| address | text/json | Address info |
| service_areas | text[] | ZIP codes served |
| materials | text[] | Materials offered |
| active | boolean | Whether currently active |

---

## Supporting Tables

### `delivery_confirmations` — Delivery Verification
| Column | Type | Description |
|---|---|---|
| token | uuid | Unique confirmation link token |
| order_id | text | Related order |
| customer_name | text | Customer name |
| customer_phone | text | For SMS verification |
| customer_email | text | For email verification |
| verification_code | text | 6-digit code |
| verification_sent_at | timestamptz | When code was sent |
| verified_at | timestamptz | When identity was verified |
| confirmed_at | timestamptz | When delivery was confirmed |
| confirmed_delivery | boolean | Confirmation flag |
| signature_url | text | Signature image URL |
| photo_url | text | Delivery photo URL |
| rating | integer | Customer rating (1-5) |
| review_text | text | Customer review |
| confirmed_ip | text | IP address at confirmation |
| confirmed_location | jsonb | GPS coordinates |
| confirmed_user_agent | text | Browser info |

### `messages` — SMS Conversations (Twilio)
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| phone_number | text | Customer phone |
| direction | text | `inbound` or `outbound` |
| body | text | Message content |
| twilio_sid | text | Twilio message SID |
| is_read | boolean | Read status |
| order_id | text | Related order |

### `customer_reviews` — Ratings & Reviews
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| product_id | uuid | FK to products |
| product_name | text | Denormalized product name |
| user_name | text | Reviewer name |
| rating | integer | 1-5 stars |
| title | text | Review title |
| content | text | Review body |
| verified_purchase | boolean | Whether verified |
| helpful_votes | integer | Upvote count |
| admin_response | text | Our response |

### `blog_posts` / `blog_categories` — CMS
- 4 categories: Driveway Ideas, Local Delivery Info, Material Guides, Project Tips
- 11 published posts covering gravel types, driveway calculators, delivery FAQ

### `delivery_locations` — SEO Location Pages
- 196 locations with dedicated pages (e.g., /locations/dallas-tx)
- Used for local SEO targeting

### `expenses` / `expense_categories` — Financial Tracking
- Internal expense tracking for the business dashboard

### `abandoned_cart_emails` — Cart Recovery
- Tracks abandoned cart email sequences
- 218 records

### `leads` — Lead Capture
- 15 captured leads

### `location_search` / `quote_analytics` — Analytics
- 14,026 location searches tracked
- Used to understand where demand is coming from

---

## Enums

### `fulfillment_status_enum`
Values (capitalized): `Quote Needed`, `Quote Sent`, `New Order`, `Pending`, `Assigned`, `Scheduled`, `Delivered`, `Cancelled`, `Archived`

### `supplier_paidby`
Payment method for supplier invoices.

---

## Key RPC Functions

| Function | Purpose |
|---|---|
| `check_user_admin_status` | Verify if user is admin |
| `check_financial_admin_status` | Verify financial access |
| `is_admin` | Admin check helper |
| `check_rate_limit` | Rate limiting |
| `get_fulfillment_status_enum_values` | Get enum values |
| `log_order_status_change` | Audit trail |
| `update_updated_at_column` | Timestamp trigger |

---

## Row Level Security (RLS)

All tables have RLS enabled. Key patterns:
- **Products, reviews, blog**: Public read access
- **Orders**: Admin-only access via `is_admin()` check
- **Delivery confirmations**: `anon` and `authenticated` can SELECT (public links), UPDATE limited to unconfirmed records
- **Service ZIP codes**: Public read for price lookups
