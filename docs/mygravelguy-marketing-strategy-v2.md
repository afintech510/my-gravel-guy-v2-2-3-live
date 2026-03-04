# MyGravelGuy — Digital Marketing Strategy v2
### Revised incorporating OpenAI + Gemini analysis · March 2026

---

## Strategic Framing (Updated)

**MyGravelGuy is not a gravel company. It is a procurement simplification layer.**

The positioning is: *"One contact. Any market. Any jobsite."* — This is a logistics abstraction story, not a materials story. Contractors don't care about gravel. They care about eliminating the 3-hour sourcing process every time they land in an unfamiliar market. Every ad, email, and landing page must reinforce this.

Two audiences. Two playbooks:
- **Contractors** (primary): B2B outreach, LinkedIn, high-intent Google Search. Goal: repeat accounts with $2K–$5K+ AOV on a monthly cadence.
- **Homeowners** (secondary): Google Search, Google Shopping, Facebook/Instagram retargeting. Goal: direct online orders at $400–$1,200 AOV.

**Critical reframe from both analyses**: The fastest revenue lever is funnel optimization, not more traffic. You have 218 abandoned carts vs. 41 paid orders. Fix the bucket before filling it.

---

## Phase 0: Technical Blockers — Fix These Before Spending on Ads

Both analyses independently flagged these as account/ROI killers. Do not launch paid campaigns until all three are resolved.

### 1. Fix the UTM Black Hole (Week 1 — Critical)
Your `orders` table has columns for `utm_source`, `utm_medium`, `utm_campaign`, `gclid`, etc. — but they are currently empty. This means every dollar you spend on ads will be unattributable. You will not know which campaigns are generating orders.

**Fix**: Trace the UTM parameter flow from the URL → `CartContext` → Stripe checkout edge function → Supabase `orders` insert. Add a `console.log` at each step to confirm the handoff. Don't launch a single paid campaign until a test order shows UTM data in the database.

### 2. Fix SPA Link Previews (Week 1 — Critical for B2B)
Your site is a client-side React app. When you send a cold email via Apollo.io or a LinkedIn message with a link to `/contractors`, the link preview will pull the generic `index.html` fallback — not the targeted contractor messaging. Decision-makers see a generic preview and often don't click.

**Fix**: Implement prerendering via Cloudflare Workers (you already use Cloudflare for your CDN). Configure it to intercept bot/crawler requests and serve pre-rendered HTML with the correct `<title>`, `<meta description>`, and Open Graph tags per page.

### 3. Remove Hardcoded Fake Reviews (Week 1 — Account Suspension Risk)
`ProductDetail.tsx` and `MarketMaterialPage.tsx` have hardcoded 4.8 aggregate ratings in your JSON-LD schema. Google can suspend your Google Shopping feed for this — which is a primary homeowner revenue channel.

**Fix**: Remove the hardcoded schema immediately. Uncomment `ReviewForm.tsx` and email your 41 paid customers asking for a review. Even 10 real reviews is better than a Shopping suspension.

### 4. Set Up Conversion Tracking in Google Ads (Week 1)
Before any ad spend, configure these conversion actions in Google Ads:
1. Stripe payment success → `Purchase` event with actual order value passed
2. Quote form submitted → `GenerateLead` (assign $500 estimated value)
3. Add to cart → micro-conversion
4. Phone call from ad extension → call conversion
5. Enable Enhanced Conversions: pass first-party data (email, phone) from confirmed orders

---

## Phase 1: Zero Ad Spend Revenue (Weeks 1–2)

Capture money you've already earned before spending to acquire new customers.

### Abandoned Cart Recovery
218 abandoned carts vs. 41 paid orders is an extremely high abandonment rate. At 10% recovery and $1,473 AOV, that's ~$32K in recoverable revenue.

**Immediate actions**:
- Audit your `process-abandoned-carts` edge function — is it actually firing? Check the `abandoned_cart_emails` table (218 rows tracked, but how many emails sent?).
- **Segment by abandonment reason** before writing copy. Analyze the carts: are they high ZIP-code-adjusted prices? Unclear deposit option? Missing delivery date? Each friction point needs a different recovery message.
  - Price friction → "Here's how our pricing works — delivery is already included"
  - Trust friction → "Here's what happens after you order"
  - Timing friction → "Still need materials? We can deliver in 3–5 days"
