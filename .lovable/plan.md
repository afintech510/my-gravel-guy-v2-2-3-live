

# Comprehensive Theme Token Migration Plan (Phase 2)

## Overview

This plan addresses the remaining light/dark theme inconsistencies across shared components, dashboard UI, and landing pages. The previous phase fixed page-level backgrounds in `src/pages/*`. This phase completes the migration for embedded components that still use hardcoded light-only colors, causing mixed appearance when used in dark mode contexts.

---

## Problem Summary

After auditing the codebase, I identified **~50+ files** with remaining hardcoded light-only colors across three categories:

1. **Shared/Marketing Components**: `WhyChooseUs`, `ProductAccordion`, `ProductActions`, etc.
2. **Dashboard UI**: `OrdersTable`, `OrderTableFilters`, `LoginPrompt`, `Dashboard.tsx`, etc.
3. **Landing/Special Pages**: `GoogleShopping`, `SMSConsent`, `ShopTrustBlocks`, etc.

---

## Token Reference Guide (Reminder)

| Use Case | Token | Notes |
|----------|-------|-------|
| Page background | `bg-background` | Main app wrapper |
| Content containers/cards | `bg-card` | Cards, modals, panels |
| Muted sections/callouts | `bg-muted` | Sub-panels, highlighted areas |
| Primary text | `text-foreground` | Headings, body text |
| Secondary text | `text-muted-foreground` | Descriptions, captions |
| Borders | `border-border` | Dividers, card borders |

---

## Phase 1: Shared/Marketing Components

### 1.1 WhyChooseUs.tsx

| Line | Current | New |
|------|---------|-----|
| 25 | `bg-white` | `bg-card` |
| 30 | `text-gray-900` | `text-foreground` |
| 40 | `text-gray-900` | `text-foreground` |
| 43 | `text-gray-600` | `text-muted-foreground` |

### 1.2 ProductAccordion.tsx

| Line | Current | New |
|------|---------|-----|
| 43 | `text-gray-600` | `text-muted-foreground` |
| 50 | `text-gray-600` | `text-muted-foreground` |
| 57 | `text-gray-600` | `text-muted-foreground` |
| 74 | `text-gray-600` | `text-muted-foreground` |
| 142 | `bg-gray-50` | `bg-muted` |
| 147 | `text-gray-600` | `text-muted-foreground` |
| 152 | `bg-gray-50` | `bg-muted` |
| 157 | `text-gray-600` | `text-muted-foreground` |
| 162 | `bg-gray-50` | `bg-muted` |
| 167 | `text-gray-600` | `text-muted-foreground` |
| 279 | `bg-gray-100` | `bg-muted` |
| 282 | `text-gray-600` | `text-muted-foreground` |
| 289 | `bg-gray-100` | `bg-muted` |
| 292 | `text-gray-600` | `text-muted-foreground` |

### 1.3 ProductActions.tsx

| Line | Current | New |
|------|---------|-----|
| 129 | `text-gray-500` | `text-muted-foreground` |
| 156 | `text-gray-600` | `text-muted-foreground` |
| 160 | `text-gray-600` | `text-muted-foreground` |

### 1.4 ProductTabs.tsx

| Line | Current | New |
|------|---------|-----|
| 31 | `text-gray-600` | `text-muted-foreground` |

### 1.5 TrustBuildingSection.tsx

| Line | Current | New |
|------|---------|-----|
| 19 | `text-gray-600` | `text-muted-foreground` |
| 53 | `bg-gray-50` | `bg-muted` |
| 53 | `border-gray-100` | `border-border` |

### 1.6 SecurePay.tsx

| Line | Current | New |
|------|---------|-----|
| 6 | `bg-white` | `bg-card` |
| 6 | `border-gray-100` | `border-border` |

### 1.7 MiniCalculator.tsx

