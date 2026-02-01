

# Spec Materials Landing Page - Complete Implementation Plan

## Overview
Create a new landing page at `/contractors-spec-materials` for spec-driven buyers (Project Managers, DOT, Civil, Utility contractors). This plan incorporates all review feedback and patch requirements.

---

## Route Decision
**Route:** `/contractors-spec-materials`
- Clean, SEO-friendly
- Internal links + canonical URL consistent

---

## Patch Requirements Integration

### PATCH 1: Private Upload Bucket
**Requirement:** Upload bucket MUST be private. Store only `file_path` in `orders.notes` (no signed URLs).

**Implementation:**
- Create new private bucket `spec-uploads` OR use existing `customer-uploads` with RLS policies restricting public access
- On file upload: store path as `spec-uploads/{quote_id}/{filename}`
- Store only the path string in notes, NOT a signed URL
- Admin dashboard will generate signed URLs on-demand when viewing

### PATCH 2: Structured JSON in Notes
**Requirement:** Embed structured JSON block in `orders.notes` with delimiters.

**Implementation:**
```
Spec Quote: #57 Stone, 150 tons, Acme Construction, Nashville TN

--- MGG_SPEC_META_JSON ---
{
  "material": "#57 Stone (ASTM/DOT-grade)",
  "tons": 150,
  "company": "Acme Construction",
  "project_name": "Highway 40 Drainage",
  "po_number": "PO-2024-5567",
  "spec_item_description": "TDOT Item 903.01",
  "delivery_window": "AM (7-11)",
  "multi_drop_requested": false,
  "expedite_requested": true,
  "spec_file_path": "spec-uploads/QUOTE-20260201-123456/spec-sheet.pdf",
  "persona": "Contractor/PM/DOT/Utility",
  "source": "Spec Materials Landing Page"
}
--- END_MGG_SPEC_META_JSON ---
```

### PATCH 3: Spec-Safe Trust Bar & Documentation Copy
**Requirement:** Update copy to be legally safe.

**Trust Bar (5 items):**
- "Tickets + Documentation"
- "PO / Invoicing Support"
- "20-1,000+ Tons"
- "Multi-Site Coordination"
- "Vetted Supplier Network"

**Documentation Section Copy:**
- "Delivery tickets / scale slips with every load"
- "COA / gradation reports when available"
- "Chain of custody documentation where applicable"
- "PO / net terms coordination"
- "Invoice handling"

### PATCH 4: Full Address Validation
**Requirement:** Required field validation must include full delivery address (street/city/state/zip), not ZIP alone.

**Zod Schema:**
```typescript
const specFormSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  company: z.string().min(2, "Company is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  deliveryStreet: z.string().min(5, "Street address is required"),
  deliveryCity: z.string().min(2, "City is required"),
  deliveryState: z.string().min(2, "State is required"),
  deliveryZip: z.string().regex(/^\d{5}$/, "Valid 5-digit ZIP required"),
  material: z.string().min(1, "Select a material"),
  tons: z.number().min(20, "Minimum 20 tons").max(1000, "Maximum 1000 tons"),
  // ... optional fields
});
```

### PATCH 5: Renamed Analytics Event
**Requirement:** Rename `material_select` to `spec_material_select` to avoid collisions.

**Analytics Events:**
- `spec_lp_view` - Page view
- `spec_form_start` - User begins filling form
- `spec_material_select` - Material dropdown selection (renamed)
- `spec_form_submit` - Form submission (fires `generate_lead`)

### PATCH 6: Updated Button Label
**Requirement:** Change "Save & Checkout" to "Save & Request Pricing" (since payment is not implemented on this page).

**Primary Button:** "Save & Request Pricing"

---

## Technical Implementation

### Phase 1: Service Layer

**File:** `src/services/specMaterialQuoteService.ts`

```typescript
interface SpecMaterialQuoteData {
  // Contact
  fullName: string;
  company: string;
  email: string;
  phone: string;
  
  // Delivery (ALL REQUIRED per PATCH 4)
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  
  // Order Details
  material: string;
  tons: number;
  deliveryDatePreference: string;
  deliveryWindowPreference: string;
  
  // Project Details (optional)
  projectName?: string;
  poNumber?: string;
  specItemDescription?: string;
  notes?: string;
  specFilePath?: string;  // Path only, not URL (PATCH 1)
  multiDropRequested?: boolean;
  multiDropDetails?: string;
  
  // Expedite
  expediteRequested: boolean;
}
```