- Add SMS recovery via your Twilio integration for carts over $1,000. Text converts faster than email for high-value decisions.

### The 2-Hour Quote Rule
You have 89 quotes generated with ~20% conversion. A phone call from a real person within 2 hours of a quote request would likely push this to 35%+. That's more revenue impact than any ad campaign.

**Enforce it**: Set up a Supabase webhook or edge function trigger — when a new quote is inserted with status `Quote`, fire a Slack/SMS alert to whoever is responsible for follow-up. Track the time-to-call and the conversion rate by call speed.

**Revenue math**: 89 quotes × 35% conversion × $1,473 AOV = $45,800 vs. current ~$26,000. That's a $19,800 lift from process discipline alone.

---

## Phase 2: Google Search Ads (Weeks 2–4, After Tech is Fixed)

Highest-priority paid channel. Purchase-intent traffic. No other channel matches it.

### Campaign 1 — Contractors (High CPC Tolerance)
- **Budget**: $50–$75/day to start
- **Keywords** (phrase + exact match only — no broad until you have search term data):
  - `bulk gravel delivery [city]`
  - `commercial aggregate delivery`
  - `contractor gravel supplier`
  - `nationwide aggregate delivery`
  - `bulk crushed stone delivery`
  - `landscape material supplier nationwide`
- **Negatives**: home depot, lowes, pickup, bags, free, cheap, how to, DIY
- **Landing page**: `/contractors` — not the homepage, not `/shop`
- **Ad copy angle**: Procurement simplification, not product features
  - "Nationwide Aggregate — One Contact, Any Jobsite"
  - "Working Out of Market? We Source & Deliver Anywhere in the US"
  - "Stop Calling Local Quarries in Every New City"
- **Ad extensions**: Call extension with your 844 number, sitelinks to `/contractors`, callout "All 50 States • Same-Day Quotes • Volume Discounts"
- **Bidding**: Start with Maximize Conversions. Do NOT shift to Target CPA until you have **50+ stable conversions** with validated attribution and have confirmed the attribution window reflects the contractor buying cycle (often 7–21 days from first click to order).

### Campaign 2 — Homeowners (Volume Play)
- **Budget**: $30–$50/day
- **Keywords**: `gravel delivery near me`, `bulk mulch delivery`, `driveway gravel delivered`, `topsoil delivery [city]`, `crushed stone near me`, `pea gravel delivery`
- **Critical**: Route ads to **location-specific pages**, not `/shop`. You have 196 location pages. An ad for "Gravel Delivery Dallas" should go to `/locations/dallas-tx`. Your Quality Score will be significantly higher, lowering CPC. This is one of the biggest efficiency gains available to you right now.
- **Bidding**: Maximize Conversions until 50+ conversions, then test Target ROAS at 3.5x

### Campaign 3 — Remarketing / Display
- **Audiences**: Visited `/contractors` without converting, added to cart without checkout, submitted quote without ordering, visited any product page 2+ times
- **Budget**: $15–$20/day
- **Copy**: "Your quote is waiting." / "Still need materials?" / "20 tons delivered to your jobsite — here's how it works"

### Regional Density First (Revised from v1)
One analysis correctly flagged this: **do not try to prove nationwide scale before proving regional reliability.** Contractors care about whether you're reliable in *their* specific markets, not theoretical 50-state coverage.

**Recommendation**: Identify your top 5 performing markets (CA, FL, TX, NY, MN based on order data) and build strong case studies in those markets first. Use them in contractor ad copy and cold email. "We've delivered 40+ jobs in Florida alone" is more persuasive to a Florida-based contractor than "all 50 states."

---

## Phase 3: Google Shopping (Optimize, Not Launch)

The feed is already live. Focus on optimization.

- **$0 shipping attribute**: Ensure your `google-shopping-feed` Edge Function passes the `shipping` attribute as `$0.00`. If a competitor shows $480 (material only) and you show $720 (delivered), you lose the click unless "free delivery included" is visible. This single change could significantly improve your CTR.
- **Priority SKUs**: Driveway Gravel, Pea Gravel, Mulch, Topsoil, Crushed Stone
- **Title format**: `[Material] Bulk Delivery — Free Delivery Included — Order Online`
- **Audit Merchant Center**: Check for disapproved products (especially after removing the fake review schema). Disapprovals silently tank Shopping performance.
- **Performance Max**: Once Shopping is optimized and conversion tracking is verified, test a PMax campaign using your existing GA4 audience signals.