| Line | Current | New |
|------|---------|-----|
| 42 | `bg-gray-50` | `bg-muted` |
| 67 | `text-gray-500` | `text-muted-foreground` |
| 80 | `text-gray-500` | `text-muted-foreground` |
| 87 | `bg-gray-50` | `bg-muted` |
| 88 | `text-gray-600` | `text-muted-foreground` |
| 92 | `text-gray-500` | `text-muted-foreground` |
| 100 | `text-gray-500` | `text-muted-foreground` |
| 103 | `border-gray-200` | `border-border` |
| 108 | `text-gray-500` | `text-muted-foreground` |

### 1.8 ProductCard.tsx (Already provided in context - review only)

Component uses `bg-gray-100` for error state - may keep as-is since it's an error/fallback state.

---

## Phase 2: Dashboard UI Components

### 2.1 OrdersTable.tsx

| Line | Current | New |
|------|---------|-----|
| 120 | `text-gray-500` | `text-muted-foreground` |
| 136 | `text-gray-500` | `text-muted-foreground` |
| 183 | `text-gray-900` | `text-foreground` |
| 195 | `bg-white` | `bg-card` |
| 203 | `text-gray-700` | `text-foreground` |
| 218 | `bg-white` | `bg-card` |
| 237 | `text-gray-500` | `text-muted-foreground` |
| 244 | `hover:bg-gray-50` | `hover:bg-muted` |
| 282 | `text-gray-700` | `text-foreground` |
| 344 | `text-gray-700` | `text-muted-foreground` |

### 2.2 OrderTableFilters.tsx

| Line | Current | New |
|------|---------|-----|
| 79 | `bg-white` | `bg-card` |
| 82 | `hover:bg-gray-50` | `hover:bg-muted` |
| 93 | `text-gray-500` | `text-muted-foreground` |
| 95 | `text-gray-500` | `text-muted-foreground` |
| 105 | `text-gray-700` | `text-foreground` |
| 119 | `text-gray-700` | `text-foreground` |
| 141 | `text-gray-700` | `text-foreground` |
| 157 | `text-gray-700` | `text-foreground` |

### 2.3 LoginPrompt.tsx

| Line | Current | New |
|------|---------|-----|
| 26 | `bg-gray-50` | `bg-muted` |
| 27 | `bg-white` | `bg-card` |
| 30 | `text-gray-900` | `text-foreground` |
| 31 | `text-gray-600` | `text-muted-foreground` |
| 43 | `text-gray-500` | `text-muted-foreground` |

### 2.4 Dashboard.tsx (Main dashboard page)

| Line | Current | New |
|------|---------|-----|
| 20 | `bg-white` | `bg-card` |
| 21 | `text-gray-900` | `text-foreground` |
| 23 | `border-gray-200` | `border-border` |
| 23 | `hover:bg-gray-50` | `hover:bg-muted` |
| 24 | `text-gray-900` | `text-foreground` |
| 25 | `text-gray-600` | `text-muted-foreground` |
| 27 | `border-gray-200` | `border-border` |
| 27 | `hover:bg-gray-50` | `hover:bg-muted` |
| 28 | `text-gray-900` | `text-foreground` |
| 29 | `text-gray-600` | `text-muted-foreground` |
| 31 | `border-gray-200` | `border-border` |
| 31 | `hover:bg-gray-50` | `hover:bg-muted` |
| 32 | `text-gray-900` | `text-foreground` |
| 33 | `text-gray-600` | `text-muted-foreground` |

### 2.5 SuppliersTable.tsx

| Line | Current | New |
|------|---------|-----|
| 137 | `bg-white` | `bg-card` |
| 154 | `text-gray-500` | `text-muted-foreground` |
| 162 | `hover:bg-gray-50` | `hover:bg-muted` |

### 2.6 OrderDetailModal.tsx (Partial - key fixes)