**Notes Field Builder (PATCH 2):**
```typescript
const buildNotesField = (data: SpecMaterialQuoteData): string => {
  // Human-readable summary line
  const summary = `Spec Quote: ${data.material}, ${data.tons} tons, ${data.company}, ${data.deliveryCity} ${data.deliveryState}`;
  
  // Structured JSON block
  const metaJson = {
    material: data.material,
    tons: data.tons,
    company: data.company,
    project_name: data.projectName || null,
    po_number: data.poNumber || null,
    spec_item_description: data.specItemDescription || null,
    delivery_window: data.deliveryWindowPreference,
    multi_drop_requested: data.multiDropRequested || false,
    multi_drop_details: data.multiDropDetails || null,
    expedite_requested: data.expediteRequested,
    spec_file_path: data.specFilePath || null,
    user_notes: data.notes || null,
    persona: "Contractor/PM/DOT/Utility",
    source: "Spec Materials Landing Page"
  };
  
  return `${summary}\n\n--- MGG_SPEC_META_JSON ---\n${JSON.stringify(metaJson, null, 2)}\n--- END_MGG_SPEC_META_JSON ---`;
};
```

**File Upload Handler (PATCH 1):**
```typescript
const uploadSpecFile = async (file: File, quoteId: string): Promise<string | null> => {
  // Validate file type and size
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) return null;
  if (file.size > 10 * 1024 * 1024) return null; // 10MB max
  
  const filePath = `spec-uploads/${quoteId}/${file.name}`;
  
  const { error } = await supabase.storage
    .from('customer-uploads')  // Using existing bucket
    .upload(filePath, file, { upsert: false });
  
  if (error) {
    console.error('File upload failed:', error);
    return null;
  }
  
  // Return path only, NOT signed URL
  return filePath;
};
```

### Phase 2: Page Components

**Directory:** `src/components/spec-materials-landing/`

#### 2.1 SpecHeroSection.tsx
Clones existing contractors page styling with new copy:

**Headline:** "Spec Materials. On-Time Delivery. One Point of Contact."

**Subhead:** "Nationwide sourcing + dispatch coordination for DOT, civil, and utility projects. Documentation included."

**Badge:** "Serving DOT, Civil & Utility Projects Nationwide"

**CTAs:**
- Primary: "Price & Reserve Delivery" (scrolls to form)
- Secondary: "Request a Quote / Send Specs" (scrolls to form)

#### 2.2 SpecTrustBar.tsx
Horizontal proof points (spec-safe per PATCH 3):

```
Tickets + Documentation | PO / Invoicing Support | 20-1,000+ Tons | Multi-Site Coordination | Vetted Supplier Network
```

#### 2.3 SpecReservationForm.tsx (Core Module)

**Section A: Material Selection**
Dropdown with 7 materials:
- #57 Stone (ASTM/DOT-grade)
- RCA - Recycled Concrete Aggregate
- Dense Graded Base / Road Base (Item 4/304/ABC)
- Stone Dust / Crusher Fines
- #8 Stone (Pipe Bedding)
- #89 Stone (Utility/Drainage)
- Utility Sand (Spec-Only)

**Section B: Quantity**
- Slider + manual input
- Min: 20 tons, Max: 1000 tons, Step: 10

**Section C: Delivery Address (ALL REQUIRED per PATCH 4)**
- Street Address (required)
- City (required)
- State dropdown (required)
- ZIP Code (required)

**Section D: Delivery Schedule**
- Date picker
- Window dropdown: AM (7-11), Midday (11-2), PM (2-6), Best Available

**Section E: Contact Info (ALL REQUIRED)**
- Full Name
- Company
- Email
- Phone

**Section F: Project Details (Collapsible, Optional)**
- Project Name
- PO #
- Spec Item / Description (e.g., "NYSDOT Item 4", "#57 ASTM C33")
- Notes / Spec Notes (textarea)
- File upload (PDF/JPG/PNG, max 10MB)
- Multi-drop toggle: "Multiple drop locations?"

**Section G: Expedite Option**
- Checkbox: "Need same/next day? Add Expedite"
- Note: "Standard lead time: 48 hours. We'll respond within the same business day."

**Primary Button (PATCH 6):** "Save & Request Pricing"

**Honeypot Field:** Hidden `website` field for spam prevention

**Success State:**
- Confirmation message with reference ID
- "A sourcing specialist will follow up within the same business day"

#### 2.4 SpecDocumentationSection.tsx (PATCH 3 - Spec-Safe Copy)

**Headline:** "Documentation & Compliance"

**Bullets:**
- Delivery tickets / scale slips with every load
- COA / gradation reports when available
- Chain of custody documentation where applicable
- PO / net terms coordination
- Invoice handling