---

## Phase 4: Cold Email B2B — Apollo.io (Highest Contractor ROI)

Already set up. Two improvements to implement immediately.

### Warm Lead Prioritization (Highest Priority Addition)
You have the Apollo.io website tracker installed in `index.html`. This is gold. **Set up a trigger**: if a company IP visits `/product-calculator` or `/contractors`, they skip the cold sequence entirely and receive a personalized warm outreach from the founder within 12 hours. Their visit is a buying signal.

Warm subject line: "Saw you were looking at bulk delivery options — happy to chat"

### Refine Sequence Messaging

**Sequence A — Playground & Turf Installers** (highest pain point match)
- Subject: "Do you have a gravel guy in every city?"
- Day 0: "You install playgrounds in 30+ states. Sourcing pea gravel in an unfamiliar market wastes hours and kills margins. We eliminate that call." Include: "We served contractors in X states in Q1 — here's how it works."
- Day 3: Proof. Reference specific markets. "We delivered to 5 jobsites in Florida last month for an out-of-state installer."
- Day 7: Confront the pain. Instead of "What states are you active in?" → **"If you had a job in Denver tomorrow, who would you call for gravel?"** Make them feel the gap.
- Day 14: Final touch. Direct link to `/contractors` + phone number.

**Sequence B — Landscaping Companies**
- Angle: "When you're working outside your home market, how do you source bulk materials?"

**Sequence C — General Contractors / Excavation**
- Angle: Road base, crusher run, fill dirt — sourced and delivered anywhere in the US, one contact

### Social Proof Requirements
Every sequence must include quantified proof. Contractors reduce risk, they don't buy products. Add:
- "120+ job sites served last quarter"
- "Contractors in 18 states used us in Q1 2026"
- "Average quote-to-delivery: X days"

---

## Phase 5: LinkedIn

### Organic (Start Immediately — Free)
**Founder authority content is the highest-leverage LinkedIn activity.** Posts from the company page convert worse than posts from a real person. The founder should be posting 3–4x/week:
- "We just sourced 40 tons of crusher run for a Chicago contractor working a job in Phoenix — here's how we pulled it off in 36 hours"
- Behind-the-scenes of how the pricing engine works
- Material education: "Crusher run vs. road base — which do you actually need?"
- Procurement horror stories: "A contractor called us after spending 3 hours trying to find a quarry in an unfamiliar city"

This builds trust with the exact decision-makers you're cold-emailing. When your Apollo.io email lands and they Google you, a credible LinkedIn presence closes the loop.

### LinkedIn Ads (When Ready — $30–$50/day minimum)
- **Format**: Single Image or Document Ad (a short guide — "Contractor's Guide to Sourcing Materials in New Markets" — works as a lead magnet)
- **Targeting**: Owner, Operations Director, Project Manager, Purchasing Manager / Construction, Landscaping, Civil Engineering / 11–500 employees
- **Lead Gen Forms**: Native LinkedIn forms. Capture: name, company, phone, "What states do you work in?"
- **Message Ads (InMail)**: "Do you have a material supplier in every city you work?"

Do not run LinkedIn homeowner campaigns. Wrong audience entirely.

---

## Phase 6: Facebook / Instagram — Homeowners (Retargeting First)

Discovery channel, not intent channel. Retargeting before prospecting.

### Retargeting (Start Here)
- Website visitors who didn't convert
- Cart abandoners
- Quote starters who didn't finish
- Copy: "Still need gravel? Your price is waiting." / "Get 5 tons delivered this week."
- Budget: $20–$30/day

### Prospecting (After Retargeting Proves Out)
- Upload your 41 paid customer emails → Meta Custom Audience → 1% Lookalike
- Targeting: Homeowners 30–65, $75K+ HHI, home improvement / landscaping / DIY interests, suburban/rural ZIP codes
- **Key asset needed**: A short video showing the ordering flow ("Type your ZIP, get an instant price, we deliver. That's it.") outperforms static images significantly for this audience.
- **Calculator hook**: A Facebook/Instagram ad linking directly to the material calculator or quiz converts better than a generic shop page. Utility drives clicks from homeowners in research mode.
- Budget: $30–$50/day once retargeting is profitable

---

## X.com (Twitter)

Zero paid spend. Keep the @mygravelguy account active for organic posts. Revisit in 12 months.

