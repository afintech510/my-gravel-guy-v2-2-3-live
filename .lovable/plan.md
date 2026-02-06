

# Supplier Quotes Dashboard Tab - Updated Implementation Plan (v2)

## Overview
Create a new dashboard page at `/dashboard/supplier-quotes` for capturing supplier quotes. This updated plan incorporates the **product linking requirement** - when a supplier quote is created, the material field should be linked to a product from the `products` table with typeahead/autocomplete functionality.

---

## Key Change: Product Association

### Requirement Summary
1. **Rename `spec_name` to `material`** - The material field in Project Requirements should be linked to products
2. **Add `product_id` foreign key** - Store the selected product's UUID in `supplier_quotes`
3. **Typeahead autocomplete** - As user types in the Material field, suggest matching products from the `products` table
4. **Flexible input** - Allow both selecting from products AND entering custom material names (for specs not in catalog)

---

## Database Schema Changes

### Table: `supplier_quotes` (Updated)
```sql
CREATE TABLE supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  
  -- Product Association (NEW)
  product_id UUID REFERENCES products(id),  -- Link to products table
  material TEXT,  -- Display name / custom material if not in products
  
  -- Supplier Module
  supplier_name TEXT,
  supplier_phone TEXT,
  supplier_address TEXT,
  supplier_notes TEXT,
  
  -- Project Requirements (material moved above)
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

-- Indexes
CREATE INDEX idx_supplier_quotes_lead ON supplier_quotes(lead_id, created_at DESC);
CREATE INDEX idx_supplier_quotes_recent ON supplier_quotes(created_at DESC);
CREATE INDEX idx_supplier_quotes_product ON supplier_quotes(product_id);
```

### Table: `leads` (No Changes)
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

---

## Material Autocomplete Component

### New Component: `ProductAutocomplete.tsx`

This component will provide typeahead functionality for the Material field:

```typescript
interface ProductAutocompleteProps {
  value: string;                    // Current material text
  productId: string | null;         // Selected product UUID (if any)
  onSelect: (product: Product | null, customText?: string) => void;
  placeholder?: string;
}
```

**Features:**
1. Uses existing `cmdk` (Command) components from shadcn/ui
2. Fetches products using existing `getProducts()` from `src/services/products/productQueries.ts`
3. Filters products as user types (name and category matching)
4. Shows product name + category in dropdown
5. Allows custom text entry if no product matches (for spec materials not in catalog)
6. Stores both `product_id` (UUID) and `material` (display text)

**UI Behavior:**
- On focus: Show dropdown with recent/popular products
- On type: Filter products matching search term
- On select: Set `product_id` and `material` text
- On custom entry: Set `product_id` to null, keep `material` as typed text
- Shows "Use custom material: {text}" option when no exact match

### Component Pattern (Based on Existing ProductSelector)
```tsx
// src/components/supplier-quotes/ProductAutocomplete.tsx

import { useState, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Package } from 'lucide-react';
import { getProducts } from '@/services/products/productQueries';
import { Product } from '@/services/productTypes';

export function ProductAutocomplete({ 
  value, 
  productId, 
  onSelect, 
  placeholder = "Search or type material..." 
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  
  useEffect(() => {
    getProducts().then(setProducts);
  }, []);
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearchTerm(product.name);
    setOpen(false);
  };
  
  const handleCustomEntry = () => {
    onSelect(null, searchTerm);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {searchTerm && (
                <button onClick={handleCustomEntry} className="w-full p-2 text-left hover:bg-accent">
                  Use custom: "{searchTerm}"
                </button>
              )}
            </CommandEmpty>
            <CommandGroup heading="Products">
              {filteredProducts.slice(0, 10).map(product => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  <span>{product.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {product.category}
                  </span>
                  {productId === product.id && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Updated State Structure

### Form Data (Updated)
```typescript
const INITIAL_DATA = {
  lead_id: '',
  supplier_name: '',
  supplier_phone: '',
  supplier_address: '',
  supplier_notes: '',
  
  // Product Association (UPDATED)
  product_id: null as string | null,  // UUID from products table
  material: '',                        // Display name or custom text
  
  spec_requirement: '',
  application: '',
  amount_tons: '',
  amount_cuyd: '',
  delivery_address: '',
  delivery_city: '',
  delivery_state: '',
  delivery_zip: '',
  site_access: [] as string[],
  project_notes: '',
  
  // ... rest of fields unchanged
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
  truck_size_options: [] as string[],
  truck_size_other: '',
  payment_methods: [] as string[],
  cc_fee_percent: '0',
  payment_notes: '',
  adjust_to_load_tickets: false,
};
```

---

## Updated ProjectRequirementsCard.tsx

The Material field will now use the ProductAutocomplete component:

```tsx
// In ProjectRequirementsCard.tsx

<InputGroup label="Material">
  <ProductAutocomplete
    value={data.material}
    productId={data.product_id}
    onSelect={(product, customText) => {
      if (product) {
        // User selected a product from the list
        setData(prev => ({
          ...prev,
          product_id: product.id as string,
          material: product.name
        }));
      } else if (customText) {
        // User entered custom material text
        setData(prev => ({
          ...prev,
          product_id: null,
          material: customText
        }));
      }
    }}
    placeholder="Search products or enter custom material..."
  />
