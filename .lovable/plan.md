

# Supplier Quotes Dashboard Tab - Updated Implementation Plan

## Overview
Create a new dashboard page at `/dashboard/supplier-quotes` for capturing supplier quotes. This plan now includes the **reference HTML prototype code** and **field layout preferences** from the uploaded sample.

---

## Reference Design Assets

### Screenshot Reference
The uploaded screenshot (`user-uploads://image-25.png`) shows the exact field layout with:
- Dark slate theme (`bg-slate-900`, `bg-slate-800`)
- Orange accent color (`bg-orange-600`, `text-orange-500`)
- 2-column responsive grid for form fields
- Pill-style multi-select buttons for Site Access, Trucks, Payment Methods
- Checkbox-style toggle buttons for Quote Details flags

### HTML Prototype Reference
The uploaded HTML file (`mgg-supplier-quote-capture.html`) contains production-ready React component patterns to reuse.

---

## Key Code Patterns from Prototype

### 1. Initial State Structure
```typescript
const INITIAL_FLAGS = {
  all_in: false,
  material_is_unit: true,
  material_is_total: false,
  delivery_included: false,
  delivery_flat: true,
  delivery_hourly: false,
};

const INITIAL_DATA = {
  lead_id: '',
  supplier_name: '',
  supplier_phone: '',
  supplier_address: '',
  supplier_notes: '',
  spec_name: '',
  spec_description: '',
  spec_application: '',
  spec_requirement: '',
  amount_tons: '',
  amount_cuyd: '',
  delivery_address: '',
  delivery_city: '',
  delivery_state: '',
  delivery_zip: '',
  site_access: [],
  material_price: '',
  material_unit: 'ton',
  delivered_total: '',
  delivery_rate: '',
  delivery_basis: 'total',
  delivery_notes: '',
  max_qty_per_delivery: '',
  max_qty_unit: 'ton',
  lead_time: '',
  lead_time_notes: '',
  truck_size_options: [],
  truck_size_other: '',
  payment_methods: [],
  cc_fee_percent: '0',
  payment_notes: '',
  adjust_to_load_tickets: false,
};
```

### 2. Price Summary Generator
```typescript
const generatePriceSummary = (data, flags) => {
  if (flags.all_in && data.delivered_total) {
    return `Delivered Total $${data.delivered_total}`;
  }

  const parts = [];
  
  // Material Part
  if (data.material_price) {
    if (flags.material_is_total) {
      parts.push(`$${data.material_price} Total Mat`);
    } else {
      parts.push(`$${data.material_price}/${data.material_unit}`);
    }
  }

  // Delivery Part
  if (flags.delivery_included) {
    parts.push(`Del. Incl.`);
  } else if (data.delivery_rate) {
    if (flags.delivery_hourly) {
      parts.push(`$${data.delivery_rate}/hr`);
    } else {
      parts.push(`$${data.delivery_rate} Del.`);
    }
  }

  // Max Load Part
  if (data.max_qty_per_delivery) {
    parts.push(`Max ${data.max_qty_per_delivery} ${data.max_qty_unit}`);
  }

  if (parts.length === 0) return "Draft Quote";
  return parts.join(" • ");
};
```

### 3. Toggle Exclusivity Logic
```typescript
const handleFlagChange = (key) => {
  setFlags(prev => {
    const next = { ...prev, [key]: !prev[key] };
    
    // Enforce exclusivity: Material
    if (key === 'material_is_unit' && next.material_is_unit) next.material_is_total = false;
    if (key === 'material_is_total' && next.material_is_total) next.material_is_unit = false;

    // Enforce exclusivity: Delivery
    if (key === 'delivery_flat' && next.delivery_flat) {
      next.delivery_hourly = false;
      next.delivery_included = false;
    }
    if (key === 'delivery_hourly' && next.delivery_hourly) {
      next.delivery_flat = false;
      next.delivery_included = false;
    }
    if (key === 'delivery_included' && next.delivery_included) {
      next.delivery_flat = false;
      next.delivery_hourly = false;
    }

    return next;
  });
};
```

### 4. Reusable UI Components

#### SectionHeader Component
```tsx
const SectionHeader = ({ icon: IconComponent, title, children }) => (
  <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2 gap-2">
    <div className="flex items-center gap-2">
      <IconComponent className="w-5 h-5 text-orange-500" />
      <h3 className="text-lg font-semibold text-slate-100 whitespace-nowrap">{title}</h3>
    </div>
    {children && <div className="flex-shrink-0">{children}</div>}
  </div>
);
```

