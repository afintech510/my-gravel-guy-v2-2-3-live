

# Product Calculator Dark Mode Readability Fix

## Overview

This plan addresses the dark mode readability issues on the `/product-calculator` page. The screenshot shows:

1. **Gray labels are hard to read** - "Material Category", "Available Materials", "Project Areas", "Material Depth", etc. use `text-gray-700` which is too dark on the dark background
2. **Product cards have stark white backgrounds** - The `bg-white` and `border-gray-200` classes create jarring contrast against the dark page
3. **Calculation Results card is too bright** - Uses `bg-gray-50` which appears as a white box
4. **Trust Banner text is unreadable** - Uses `text-gray-600` for descriptions

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/product-calculator/ProductFilterSelector.tsx` | 8 |
| `src/components/product-calculator/AreaCalculator.tsx` | 8 |
| `src/components/product-calculator/ZipCodeChecker.tsx` | 8 |
| `src/components/product-calculator/TrustBanner.tsx` | 1 |

**Total: ~25 targeted replacements across 4 files**

---

## Phase 1: ProductFilterSelector.tsx

### Section Labels (Gray on dark background)

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 161 | `text-gray-700` | `text-foreground` | "Material Category" label unreadable |
| 185 | `text-gray-700` | `text-foreground` | "Available Materials" label unreadable |

### Category Filter Buttons (Non-selected state)

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 171 | `bg-white hover:bg-gray-50 text-gray-700 border-gray-200` | `bg-card hover:bg-muted text-foreground border-border` | Stark white buttons on dark background |

### Product Cards (Non-selected state)

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 200 | `border-gray-200 bg-white hover:border-gray-300` | `border-border bg-card hover:border-border` | White product cards look jarring |
| 205 | `bg-gray-100` | `bg-muted` | Image placeholder background |
| 216 | `text-gray-900` | `text-foreground` | Product name color |
| 220 | `text-gray-500` | `text-muted-foreground` | Size text |

### Empty State

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 235 | `text-gray-500 bg-gray-50` | `text-muted-foreground bg-muted` | Empty state message |
| 188 | `text-gray-500` | `text-muted-foreground` | Loading message |

---

## Phase 2: AreaCalculator.tsx

### Section Labels

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 59 | `text-gray-700` | `text-foreground` | "Project Areas" label unreadable |
| 109 | `text-gray-700` | `text-foreground` | "Material Depth" label unreadable |
| 129 | `text-gray-700` | `text-foreground` | "Order Extra for Compaction" label unreadable |

### Slider Labels

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 120 | `text-gray-500` | `text-muted-foreground` | Depth range labels (1" - 24") |
| 140 | `text-gray-500` | `text-muted-foreground` | Extra % range labels (0% - 30%) |
| 82 | `text-gray-500` | `text-muted-foreground` | "×" symbol between inputs |

### Calculation Results Card

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 147 | `bg-gray-50` | `bg-muted` | Card background too bright |
| 148 | `text-gray-700` | `text-foreground` | "Calculation Results" heading |
| 151, 155, 159 | `text-gray-500` | `text-muted-foreground` | "Total Area", "Cubic Yards", "est. Tons" labels |

---

## Phase 3: ZipCodeChecker.tsx

### Section Labels and Text

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 50 | `text-gray-800` | `text-foreground` | "Delivery Availability" heading |
| 63 | `text-gray-600` | `text-muted-foreground` | Location text under "FREE Delivery Available" |
| 72 | `text-gray-500 hover:text-gray-700` | `text-muted-foreground hover:text-foreground` | "Change" button |
| 81 | `text-gray-600` | `text-muted-foreground` | "Enter your ZIP code..." instruction text |

### Input Field States

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 87 | `text-gray-400` | `text-muted-foreground` | MapPin icon color |
| 94 | `bg-gray-50` | `bg-muted` | Locked input background |

---

## Phase 4: TrustBanner.tsx

### Trust Item Descriptions

| Line | Current | New | Issue |
|------|---------|-----|-------|
| 40 | `text-gray-600` | `text-muted-foreground` | Description text for each trust item |

---

## Implementation Summary

All changes follow the established token mapping:

| Use Case | Old Value | New Token |
|----------|-----------|-----------|
| Labels/headings | `text-gray-700`, `text-gray-800`, `text-gray-900` | `text-foreground` |
| Secondary text | `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| Card backgrounds | `bg-white`, `bg-gray-50` | `bg-card`, `bg-muted` |
| Borders | `border-gray-200`, `border-gray-300` | `border-border` |
| Hover states | `hover:bg-gray-50` | `hover:bg-muted` |

---

## Testing Checklist

After implementation, verify on the `/product-calculator` page:

- [ ] "Material Category" and "Available Materials" labels are readable in dark mode
- [ ] Category filter buttons have appropriate dark mode styling (not stark white)
- [ ] Product cards blend naturally with dark theme
- [ ] Slider labels ("1" - 24"", "0% - 30%") are readable
- [ ] "Calculation Results" card has muted background, not bright white
- [ ] ZipCode section text is readable
- [ ] Trust Banner descriptions are visible
- [ ] All elements maintain readability in light mode

---

## What This Does NOT Change

- No changes to selected/active states (already use `text-primary` and `bg-primary`)
- No changes to green delivery confirmation styling (intentional accent color)
- No layout or structural changes
- No changes to other pages or components