#### 2.5 SpecMaterialsGrid.tsx
7 material cards with spec-forward labels:

| Material | Use Case | Spec Note |
|----------|----------|-----------|
| #57 Stone | Drainage, base layers, French drains | ASTM C33 / DOT-grade where applicable |
| RCA | Sub-base, fills, sustainable builds | Acceptance varies by jurisdiction—send your spec |
| Dense Graded Base | Roads, parking pads, foundations | Item 4/304/ABC—confirm regional spec |
| Stone Dust | Paver base, joint fill, compaction | Also called "screenings" or "crusher fines" |
| #8 Stone | Pipe bedding, utility trenches | Per ASTM C33 gradation |
| #89 Stone | Drainage, utilities, backfill | Utility/drainage spec applications |
| Utility Sand | Bedding, backfill | Requires spec confirmation |

Each card has "Select in Checkout" button that scrolls to form and pre-selects material.

#### 2.6 SpecHowItWorks.tsx
5 procurement-focused steps:

1. **Tell us material + tons + site** - Submit your order details
2. **We source + confirm spec match** - Regional supplier validation
3. **Delivery scheduling + dispatch** - Coordinated logistics
4. **Tickets/docs + invoice/PO handling** - Full documentation
5. **Material arrives on-site** - Reliable, on-time delivery

#### 2.7 SpecFAQSection.tsx

1. **"Can you meet DOT/municipal specs?"**
   We source from suppliers commonly used on DOT/municipal work where available, and we'll match to your project spec. Send your item and we'll confirm.

2. **"Do you provide tickets/scale slips?"**
   Yes, every load includes delivery tickets and scale slips for documentation.

3. **"Can you deliver to multiple sites across states?"**
   Yes, we coordinate multi-site deliveries through our nationwide supplier network.

4. **"What's the minimum tonnage?"**
   20 tons minimum per delivery.

5. **"What if the local spec name differs?"**
   Regional naming varies (e.g., ABC vs. 304 vs. Item 4). We match to your spec—just tell us what you're calling it.

6. **"Do you offer after-hours/early AM delivery?"**
   Some markets offer early morning or weekend delivery. Select expedite options for availability.

7. **"How does expedite work?"**
   Request expedite for same/next-day. We'll respond within the same business day to confirm availability.

#### 2.8 SpecFinalCTA.tsx
**Headline:** "Ready to simplify spec material procurement?"
**Buttons:** "Price & Reserve Delivery", "Request a Quote"

#### 2.9 SpecStickyCTA.tsx
Mobile fixed bottom bar with "Price & Reserve" button.

### Phase 3: Analytics Events (PATCH 5)

**File:** `src/utils/analytics.ts` - Add new events:

```typescript
export const trackSpecLPView = () => {
  if (!window.gtag) return;
  window.gtag('event', 'spec_lp_view', {
    page_type: 'spec_materials_landing'
  });
};

export const trackSpecFormStart = (material?: string) => {
  if (!window.gtag) return;
  window.gtag('event', 'spec_form_start', {
    material_selected: material
  });
};

// RENAMED per PATCH 5 to avoid collision
export const trackSpecMaterialSelect = (material: string) => {
  if (!window.gtag) return;
  window.gtag('event', 'spec_material_select', {
    material: material,
    page_type: 'spec_materials_landing'
  });
};

export const trackSpecFormSubmit = (tons: number, material: string, hasSpec: boolean) => {
  if (!window.gtag) return;
  const utmParams = getStoredUTMParams();
  window.gtag('event', 'generate_lead', {
    lead_type: 'spec_material_quote',
    tons: tons,
    material: material,
    has_spec_file: hasSpec,
    ...utmParams
  });
};
```

### Phase 4: Page File with SEO

**File:** `src/pages/ContractorsSpecMaterials.tsx`

```typescript
<Helmet>
  <title>Spec Materials Delivery | #57 Stone, Road Base, RCA | MyGravelGuy</title>
  <meta name="description" content="DOT-grade aggregate delivery for contractors. #57 stone, road base, RCA, stone dust. Tickets, PO support, multi-site coordination. 20-1000+ tons." />
  <link rel="canonical" href="https://mygravelguy.com/contractors-spec-materials" />
  
  {/* Open Graph */}
  <meta property="og:title" content="Spec Materials Delivery for Contractors | MyGravelGuy" />
  <meta property="og:description" content="DOT-grade aggregate delivery with documentation, PO support, and multi-site coordination." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://mygravelguy.com/contractors-spec-materials" />
  
  {/* Twitter Card */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Spec Materials Delivery | MyGravelGuy" />
  <meta name="twitter:description" content="DOT-grade aggregate delivery for contractors." />
  
  {/* JSON-LD Structured Data */}
  <script type="application/ld+json">{`
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Spec Materials Delivery",
      "provider": {
        "@type": "LocalBusiness",
        "name": "MyGravelGuy"
      },
      "description": "DOT-grade aggregate delivery for construction contractors",
      "areaServed": "United States"
    }
  `}</script>
</Helmet>
```