#### InputGroup Component
```tsx
const InputGroup = ({ label, helper, children }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
    {children}
    {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
  </div>
);
```

#### CheckboxBtn (Toggle Button) Component
```tsx
const CheckboxBtn = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all w-full text-left
      ${checked 
        ? 'bg-orange-900/30 text-orange-200 border border-orange-700' 
        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'}
    `}
  >
    {checked ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
    {label}
  </button>
);
```

#### Pill Multi-Select Pattern (Trucks)
```tsx
{[
  { id: 'small_upto_10', label: 'Small ≤10t' },
  { id: 'med_10_19', label: 'Med 10-19t' },
  { id: 'tri_axle_20_22', label: 'Tri 20-22t' },
  { id: 'quad_23_25', label: 'Quad 23-25t' },
  { id: 'semi_25_27', label: 'Semi 25-27t' },
  { id: 'semi_28_30', label: 'Semi 28-30t' },
  { id: 'live_bottom_32_35', label: 'Live 32-35t' },
].map(opt => (
  <button
    key={opt.id}
    type="button"
    onClick={() => toggleArrayItem('truck_size_options', opt.id)}
    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
      data.truck_size_options.includes(opt.id) 
        ? 'bg-orange-600 border-orange-500 text-white' 
        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
    }`}
  >
    {opt.label}
  </button>
))}
```

#### Payment Method Pills (Emerald Accent)
```tsx
{['CC', 'Wire', 'ACH', 'NET10', 'NET30', 'Venmo', 'Zelle', 'Paypal', 'CashApp'].map(method => (
  <button
    key={method}
    type="button"
    onClick={() => toggleArrayItem('payment_methods', method)}
    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
      data.payment_methods.includes(method) 
        ? 'bg-emerald-900/40 border-emerald-600 text-emerald-200' 
        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
    }`}
  >
    {method}
  </button>
))}
```

---

## Field Layout (Exact Order from Screenshot)

### Card 1: Supplier
```text
┌─────────────────────────────────────────────────────────────┐
│ 🚚 Supplier                                                 │
├─────────────────────────────────────────────────────────────┤
│ [Supplier Name]          [Phone]                            │
│ [Address (Search)]  ─── full width with MapPin icon         │
│ [Supplier Notes]    ─── full width                          │
└─────────────────────────────────────────────────────────────┘
```

### Card 2: Project Requirements
```text
┌─────────────────────────────────────────────────────────────┐
│ 📦 Project Requirements          [Select Lead... ▼] [+]    │
├─────────────────────────────────────────────────────────────┤
│ [Material]                [Tons]       [Cu Yds]             │
│ [Spec Requirement]        [Application]                     │
│ [Delivery Address] ─ MapPin  │ Site Access: [Small] [Tri-Axle] [Semi/Trailer] │
│ [City] [State] [Zip]         │                              │
│ [Project Notes]  ─── full width textarea                    │
└─────────────────────────────────────────────────────────────┘
```

### Card 3: Quote Details
```text
┌─────────────────────────────────────────────────────────────┐
│ 💲 Quote Details                                            │
├─────────────────────────────────────────────────────────────┤
│ Toggle Grid (2x3):                                          │
│ [✓ Unit Price]   [□ Total Material]   [□ All-in Delivered]  │
│ [✓ Delivery Flat] [□ Delivery Hourly] [□ Delivery Incl.]    │
├─────────────────────────────────────────────────────────────┤
│ [Material Price] [Unit ▼]   │ [Delivery Charge] [Basis ▼]   │
│ [All-In Delivered Total]    │ [Max Qty Per Load] [Unit ▼]   │
│ [Typical Lead Time] 🕐      │ [Lead Time Notes]             │
├─────────────────────────────────────────────────────────────┤
│ Available Trucks:                                           │
│ [Small ≤10t] [Med 10-19t] [Tri 20-22t] [Quad 23-25t]       │
│ [Semi 25-27t] [Semi 28-30t] [Live 32-35t]                  │
│ [Additional Notes]  ─── full width                          │
└─────────────────────────────────────────────────────────────┘
```

### Card 4: Billing & Payment
```text
┌─────────────────────────────────────────────────────────────┐
│ 💳 Billing & Payment                                        │
├─────────────────────────────────────────────────────────────┤
│ Accepted Payment Methods:                                   │
│ [CC] [Wire] [ACH] [NET10] [NET30] [Venmo] [Zelle]          │
│ [Paypal] [CashApp]                                          │
├─────────────────────────────────────────────────────────────┤
│ [CC Fee (%)]               [□] Bill according to Load Tickets│
│ [Payment Notes]  ─── full width                             │
└─────────────────────────────────────────────────────────────┘
```

### Action Bar
```text
┌─────────────────────────────────────────────────────────────┐
│ [🔒 Save Quote]  primary orange    [+ Save & New] secondary │
└─────────────────────────────────────────────────────────────┘
```

---

## Right Sidebar Layout

### KPI Cards (2-column grid)
```text
┌────────────────┐ ┌────────────────┐
│ 📊 Count       │ │ 📈 Last $      │
│ 5              │ │ $34.50/ton...  │
└────────────────┘ └────────────────┘
```

### Recent Leads (Scrollable max-h-64)
```text
┌─────────────────────────────────────┐
│ 👥 Recent Leads                     │
├─────────────────────────────────────┤
│ [John Doe]          01/15/2025      │
│  #57 Stone • 200t                   │
├─────────────────────────────────────┤
│ [ABC Construction]   01/14/2025     │
│  Fill Dirt • 500t                   │
└─────────────────────────────────────┘
```

### Quotes for Selected Lead (Conditional)
```text
┌─────────────────────────────────────┐
│ 📄 Quotes for John Doe              │
├─────────────────────────────────────┤
│ Metro Quarry         2:30 PM        │
│ $34.50/ton • Del. Incl.             │
└─────────────────────────────────────┘
```

### Recent Quotes (All) (Fixed h-[400px])
```text
┌─────────────────────────────────────┐
│ 📄 Recent Quotes (All)              │
├─────────────────────────────────────┤
│ Metro Quarry Supply   3:45 PM       │
│ #57 Limestone                       │
│ $34.50/ton • $125 Del. • Max 22 ton │
│ 📍 Riverhead                        │
└─────────────────────────────────────┘
```

---

## Style Tokens (Map to MGG Theme)

### Prototype Colors to MGG Theme Mapping
| Prototype Token | Prototype Value | MGG Equivalent |
|-----------------|-----------------|----------------|
| `bg-slate-950` | `#020617` | `bg-background` (dark mode) |
| `bg-slate-900` | `#0f172a` | `bg-card` / `bg-muted` |
| `bg-slate-800` | `#1e293b` | Input backgrounds |
| `border-slate-700` | `#334155` | `border-border` |
| `text-slate-200` | `#e2e8f0` | `text-foreground` |
| `text-slate-400` | `#94a3b8` | `text-muted-foreground` |
| `bg-orange-600` | `#ea580c` | `bg-primary` (or keep orange for internal tools) |
| `bg-emerald-600` | `#059669` | Payment method accent (keep) |

