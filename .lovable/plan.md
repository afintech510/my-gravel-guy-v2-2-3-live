
# Enhancement Plan: Lead Integration, Quote Summary, and UI Improvements

## Overview
This plan covers three main areas of work:
1. **Lead Table Integration**: Connect contact forms and cart saves to create entries in the `leads` table
2. **Quote Summary Enhancement**: Add total supplier price, price per ton, and total tons to the action bar
3. **UI/UX Improvements**: Fix text readability, make quotes clickable for editing, and enhance sidebar modules

---

## Part 1: Lead Table Integration

### What Gets Connected
When users submit any of these forms or actions, a lead will automatically be created in the `leads` table:

| Source | Display Name Format | Material | Job Location |
|--------|---------------------|----------|--------------|
| Contact Quote Form (`ContactQuoteForm.tsx`) | Customer name | Selected material | ZIP code only |
| General Quote Form (`QuoteForm.tsx`) | Customer name | Selected material | ZIP code only |
| Contractors Quote Form (`contractors-landing/QuoteForm.tsx`) | Customer name | Selected material | ZIP code only |
| Spec Materials Form (`specMaterialQuoteService.ts`) | "Company - Contact" | Spec material | Full address |
| Market Quote Module (`ManagedQuoteModule.tsx`) | "Company - Contact" | Page material | ZIP code only |
| Cart Save (`cartInsertService.ts`) | Contact name | Product names | Full delivery address |

### Technical Changes

**New Service Function**: `src/services/supplierQuoteService.ts`
- Add `createLeadFromForm()` helper that takes form data and creates a lead entry
- Handle different form formats (contact, cart, spec materials)

**Integration Points**:
1. `src/services/quoteOrderService.ts` - After creating quote order, also create lead
2. `src/services/quoteEmailService.ts` - Hook into sendQuoteRequestEmail
3. `src/services/specMaterialQuoteService.ts` - After creating spec quote, create lead
4. `src/services/cartInsertService.ts` - After saving cart, create lead
5. `src/components/market-landing/ManagedQuoteModule.tsx` - Submit to leads table
6. `src/components/contact/ContactQuoteForm.tsx` - Create lead on submit

---

## Part 2: Quote Summary Enhancement

### Current State
The action bar shows a simple `price_summary` string like "$22.50/ton + Delivery Incl."

### New Summary Display
The action bar will show a detailed breakdown:

```
Summary: $2,475.00 Total | $22.50/ton | 110 tons
         └─ Materials + Delivery + Fees
```

### Calculation Logic (in ActionBar.tsx)
```typescript
// Calculate total supplier cost
const calculateTotalCost = (data, flags) => {
  const tons = parseFloat(data.qty_tons) || 0;
  
  if (flags.is_all_in) {
    return parseFloat(data.all_in_delivered_total) || 0;
  }
  
  let materialCost = 0;
  if (flags.material_is_total) {
    materialCost = parseFloat(data.material_price) || 0;
  } else {
    materialCost = (parseFloat(data.material_price) || 0) * tons;
  }
  
  let deliveryCost = 0;
  if (!flags.delivery_included) {
    deliveryCost = parseFloat(data.delivery_rate) || 0;
  }
  
  // Add CC fee if applicable
  const subtotal = materialCost + deliveryCost;
  const ccFee = (parseFloat(data.cc_fee_percent) || 0) / 100 * subtotal;
  
  return subtotal + ccFee;
};
```

### Files Modified
- `src/components/supplier-quotes/ActionBar.tsx` - Add props for form data and flags, compute totals

---

## Part 3: UI/UX Improvements

### 3A: Fix Text Readability on Sidebar Modules

**Problem**: Light green text on right side modules is hard to read

**Solution**: Update these components to use dark text:
- `SidebarKPIs.tsx` - Already uses `text-foreground`, verify it works
- `RecentLeadsList.tsx` - Change text colors
- `QuotesForLeadList.tsx` - Change text colors
- `RecentQuotesList.tsx` - Change text colors

**Pattern**: Replace any `text-primary` or similar with `text-foreground` for main content

### 3B: Clickable Quotes for Editing

**Current State**: Clicking a lead populates the form, but quotes are not clickable

**New Behavior**:
1. Click a quote in "Quotes For [Lead]" or "Recent Quotes" list
2. Form loads with that quote's data
3. Lead is auto-selected if quote has a lead_id
4. All fields become editable
5. Save button updates the existing quote (not creates new)

**Implementation**:
1. Add `getSupplierQuoteById()` to service
2. Add `updateSupplierQuote()` to service  
3. Add `selectedQuoteId` state to `DashboardSupplierQuotes.tsx`
4. Add `onSelectQuote` handler that:
   - Fetches quote details
   - Populates form data and flags
   - Sets editing mode