### Phase 5: Route Configuration

**File:** `src/App.tsx`

Add import and route:
```typescript
import ContractorsSpecMaterials from "./pages/ContractorsSpecMaterials";

// In Routes:
<Route path="/contractors-spec-materials" element={<ContractorsSpecMaterials />} />
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/ContractorsSpecMaterials.tsx` | Main page with SEO tags |
| `src/services/specMaterialQuoteService.ts` | Quote submission with JSON notes |
| `src/components/spec-materials-landing/SpecHeroSection.tsx` | Hero with CTAs |
| `src/components/spec-materials-landing/SpecTrustBar.tsx` | Proof points strip |
| `src/components/spec-materials-landing/SpecReservationForm.tsx` | Checkout-style form |
| `src/components/spec-materials-landing/SpecDocumentationSection.tsx` | Compliance bullets |
| `src/components/spec-materials-landing/SpecMaterialsGrid.tsx` | Material cards grid |
| `src/components/spec-materials-landing/SpecHowItWorks.tsx` | 5-step process |
| `src/components/spec-materials-landing/SpecFAQSection.tsx` | FAQ accordion |
| `src/components/spec-materials-landing/SpecFinalCTA.tsx` | Closing CTA |
| `src/components/spec-materials-landing/SpecStickyCTA.tsx` | Mobile sticky bar |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add route `/contractors-spec-materials` |
| `src/utils/analytics.ts` | Add spec LP tracking events (with `spec_material_select`) |

---

## Design System (Maintained)

All components use the established dark palette:
- Background: `#0F1115`
- Section alt: `#151A22`
- Accent: `#BADF24` (lime green)
- Text primary: `#F5F7FA`
- Text secondary: `#B7C0CC`
- Border: `rgba(255,255,255,0.10)`

---

## JSON Payload Structure

Stored in `orders.notes` with delimiter format:

```text
Spec Quote: #57 Stone, 150 tons, Acme Construction, Nashville TN

--- MGG_SPEC_META_JSON ---
{
  "material": "#57 Stone (ASTM/DOT-grade)",
  "tons": 150,
  "company": "Acme Construction",
  "project_name": "Highway 40 Drainage",
  "po_number": "PO-2024-5567",
  "spec_item_description": "TDOT Item 903.01",
  "delivery_window": "AM (7-11)",
  "multi_drop_requested": false,
  "multi_drop_details": null,
  "expedite_requested": true,
  "spec_file_path": "spec-uploads/QUOTE-20260201-123456/spec-sheet.pdf",
  "user_notes": "Need COD documentation",
  "persona": "Contractor/PM/DOT/Utility",
  "source": "Spec Materials Landing Page"
}
--- END_MGG_SPEC_META_JSON ---
```

---

## Validation Summary (PATCH 4)

**Required Fields:**
- Full Name (min 2 chars)
- Company (min 2 chars)
- Email (valid format)
- Phone (min 10 digits)
- Street Address (min 5 chars)
- City (min 2 chars)
- State (from dropdown)
- ZIP Code (5 digits)
- Material (selected)
- Tons (20-1000)

---

## Security Considerations

1. **Private file storage** - paths only, signed URLs generated on-demand (PATCH 1)
2. **Honeypot field** for spam prevention
3. **Zod validation** on all inputs
4. **File constraints**: PDF/JPG/PNG only, 10MB max
5. **Backend email handling** via Edge Function
6. **Existing RLS policies** protect the orders table

---

## Testing Checklist

1. Visit `/contractors-spec-materials` and verify all sections render
2. Test form validation - especially full address requirement (PATCH 4)
3. Test file upload with valid/invalid types and sizes
4. Verify form submission creates quote with structured JSON in notes (PATCH 2)
5. Confirm button says "Save & Request Pricing" (PATCH 6)
6. Check analytics events fire with `spec_material_select` name (PATCH 5)
7. Verify documentation copy uses spec-safe language (PATCH 3)
8. Test mobile responsiveness and sticky CTA
9. Verify SEO tags in page source

