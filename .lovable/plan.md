

# Lead Data Loading & Cart Integration for Supplier Quotes

## Status: ✅ COMPLETED

## Overview

This plan ensures that:
1. **All lead fields load into the Project Requirements module** when a lead is selected
2. **Cart saves capture delivery scheduling data** into the leads table
3. **NEW: A "Save Lead" button** in the module header allows updating lead data directly

---

## Current State Analysis

### What's Already Working
- `SupplierQuoteFormData` already has `contact_phone`, `contact_email`, `delivery_date`, `delivery_time`, `delivery_instructions` fields
- The `ProjectRequirementsCard` component displays these fields

### What's Broken/Missing
1. **`handleSelectLead`** only populates 8 fields - missing contact/delivery fields
2. **`Lead` interface** missing delivery scheduling fields
3. **Database `leads` table** missing 3 delivery scheduling columns
4. **Cart insert service** doesn't capture delivery scheduling
5. **No "Save Lead" button** to update lead data from the form

---

## Phase 1: Database Schema Update

Add three columns to the `leads` table for delivery scheduling data:

```sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS delivery_date date,
ADD COLUMN IF NOT EXISTS delivery_time_preference text,
ADD COLUMN IF NOT EXISTS delivery_instructions text;
```

---

## Phase 2: Type Updates

### File: `src/types/supplierQuote.types.ts`

Add new fields to the `Lead` interface:

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
  // NEW FIELDS
  delivery_date?: string;
  delivery_time_preference?: string;
  delivery_instructions?: string;
  created_at: string;
}
```

---

## Phase 3: Service Updates

### File: `src/services/supplierQuoteService.ts`

**Add `updateLead` function:**
```typescript
export async function updateLead(id: string, updates: Partial<LeadInsert>): Promise<Lead | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating lead:', error);
      return null;
    }
    return data as Lead;
  } catch (err) {
    console.error('Error updating lead:', err);
    return null;
  }
}
```

**Update `LeadFromFormData` interface:**
```typescript
export interface LeadFromFormData {
  // ... existing fields
  deliveryDate?: string;
  deliveryTimePreference?: string;
  deliveryInstructions?: string;
}
```

**Update `createLeadFromForm` function** to map the new fields.

---

## Phase 4: Cart Insert Service Update

### File: `src/services/cartInsertService.ts`

Pass delivery scheduling data when creating a lead from cart save:

```typescript
await createLeadFromForm({
  displayName: firstItem.contactInfo.name,
  email: firstItem.contactInfo.email,
  phone: firstItem.contactInfo.phone,
  material: productNames,
  requestedQty: totalTons,
  requestedUnit: 'tons',
  jobAddress: firstAddress?.deliveryAddress?.street,
  jobCity: firstAddress?.deliveryAddress?.city,
  jobState: firstAddress?.deliveryAddress?.state,
  jobZip: firstAddress?.deliveryAddress?.zip,
  // NEW: Capture delivery scheduling
  deliveryDate: firstItem.deliveryDate?.toISOString().split('T')[0],
  deliveryTimePreference: firstItem.deliveryTimePreference,
  deliveryInstructions: firstItem.deliveryInstructions,
  notes: `Cart saved: ${cartId}`,
});
```

---

## Phase 5: Lead Selection - Load ALL Fields

### File: `src/pages/DashboardSupplierQuotes.tsx`

Update `handleSelectLead` to populate ALL lead fields (currently 8, updating to 14):

```typescript
const handleSelectLead = useCallback(
  (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setEditingQuoteId(null);
      setFormData((prev) => ({
        ...prev,
        lead_id: leadId,
        // Material & Quantity
        material: lead.material || prev.material,
        qty_tons: lead.requested_qty?.toString() || prev.qty_tons,
        // Contact Info (NEW)
        contact_phone: lead.phone || prev.contact_phone,
        contact_email: lead.email || prev.contact_email,
        // Delivery Location
        delivery_address: lead.job_address || prev.delivery_address,
        delivery_city: lead.job_city || prev.delivery_city,
        delivery_state: lead.job_state || prev.delivery_state,
        delivery_zip: lead.job_zip || prev.delivery_zip,
        site_access: lead.site_access || prev.site_access,
        // Delivery Scheduling (NEW)
        delivery_date: lead.delivery_date || prev.delivery_date,
        delivery_time: lead.delivery_time_preference || prev.delivery_time,
        delivery_instructions: lead.delivery_instructions || prev.delivery_instructions,
        // Notes (NEW)
        project_notes: lead.notes || prev.project_notes,
      }));
    }
  },
  [leads],
);
```

---

## Phase 6: Save Lead Button

### File: `src/components/supplier-quotes/ProjectRequirementsCard.tsx`

**Add new prop and button to the header row:**

```typescript
interface ProjectRequirementsCardProps {
  data: SupplierQuoteFormData;
  onChange: (updates: Partial<SupplierQuoteFormData>) => void;
  leads: Lead[];
  onNewLead: () => void;
  onSaveLead: () => void;  // NEW
  isSavingLead?: boolean;  // NEW
}
```

**Update the header to include the Save button (left of dropdown):**

```tsx
<SectionHeader icon={Package} title="Project Requirements">
  <div className="flex items-center gap-2">
    {/* NEW: Save Lead Button */}
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onSaveLead}
      disabled={!data.lead_id || isSavingLead}
      className="border-border text-foreground hover:bg-muted"
    >
      <Save className="h-4 w-4 mr-1" />
      {isSavingLead ? 'Saving...' : 'Save Lead'}
    </Button>
    
    {/* Existing Lead Selector */}
    <Select ...>
      ...
    </Select>
    
    {/* Existing New Lead Button */}
    <Button ...>
      <Plus ... />
    </Button>
  </div>