---

## YouTube (6–12 Months Out)

High leverage when paired with "how much gravel do I need" search intent. Build a 60–90 second explainer video first, then run In-Stream ads targeting landscaping/home improvement content. The calculator + video + retargeting into Search is a powerful funnel — but not before Google Search is dialed in.

---

## Q2 2026 KPI Targets

Hard targets prevent emotional scaling decisions.

| Metric | Target |
|---|---|
| **Contractor**: Cost per qualified lead | < $120 |
| **Contractor**: Close rate (lead → order) | > 25% |
| **Contractor**: 90-day LTV | > $8,000 |
| **Homeowner**: Customer acquisition cost | < $250 |
| **Homeowner**: Google Ads ROAS | > 3.5x |
| **All**: Cart recovery rate | > 12% |
| **All**: Quote-to-order conversion | > 35% (from ~20%) |
| **All**: Monthly paid orders | 20+ (from ~5) |
| **All**: Monthly quotes | 40+ (from ~11) |

---

## Revised Priority & Budget Allocation

| Channel | Audience | Priority | Monthly Budget |
|---|---|---|---|
| UTM fix + conversion tracking | — | 🔴 Do first | Dev time only |
| SPA prerendering fix | — | 🔴 Do first | Dev time only |
| Abandoned cart recovery (SMS + email) | Both | 🔴 Immediate | $0 (existing tools) |
| 2-hour quote follow-up system | Both | 🔴 Immediate | $0 (process only) |
| Google Search — Contractors | Contractors | 🔴 Highest paid | $1,500–$2,500 |
| Google Search — Homeowners | Homeowners | 🟠 High | $900–$1,500 |
| Google Remarketing | Both | 🟠 High | $450–$600 |
| Google Shopping (optimize existing) | Homeowners | 🟠 High | Included above |
| Apollo.io cold email | Contractors | 🟠 High | $150/mo tool cost |
| LinkedIn Organic (founder) | Contractors | 🟠 High | Time only |
| Facebook/Instagram Retargeting | Homeowners | 🟡 Medium | $600–$900 |
| LinkedIn Ads | Contractors | 🟡 Medium | $1,000–$1,500 |
| Facebook/Instagram Prospecting | Homeowners | 🟢 Later | $500+ |
| YouTube | Homeowners | ⬜ 6–12 months | TBD |
| X.com | — | ⬜ Skip | $0 |

---

## 30-Day Execution Order

1. ✅ **Week 1**: Fix UTM tracking — verify parameters flow from URL → CartContext → Stripe → Supabase
2. ✅ **Week 1**: Fix SPA prerendering via Cloudflare Workers
3. ✅ **Week 1**: Remove hardcoded review schema, email 41 customers for real reviews
4. ✅ **Week 1**: Set up Google Ads conversion tracking (purchase, lead, cart, call)
5. ✅ **Week 1**: Set up Twilio SMS trigger for abandoned carts over $1,000
6. ✅ **Week 1**: Implement quote alert → 2-hour call rule with Slack notification
7. ✅ **Week 2**: Set up Apollo.io warm lead trigger for contractor page / calculator visitors
8. ✅ **Week 2**: Launch Contractor Search campaign ($50/day, exact + phrase match)
9. ✅ **Week 2**: Launch Homeowner Search campaign routed to location pages ($30/day)
10. ✅ **Week 2**: Enable Meta Pixel on site (start building retargeting audiences now even before spend)
11. ✅ **Week 3**: Launch Google Remarketing for cart abandoners + quote starters
12. ✅ **Week 3**: Start Apollo.io Sequence A (playground/turf installers)
13. ✅ **Week 3**: Founder posts 3x on LinkedIn this week
14. ✅ **Week 4**: Audit Google Shopping feed, fix shipping attribute, check Merchant Center approvals
15. ✅ **Week 4**: Upload customer email list to Meta + Google for lookalike/Customer Match
16. ✅ **Week 4**: Review first 2 weeks of Search data — search terms, converting keywords, wasted spend

---

## Final Strategic Principle

Traffic acquisition is not the goal. **LTV optimization is.**

MGG wins when:
- Contractors reorder without being re-acquired
- Systems route and close warm leads automatically
- Procurement friction disappears for the contractor

One contractor account that reorders monthly at $3,000 is worth more than 20 one-off homeowner orders at $500. Build the funnel, close the contractor, keep them forever.