| Line | Current | New |
|------|---------|-----|
| 465 | `bg-gray-100 text-gray-800` | `bg-muted text-muted-foreground` |
| 523 | `text-gray-600` | `text-muted-foreground` |
| 614 | `bg-gray-50` | `bg-muted` |
| 617 | `text-gray-600` | `text-muted-foreground` |
| 792 | `border-gray-300` | `border-border` |
| 793 | `text-gray-400` | `text-muted-foreground` |
| 794 | `text-gray-600` | `text-muted-foreground` |
| 833 | `bg-gray-50` | `bg-muted` |
| 834-838 | `text-gray-600` | `text-muted-foreground` |
| 870 | `text-gray-500` | `text-muted-foreground` |

---

## Phase 3: Landing/Special Pages

### 3.1 GoogleShopping.tsx

| Line | Current | New |
|------|---------|-----|
| 10 | `bg-gray-50` | `bg-muted` |
| 14 | `text-gray-900` | `text-foreground` |
| 15 | `text-gray-600` | `text-muted-foreground` |
| 31 | `text-gray-600` | `text-muted-foreground` |
| 45 | `text-gray-600` | `text-muted-foreground` |
| 59 | `text-gray-600` | `text-muted-foreground` |
| 75 | `text-gray-600` | `text-muted-foreground` |
| 106-120 | `text-gray-600` | `text-muted-foreground` |

### 3.2 SMSConsent.tsx

| Line | Current | New |
|------|---------|-----|
| 11 | `bg-gray-50` | `bg-muted` |
| 17 | `text-gray-600` | `text-muted-foreground` |
| 39 | `text-gray-600` | `text-muted-foreground` |
| 47 | `text-gray-600` | `text-muted-foreground` |
| 55 | `text-gray-600` | `text-muted-foreground` |
| 82 | `text-gray-600` | `text-muted-foreground` |
| 90 | `text-gray-600` | `text-muted-foreground` |
| 98 | `text-gray-600` | `text-muted-foreground` |
| 125-138 | `text-gray-600` | `text-muted-foreground` |
| 147-156 | `text-gray-600` | `text-muted-foreground` |
| 166 | `text-gray-600` | `text-muted-foreground` |

### 3.3 ShopTrustBlocks.tsx

| Line | Current | New |
|------|---------|-----|
| 35 | `bg-gradient-to-br from-gray-50 via-white to-stone-50` | `bg-muted` |
| 38 | `text-gray-900` | `text-foreground` |
| 39 | `text-gray-600` | `text-muted-foreground` |

### 3.4 ShopContentBlock.tsx

| Line | Current | New |
|------|---------|-----|
| 15 | `bg-white` | `bg-card` |
| 15 | `border-gray-100` | `border-border` |
| 20 | `text-gray-900` | `text-foreground` |
| 23 | `text-gray-600` | `text-muted-foreground` |

### 3.5 ShopProductCard.tsx

| Line | Current | New |
|------|---------|-----|
| 114 | `bg-gray-100` | `bg-muted` |
| 125 | `text-gray-900` | `text-foreground` |
| 126 | `text-black` | `text-foreground` |
| 139 | `text-gray-600` | `text-muted-foreground` |
| 151 | `text-gray-700` | `text-foreground` |
| 165 | `text-gray-500` | `text-muted-foreground` |
| 180 | `text-black` | `text-foreground` |
| 183 | `text-gray-500` | `text-muted-foreground` |
| 185 | `text-gray-600` | `text-muted-foreground` |
| 197 | `text-gray-700` | `text-foreground` |
| 213 | `bg-gray-50 hover:bg-gray-100` | `bg-muted hover:bg-muted/80` |

### 3.6 TrustGrid.tsx

| Line | Current | New |
|------|---------|-----|
| 32 | `bg-gray-50` | `bg-muted` |
| 44 | `bg-white` | `bg-card` |

---

## Phase 4: Additional Dashboard Files (Targeted Fixes)

### 4.1 SupplierDetailModal.tsx

| Line | Current | New |
|------|---------|-----|
| 419 | `text-gray-500` | `text-muted-foreground` |

### 4.2 SupplierSelector.tsx