</SectionHeader>
```

### File: `src/pages/DashboardSupplierQuotes.tsx`

**Add mutation and handler for saving lead:**

```typescript
// Add updateLead import
import { ..., updateLead } from '@/services/supplierQuoteService';

// Add mutation
const updateLeadMutation = useMutation({
  mutationFn: ({ id, updates }: { id: string; updates: Partial<LeadInsert> }) =>
    updateLead(id, updates),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['supplier-leads'] });
    toast({ title: 'Lead updated', description: 'Lead information saved successfully.' });
  },
  onError: () => {
    toast({ title: 'Error', description: 'Failed to save lead.', variant: 'destructive' });
  },
});

// Add handler
const handleSaveLead = useCallback(() => {
  if (!formData.lead_id) return;
  
  updateLeadMutation.mutate({
    id: formData.lead_id,
    updates: {
      phone: formData.contact_phone || undefined,
      email: formData.contact_email || undefined,
      material: formData.material || undefined,
      requested_qty: formData.qty_tons ? parseFloat(formData.qty_tons) : undefined,
      job_address: formData.delivery_address || undefined,
      job_city: formData.delivery_city || undefined,
      job_state: formData.delivery_state || undefined,
      job_zip: formData.delivery_zip || undefined,
      site_access: formData.site_access.length > 0 ? formData.site_access : undefined,
      delivery_date: formData.delivery_date || undefined,
      delivery_time_preference: formData.delivery_time || undefined,
      delivery_instructions: formData.delivery_instructions || undefined,
      notes: formData.project_notes || undefined,
    },
  });
}, [formData, updateLeadMutation]);

// Update component props
<ProjectRequirementsCard
  data={formData}
  onChange={handleFormChange}
  leads={leads}
  onNewLead={() => setIsNewLeadModalOpen(true)}
  onSaveLead={handleSaveLead}          // NEW
  isSavingLead={updateLeadMutation.isPending}  // NEW
/>
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| **Database** | Add 3 columns: `delivery_date`, `delivery_time_preference`, `delivery_instructions` |
| `src/types/supplierQuote.types.ts` | Add 3 fields to `Lead` interface |
| `src/services/supplierQuoteService.ts` | Add `updateLead` function, update `LeadFromFormData`, update `createLeadFromForm` |
| `src/services/cartInsertService.ts` | Pass delivery scheduling data when creating lead |
| `src/pages/DashboardSupplierQuotes.tsx` | Add `updateLeadMutation`, `handleSaveLead`, update `handleSelectLead` to populate 14 fields |
| `src/components/supplier-quotes/ProjectRequirementsCard.tsx` | Add "Save Lead" button with `Save` icon, left of dropdown |

---

## UI Layout After Changes

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 Project Requirements                  [Save Lead] [Select Lead ▼] [+]│
├─────────────────────────────────────────────────────────────────────────┤
│ MATERIAL & QUANTITY                                                     │
│ ┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ Material       │ │ Spec       │ │ Tons       │ │ Cu Yds     │        │
│ └────────────────┘ └────────────┘ └────────────┘ └────────────┘        │
├─────────────────────────────────────────────────────────────────────────┤
│ 📞 CONTACT INFORMATION                                                  │
│ ┌─────────────────────────┐ ┌─────────────────────────┐                │
│ │ 📞 Phone                │ │ 📧 Email                │                │
│ └─────────────────────────┘ └─────────────────────────┘                │
├─────────────────────────────────────────────────────────────────────────┤
│ 📍 DELIVERY LOCATION                                                    │
│ ...                                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 🚚 DELIVERY SCHEDULING                                                  │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────────┐│
│ │ 📅 Date        │ │ 🕐 Time        │ │ 📄 Instructions               ││
│ └────────────────┘ └────────────────┘ └────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow After Implementation

```text
CART SAVE                              LEADS TABLE                        PROJECT REQUIREMENTS FORM
+-----------------------+              +---------------------+             +-------------------------+
| contactInfo.name      | ─────────►   | display_name        | ─────────►  | (header)               |
| contactInfo.email     | ─────────►   | email               | ─────────►  | contact_email      ✓   |
| contactInfo.phone     | ─────────►   | phone               | ─────────►  | contact_phone      ✓   |
| deliveryDate          | ─────────►   | delivery_date       | ─────────►  | delivery_date      ✓   |
| deliveryTimePreference| ─────────►   | delivery_time_pref  | ─────────►  | delivery_time      ✓   |
| deliveryInstructions  | ─────────►   | delivery_instructions ──────────► | delivery_instructions ✓|
| deliveryAddress       | ─────────►   | job_address/city    | ─────────►  | delivery_address   ✓   |
| tons                  | ─────────►   | requested_qty       | ─────────►  | qty_tons           ✓   |
| product name          | ─────────►   | material            | ─────────►  | material           ✓   |
+-----------------------+              +---------------------+             +-------------------------+
                                              ▲
                                              │
                                       [Save Lead] button
                                       updates lead in DB
```

---

## Testing Checklist

After implementation:
- [ ] Save a cart with full delivery details (date, time preference, instructions)
- [ ] Verify lead is created with all delivery fields populated in the database
- [ ] Go to `/dashboard/supplier-quotes` and select the lead
- [ ] Confirm ALL 14 fields populate in the Project Requirements form
- [ ] Modify contact info or delivery fields in the form
- [ ] Click "Save Lead" button and verify data updates in the database
- [ ] Select the lead again and confirm updated data loads correctly