### Spacing Values (Preserve)
- Card padding: `p-5`
- Section gap: `space-y-6`
- Form field gap: `gap-4`
- Grid columns: `grid-cols-1 md:grid-cols-2`
- Main layout: `grid-cols-1 lg:grid-cols-12` (8 + 4)

### Typography (Preserve)
- Section title: `text-lg font-semibold`
- Field label: `text-sm font-medium`
- Helper text: `text-xs`
- Pill buttons: `text-xs`

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/DashboardSupplierQuotes.tsx` | Main page with 2-column layout |
| `src/services/supplierQuoteService.ts` | CRUD for leads and quotes |
| `src/types/supplierQuote.types.ts` | TypeScript interfaces |
| `src/components/supplier-quotes/SupplierCard.tsx` | Card 1 |
| `src/components/supplier-quotes/ProjectRequirementsCard.tsx` | Card 2 with lead selector |
| `src/components/supplier-quotes/QuoteDetailsCard.tsx` | Card 3 with toggle flags |
| `src/components/supplier-quotes/BillingPaymentCard.tsx` | Card 4 |
| `src/components/supplier-quotes/ActionBar.tsx` | Save buttons |
| `src/components/supplier-quotes/NewLeadModal.tsx` | Modal for new leads |
| `src/components/supplier-quotes/SidebarKPIs.tsx` | KPI cards |
| `src/components/supplier-quotes/RecentLeadsList.tsx` | Leads list |
| `src/components/supplier-quotes/QuotesForLeadList.tsx` | Lead-specific quotes |
| `src/components/supplier-quotes/RecentQuotesList.tsx` | All quotes list |
| `src/components/supplier-quotes/shared/SectionHeader.tsx` | Reusable header |
| `src/components/supplier-quotes/shared/InputGroup.tsx` | Reusable input wrapper |
| `src/components/supplier-quotes/shared/CheckboxBtn.tsx` | Toggle button |
| `src/components/supplier-quotes/shared/PillSelect.tsx` | Multi-select pills |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardSidebar.tsx` | Add "Supplier Quotes" nav item with `ClipboardList` icon |
| `src/App.tsx` | Add route `/dashboard/supplier-quotes` |