5. Modify Save button to call update vs insert based on editing state
6. Add quote click handlers to `QuotesForLeadList` and `RecentQuotesList`

### 3C: Enhanced Sidebar Module Content

**RecentLeadsList.tsx** changes:
- Show city, state after name
- Better font contrast (dark text)
- Already scrollable (verify)

**QuotesForLeadList.tsx** changes:
- Show state in location
- Add total price, price/ton, total tons
- Dark text for readability
- Make scrollable if not already
- Make each quote clickable

**RecentQuotesList.tsx** changes:
- Show state in location
- Add total price, price/ton, total tons
- Dark text for all content
- Make each quote clickable
- Already has scroll area (verify)

**Quote Tile Display Format**:
```
┌─────────────────────────────────────┐
│ Texas Aggregate Supply       2:30pm │
│ 57 Stone                            │
│ Austin, TX                          │
│ $2,475.00 • $22.50/ton • 110 tons   │ ← NEW
└─────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supplierQuoteService.ts` | Add `createLeadFromForm()`, `getSupplierQuoteById()`, `updateSupplierQuote()` |
| `src/services/quoteOrderService.ts` | Call `createLeadFromForm()` after quote creation |
| `src/services/specMaterialQuoteService.ts` | Call `createLeadFromForm()` after spec quote |
| `src/services/cartInsertService.ts` | Call `createLeadFromForm()` after cart save |
| `src/components/market-landing/ManagedQuoteModule.tsx` | Submit to leads table |
| `src/components/contact/ContactQuoteForm.tsx` | Create lead on form submit |
| `src/pages/DashboardSupplierQuotes.tsx` | Add quote selection/editing state, pass form data to ActionBar |
| `src/components/supplier-quotes/ActionBar.tsx` | Calculate and display detailed pricing summary |
| `src/components/supplier-quotes/SidebarKPIs.tsx` | Verify dark text colors |
| `src/components/supplier-quotes/RecentLeadsList.tsx` | Add city/state, fix text colors |
| `src/components/supplier-quotes/QuotesForLeadList.tsx` | Add pricing, state, clickable, dark text |
| `src/components/supplier-quotes/RecentQuotesList.tsx` | Add pricing, state, clickable, dark text |
| `src/types/supplierQuote.types.ts` | Add helper function for computing totals from quote data |

---

## Technical Details

### Lead Creation Helper Function
```typescript
interface LeadFromFormData {
  displayName: string;
  email?: string;
  phone?: string;
  material?: string;
  requestedQty?: number;
  requestedUnit?: string;
  jobAddress?: string;
  jobCity?: string;
  jobState?: string;
  jobZip?: string;
  timeline?: string;
  notes?: string;
}

export async function createLeadFromForm(data: LeadFromFormData): Promise<Lead | null> {
  const lead: LeadInsert = {
    display_name: data.displayName,
    email: data.email,
    phone: data.phone,
    material: data.material,
    requested_qty: data.requestedQty,
    requested_unit: data.requestedUnit || 'tons',
    job_address: data.jobAddress,
    job_city: data.jobCity,
    job_state: data.jobState,
    job_zip: data.jobZip,
    timeline: data.timeline,
    notes: data.notes,
  };
  return createLead(lead);
}
```

### Quote Pricing Calculator
```typescript
export function calculateQuoteTotals(quote: SupplierQuote): {
  totalCost: number;
  pricePerTon: number;
  totalTons: number;
} {
  const tons = quote.qty_tons || 0;
  
  let totalCost = 0;
  if (quote.is_all_in) {
    totalCost = quote.all_in_delivered_total || 0;
  } else {
    const materialCost = quote.material_is_total 
      ? (quote.material_price || 0)
      : (quote.material_price || 0) * tons;
    const deliveryCost = quote.delivery_included ? 0 : (quote.delivery_rate || 0);
    const subtotal = materialCost + deliveryCost;
    const ccFee = ((quote.cc_fee_percent || 0) / 100) * subtotal;
    totalCost = subtotal + ccFee;
  }
  
  const pricePerTon = tons > 0 ? totalCost / tons : 0;
  
  return { totalCost, pricePerTon, totalTons: tons };
}
```

---

## Summary

This plan delivers:
1. **Lead funnel integration** - All contact forms and cart saves create leads for the supplier quotes system
2. **Enhanced quote summary** - Action bar shows total cost, $/ton, and tonnage for quick reference
3. **Better readability** - Dark text throughout sidebar modules for accessibility
4. **Quote editing workflow** - Click any quote to load and edit it
5. **Richer sidebar tiles** - Leads show location, quotes show pricing breakdown
