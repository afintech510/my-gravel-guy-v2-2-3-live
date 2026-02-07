

# Fix Lead Data Capture from Cart Saves & Remove Unused Field

## Issues Identified

### Issue 1: Delivery fields may not be populated in cart items
The cart save code correctly passes `deliveryTimePreference` and `deliveryInstructions` to `createLeadFromForm`, but these fields may not be set on the cart items when they're added to the cart or before they're saved.

Looking at the `CartItem` interface:
```typescript
deliveryTimePreference?: 'anytime' | 'morning' | 'afternoon';
deliveryInstructions?: string;
```

These fields need to be set somewhere in the cart flow before `insertCartToDatabase` is called.

### Issue 2: User wants to remove delivery_instructions from Project Requirements UI
The user confirmed the `delivery_instructions` field in the Delivery Scheduling section is not being used and should be removed.

---

## Phase 1: Remove Delivery Instructions Field from UI

### File: `src/components/supplier-quotes/ProjectRequirementsCard.tsx`

Remove the "Delivery Instructions" input from the Delivery Scheduling section (lines 283-293):

**Current layout:**
```
Delivery Scheduling
[Preferred Date] [Preferred Time] [Delivery Instructions]
```

**New layout:**
```
Delivery Scheduling
[Preferred Date] [Preferred Time]
```

This involves:
1. Removing the `FileText` icon import (it will no longer be needed)
2. Removing the third `InputGroup` with label "Delivery Instructions"
3. Changing the grid from `md:grid-cols-3` to `md:grid-cols-2`

---

## Phase 2: Remove from Form Data Types (Optional Cleanup)

### File: `src/types/supplierQuote.types.ts`

Remove `delivery_instructions` from:
1. `SupplierQuoteFormData` interface (line 118)
2. `INITIAL_FORM_DATA` object (line 184)

### File: `src/pages/DashboardSupplierQuotes.tsx`

Remove `delivery_instructions` from:
1. `handleSelectLead` mapping (line 212)
2. `handleSaveLead` updates (line 303)

**Note:** Keep `delivery_instructions` in the `Lead` interface since the database column still exists and may be used for legacy data or other purposes.

---

## Phase 3: Verify Cart Data Flow

### File: `src/services/cartInsertService.ts`

The code already passes delivery fields correctly:
```typescript
deliveryDate: firstItem.deliveryDate?.toISOString().split('T')[0],
deliveryTimePreference: firstItem.deliveryTimePreference,
deliveryInstructions: firstItem.deliveryInstructions,
```

The issue is that these fields need to be set on the cart items before save. Check where the cart is saved from (likely the Cart page) and ensure the delivery form captures these fields.

### Verification Needed

Check `src/components/cart/DeliveryForm.tsx` or `src/components/cart/EnhancedDeliveryForm.tsx` to confirm if `deliveryTimePreference` and `deliveryInstructions` are being captured from users and stored on cart items.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/supplier-quotes/ProjectRequirementsCard.tsx` | Remove delivery_instructions input field, change grid to 2 cols |
| `src/types/supplierQuote.types.ts` | Remove `delivery_instructions` from `SupplierQuoteFormData` and `INITIAL_FORM_DATA` |
| `src/pages/DashboardSupplierQuotes.tsx` | Remove `delivery_instructions` from `handleSelectLead` and `handleSaveLead` |

---

## Data Flow Verification

After changes, the cart save to lead flow will still capture:
- `delivery_date` - from cart item's `deliveryDate`
- `delivery_time_preference` - from cart item's `deliveryTimePreference`
- `delivery_instructions` - from cart item's `deliveryInstructions` (kept in database, just removed from supplier quotes UI)

The user should verify that the cart/checkout forms are properly setting these fields on cart items before the "Save Cart" action is triggered.