---

## Database Schema

### Table: `leads`
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  material TEXT,
  requested_qty NUMERIC,
  requested_unit TEXT DEFAULT 'tons',
  job_address TEXT,
  job_city TEXT,
  job_state TEXT,
  job_zip TEXT,
  target_price NUMERIC,
  timeline TEXT,
  site_access TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `supplier_quotes`
```sql
CREATE TABLE supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  
  -- Supplier
  supplier_name TEXT,
  supplier_phone TEXT,
  supplier_address TEXT,
  supplier_notes TEXT,
  
  -- Project Requirements
  material TEXT,
  qty_tons NUMERIC,
  qty_cy NUMERIC,
  spec_requirement TEXT,
  application TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zip TEXT,
  site_access TEXT[],
  project_notes TEXT,
  
  -- Quote Details Flags
  is_all_in BOOLEAN DEFAULT false,
  material_is_unit BOOLEAN DEFAULT true,
  material_is_total BOOLEAN DEFAULT false,
  delivery_included BOOLEAN DEFAULT false,
  delivery_flat BOOLEAN DEFAULT true,
  delivery_hourly BOOLEAN DEFAULT false,
  
  -- Quote Details Values
  material_price NUMERIC,
  material_unit TEXT DEFAULT 'ton',
  delivery_rate NUMERIC,
  delivery_basis TEXT DEFAULT 'total',
  all_in_delivered_total NUMERIC,
  max_qty_per_load NUMERIC,
  max_qty_unit TEXT DEFAULT 'ton',
  lead_time TEXT,
  lead_time_notes TEXT,
  available_trucks TEXT[],
  truck_notes TEXT,
  
  -- Billing & Payment
  payment_methods TEXT[],
  cc_fee_percent NUMERIC DEFAULT 0,
  bill_by_load_tickets BOOLEAN DEFAULT false,
  payment_notes TEXT,
  
  -- Computed
  price_summary TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

CREATE INDEX idx_supplier_quotes_lead ON supplier_quotes(lead_id, created_at DESC);
CREATE INDEX idx_supplier_quotes_recent ON supplier_quotes(created_at DESC);
```

---

## Implementation Checklist

### Phase 1: Database + Types
- [ ] Create `leads` table migration
- [ ] Create `supplier_quotes` table migration
- [ ] Define TypeScript interfaces in `supplierQuote.types.ts`

### Phase 2: Service Layer
- [ ] Create `supplierQuoteService.ts` with CRUD functions
- [ ] Implement `generatePriceSummary()` helper

### Phase 3: Shared UI Components
- [ ] `SectionHeader` component
- [ ] `InputGroup` component
- [ ] `CheckboxBtn` toggle component
- [ ] `PillSelect` multi-select component

### Phase 4: Form Cards
- [ ] `SupplierCard` (Supplier Name, Phone, Address, Notes)
- [ ] `ProjectRequirementsCard` (Lead selector, Material, Qty, Address, Site Access)
- [ ] `QuoteDetailsCard` (Flags, Pricing, Trucks)
- [ ] `BillingPaymentCard` (Payment methods, CC Fee, Load Tickets)
- [ ] `ActionBar` (Save Quote, Save & New)

### Phase 5: Sidebar Components
- [ ] `SidebarKPIs` (Count, Last $)
- [ ] `RecentLeadsList`
- [ ] `QuotesForLeadList`
- [ ] `RecentQuotesList`

### Phase 6: Main Page + Modal
- [ ] `DashboardSupplierQuotes` page with 2-column layout
- [ ] `NewLeadModal` for creating leads
- [ ] State management and React Query integration

### Phase 7: Routing + Navigation
- [ ] Add nav item to DashboardSidebar
- [ ] Add route to App.tsx

### Phase 8: Testing
- [ ] Verify toggle exclusivity
- [ ] Test save/reset flow
- [ ] Verify sidebar updates
- [ ] Mobile responsiveness