</InputGroup>
```

---

## Updated TypeScript Interfaces

### File: `src/types/supplierQuote.types.ts`

```typescript
export interface Lead {
  id: string;
  display_name: string;
  phone?: string;
  email?: string;
  material?: string;
  requested_qty?: number;
  requested_unit?: string;
  job_address?: string;
  job_city?: string;
  job_state?: string;
  job_zip?: string;
  target_price?: number;
  timeline?: string;
  site_access?: string[];
  notes?: string;
  created_at: string;
}

export interface SupplierQuote {
  id: string;
  lead_id?: string;
  
  // Product Association (NEW)
  product_id?: string;  // FK to products table
  material?: string;    // Display name or custom
  
  // Supplier
  supplier_name?: string;
  supplier_phone?: string;
  supplier_address?: string;
  supplier_notes?: string;
  
  // Project Requirements
  qty_tons?: number;
  qty_cy?: number;
  spec_requirement?: string;
  application?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  site_access?: string[];
  project_notes?: string;
  
  // Quote Details Flags
  is_all_in?: boolean;
  material_is_unit?: boolean;
  material_is_total?: boolean;
  delivery_included?: boolean;
  delivery_flat?: boolean;
  delivery_hourly?: boolean;
  
  // Quote Details Values
  material_price?: number;
  material_unit?: string;
  delivery_rate?: number;
  delivery_basis?: string;
  all_in_delivered_total?: number;
  max_qty_per_load?: number;
  max_qty_unit?: string;
  lead_time?: string;
  lead_time_notes?: string;
  available_trucks?: string[];
  truck_notes?: string;
  
  // Billing & Payment
  payment_methods?: string[];
  cc_fee_percent?: number;
  bill_by_load_tickets?: boolean;
  payment_notes?: string;
  
  // Computed
  price_summary?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
}

export interface SupplierQuoteInsert extends Omit<SupplierQuote, 'id' | 'created_at'> {}
```

---

## Service Layer Updates

### File: `src/services/supplierQuoteService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import { Lead, SupplierQuote, SupplierQuoteInsert } from '@/types/supplierQuote.types';

// Create a new supplier quote with product association
export async function createSupplierQuote(quote: SupplierQuoteInsert): Promise<SupplierQuote> {
  const { data, error } = await supabase
    .from('supplier_quotes')
    .insert({
      ...quote,
      product_id: quote.product_id || null,  // Store product FK if selected
      material: quote.material,               // Store material display name
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Fetch quotes with product details joined
export async function fetchSupplierQuotes(limit = 20): Promise<SupplierQuote[]> {
  const { data, error } = await supabase
    .from('supplier_quotes')
    .select(`
      *,
      product:products(id, name, category)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data || [];
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/DashboardSupplierQuotes.tsx` | Main page with 2-column layout |
| `src/services/supplierQuoteService.ts` | CRUD for leads and quotes |
| `src/types/supplierQuote.types.ts` | TypeScript interfaces |
| `src/components/supplier-quotes/ProductAutocomplete.tsx` | **NEW** - Material typeahead component |
| `src/components/supplier-quotes/SupplierCard.tsx` | Card 1 |
| `src/components/supplier-quotes/ProjectRequirementsCard.tsx` | Card 2 with lead selector + **product autocomplete** |
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
| `src/components/dashboard/DashboardSidebar.tsx` | Add "Supplier Quotes" nav item |
| `src/App.tsx` | Add route `/dashboard/supplier-quotes` |

---

## Implementation Phases

### Phase 1: Database Setup (Manual SQL)
Since migrations are declined, you'll need to run this SQL manually in Supabase:
1. Create `leads` table
2. Create `supplier_quotes` table with `product_id` FK
3. Add RLS policies

### Phase 2: Types + Service Layer
1. Create `supplierQuote.types.ts` with interfaces
2. Create `supplierQuoteService.ts` with CRUD functions

### Phase 3: ProductAutocomplete Component
1. Create the typeahead component using existing `cmdk` and `Popover`
2. Integrate with `getProducts()` for data fetching
3. Support both product selection and custom text entry

### Phase 4: Form Cards + Layout
1. Build all 4 form cards using prototype patterns
2. Integrate ProductAutocomplete in ProjectRequirementsCard
3. Implement toggle exclusivity logic

### Phase 5: Sidebar + Main Page
1. Build sidebar components (KPIs, lists)
2. Create main page with 2-column layout
3. Wire up React Query for data fetching

### Phase 6: Routing + Navigation
1. Add nav item to DashboardSidebar
2. Add route to App.tsx

---

## Testing Checklist
1. Material field shows autocomplete suggestions from products table
2. Selecting a product stores both `product_id` and `material` name
3. Custom text entry stores `material` with null `product_id`
4. Quotes display correctly with product association in sidebar lists
5. Toggle exclusivity works correctly
6. Save/Reset flow works as expected