| Line | Current | New |
|------|---------|-----|
| 62 | `text-gray-600` | `text-muted-foreground` |

### 4.3 DashboardSidebar.tsx

**Note**: This component uses intentional dark colors (`bg-gray-800`, `text-gray-300`) for the sidebar. These should be preserved as the sidebar maintains its own dark theme. Only update hover states if needed.

---

## Implementation Order

| Priority | Files | Impact |
|----------|-------|--------|
| 1 | WhyChooseUs, ProductAccordion, ProductActions, TrustBuildingSection | Core product page components |
| 2 | SecurePay, MiniCalculator, ProductTabs | Product detail embeds |
| 3 | OrdersTable, OrderTableFilters, LoginPrompt | Dashboard core |
| 4 | Dashboard.tsx, SuppliersTable, OrderDetailModal | Dashboard pages |
| 5 | GoogleShopping, SMSConsent, ShopTrustBlocks, ShopContentBlock | Landing pages |
| 6 | ShopProductCard, TrustGrid | Shop embeds |

---

## Files to Modify (Final List)

| File | Estimated Changes |
|------|-------------------|
| `src/components/WhyChooseUs.tsx` | 4 |
| `src/components/products/ProductAccordion.tsx` | 14 |
| `src/components/products/ProductActions.tsx` | 3 |
| `src/components/products/ProductTabs.tsx` | 1 |
| `src/components/products/TrustBuildingSection.tsx` | 3 |
| `src/components/products/SecurePay.tsx` | 2 |
| `src/components/products/MiniCalculator.tsx` | 9 |
| `src/components/dashboard/OrdersTable.tsx` | 10 |
| `src/components/dashboard/OrderTableFilters.tsx` | 8 |
| `src/components/dashboard/LoginPrompt.tsx` | 5 |
| `src/pages/Dashboard.tsx` | 13 |
| `src/components/dashboard/SuppliersTable.tsx` | 3 |
| `src/components/dashboard/OrderDetailModal.tsx` | 10 |
| `src/components/dashboard/SupplierDetailModal.tsx` | 1 |
| `src/components/dashboard/SupplierSelector.tsx` | 1 |
| `src/pages/GoogleShopping.tsx` | 10 |
| `src/pages/SMSConsent.tsx` | 15 |
| `src/components/shop/ShopTrustBlocks.tsx` | 3 |
| `src/components/shop/ShopContentBlock.tsx` | 4 |
| `src/components/shop/ShopProductCard.tsx` | 11 |
| `src/components/products/trust/TrustGrid.tsx` | 2 |

**Total: ~130 targeted replacements across 21 files**

---

## Intentional Exceptions (No Changes)

1. **DashboardSidebar.tsx** - Uses intentional dark sidebar theme
2. **Contact.tsx, Contractors.tsx** - Custom branded dark themes
3. **Supplier Quotes dashboard** - Intentional slate-dark theme
4. **MarketHero.tsx** - Uses intentional dark hero with gradient
5. **ContentSections.tsx** - Already uses semantic tokens correctly

---

## Testing Checklist

After implementation, verify each component in both themes:

- [ ] WhyChooseUs - Text readable on both themes
- [ ] ProductAccordion - FAQ answers and step cards visible
- [ ] ProductActions - Price display and cubic yards text
- [ ] MiniCalculator - Results section and slider labels
- [ ] OrdersTable - Table rows and pagination info
- [ ] OrderTableFilters - Filter labels and inputs
- [ ] LoginPrompt - Card and text visible in dark mode
- [ ] Dashboard - Quick action cards readable
- [ ] GoogleShopping - Feature cards and help text
- [ ] SMSConsent - Compliance info readable
- [ ] ShopProductCard - Product details and price
- [ ] TrustGrid - Badge backgrounds adapt

---

## What This Does NOT Change

- No changes to components with intentional dark themes
- No changes to shadcn/ui base components
- No changes to CSS variable definitions
- No layout or structural changes
- No new components or features
- Icon colors remain `text-primary` where appropriate

