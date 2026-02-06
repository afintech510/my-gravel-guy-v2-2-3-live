
# Final Polish Pass: Supplier Quotes (Production Hardening)

## Overview
This plan applies the approved final polish pass to the Supplier Quotes feature, implementing all four priorities in order. No new features, tables, or refactors - only targeted improvements to visual contrast, keyboard ergonomics, unit-aware pricing display, and editing workflow.

---

## Priority 1: Visual Polish (Quick Wins)

### 1A. Fix Pill Contrast (`PillSelect.tsx`)
Change low-contrast green text to high-contrast foreground text:

| Current | New |
|---------|-----|
| `text-green-200` (selected success) | `text-foreground font-medium` |
| `text-muted-foreground` (unselected) | `text-foreground` |

### 1B. Fix Checkbox Contrast (`CheckboxBtn.tsx`)
Change checked state text from `text-primary` to `text-foreground` with a primary-colored icon:

```tsx
// Checked state
'bg-primary/20 text-foreground border border-primary/50'
<CheckSquare className="w-4 h-4 shrink-0 text-primary" />
```

### 1C. Add Hover Border to Quote Tiles
Add subtle primary border on hover to both quote list components:

```tsx
// QuotesForLeadList.tsx & RecentQuotesList.tsx
className="... hover:border-primary/30 ..."
```

### 1D. Bold Supplier Names
Change from `font-medium` to `font-semibold` for supplier names in quote tiles.

---

## Priority 2: Keyboard & Speed Enhancements

### 2A. Add Ctrl/Cmd + Enter Shortcut (`DashboardSupplierQuotes.tsx`)
Add keyboard listener to trigger save on shortcut:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [handleSave]);
```

### 2B. Add Autofocus to Supplier Name
Expose ref from SupplierCard and focus after Save & New or on initial load:

```tsx
// SupplierCard.tsx - expose ref
const supplierNameRef = useRef<HTMLInputElement>(null);
useImperativeHandle(ref, () => ({
  focus: () => supplierNameRef.current?.focus()
}));

// DashboardSupplierQuotes.tsx - focus after reset
supplierCardRef.current?.focus();
```

### 2C. Add Editing Indicator & Cancel Button (`ActionBar.tsx`)
When editing, show indicator and cancel button:

```tsx
{isEditing && (
  <div className="flex items-center gap-2">
    <span className="text-sm text-amber-600 font-medium">Editing Quote</span>
    <Button variant="ghost" size="sm" onClick={onCancelEdit}>
      <X className="h-4 w-4 mr-1" /> Cancel
    </Button>
  </div>
)}
```

Add `onCancelEdit` prop and handler in DashboardSupplierQuotes:

```tsx
const handleCancelEdit = useCallback(() => {
  setFormData(INITIAL_FORM_DATA);
  setFlags(INITIAL_FLAGS);
  setEditingQuoteId(null);
}, []);
```

---

## Priority 3: Unit-Aware Pricing Display

### 3A. Update ActionBar Summary
Show unit based on `material_unit` field (ton or cy), no conversions:

```tsx
// ActionBar.tsx
const unitLabel = formData.material_unit === 'cy' ? '/cy' : '/ton';
const unitsLabel = formData.material_unit === 'cy' ? 'cy' : 'tons';

summaryDisplay = `$${totals.totalCost.toLocaleString(...)} Total • $${totals.pricePerTon.toFixed(2)}${unitLabel} • ${totals.totalTons} ${unitsLabel}`;
```

### 3B. Update Quote Tiles Pricing Display
Same unit-aware logic in `QuotesForLeadList.tsx` and `RecentQuotesList.tsx`:

```tsx
const unitLabel = quote.material_unit === 'cy' ? '/cy' : '/ton';
const unitsLabel = quote.material_unit === 'cy' ? 'cy' : 'tons';

<div className="text-sm font-semibold text-foreground">
  ${totals.totalCost...} • ${totals.pricePerTon}${unitLabel} • {totals.totalTons} {unitsLabel}
</div>
```

---

## Priority 4: Production Hardening

### 4A. Default Status for New Quotes
Add `status: 'active'` only on create (not update) in service layer. Since the DB doesn't have a status column in supplier_quotes yet, this is a no-op until schema is updated.

### 4B. Preserve Existing Status on Edit
The `updateSupplierQuote` function passes only the fields from `formDataToQuoteInsert`, which doesn't include `status`. This means existing status is preserved by default. No change needed.

### 4C. is_all_in Override Behavior
Current `handleFlagChange` does NOT clear other fields when `is_all_in` is toggled - it only uses `disabled` prop to grey out fields. This is correct per requirements. No change needed.

### 4D. Array Field Robustness
Current `formDataToQuoteInsert` already handles arrays correctly with `length > 0` checks. No change needed.

---

## Files to Modify

| File | Changes |
|------|---------|
| `PillSelect.tsx` | Fix contrast: `text-foreground` instead of `text-green-200` |
| `CheckboxBtn.tsx` | Fix contrast: `text-foreground` with `text-primary` icon |
| `QuotesForLeadList.tsx` | Hover border, bold supplier, unit-aware pricing |
| `RecentQuotesList.tsx` | Hover border, bold supplier, unit-aware pricing |
| `ActionBar.tsx` | Unit-aware summary, editing indicator, cancel button |
| `DashboardSupplierQuotes.tsx` | Keyboard shortcut, cancel handler, autofocus |
| `SupplierCard.tsx` | Expose focus ref via forwardRef |

---

## What This Does NOT Change

- No new tables or columns
- No changes to `formDataToQuoteInsert` logic
- No changes to flag mutual exclusivity
- No new required fields
- No refactoring of working services
- `is_all_in` remains an override signal only
- No unit conversions (ton/cy display based on captured unit only)
