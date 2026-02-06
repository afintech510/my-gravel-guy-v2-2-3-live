

# Comprehensive Light/Dark Theme Audit & Fix Plan

## Overview

This plan addresses the widespread light/dark theme inconsistencies across the MGG application. The core issue is that many pages and components use hardcoded light-only color classes (`bg-white`, `text-gray-*`, `bg-gray-50`, etc.) that don't adapt to dark mode, causing unreadable text and broken layouts.

---

## Problem Summary

After auditing the codebase, I identified **30+ files** with hardcoded light-only colors. These fall into three categories:

1. **Page-level backgrounds**: `bg-white`, `bg-gray-50`, `bg-gray-100` on outer wrappers
2. **Text colors**: `text-gray-600`, `text-gray-700`, `text-gray-500`, `text-gray-900` without dark variants
3. **Component containers**: `bg-white` cards/panels without theme awareness

---

## Token Reference Guide

| Use Case | Light Mode Token | Notes |
|----------|------------------|-------|
| Page background | `bg-background` | Main app wrapper |
| Content containers | `bg-card` | Cards, modals, panels |
| Muted sections | `bg-muted` | Callouts, sub-panels, hero backgrounds |
| Primary text | `text-foreground` | Headings, body text |
| Secondary text | `text-muted-foreground` | Descriptions, captions |
| Borders | `border-border` | Dividers, card borders |

---

## Phase 1: Critical Pages (High User Traffic)

### 1.1 ProductDetail.tsx

**Lines to update:**
- Line 98: `bg-white` -> `bg-background`
- Line 116: `bg-white` -> `bg-background`
- Line 119: `text-gray-600` -> `text-muted-foreground`
- Line 129: `bg-white` -> `bg-background`
- Line 151: `bg-gray-50` -> `bg-muted`

### 1.2 About.tsx

**Lines to update:**
- Line 49: `bg-white` -> `bg-background`
- Line 51: `bg-gradient-to-br from-gray-50 to-gray-100` -> `bg-muted`
- Line 56: `text-transparent` gradient -> Keep, but ensure fallback
- Line 59: `text-gray-600` -> `text-muted-foreground`
- Line 63: `text-gray-700` -> `text-foreground`
- Line 67: `bg-blue-50` -> `bg-muted dark:bg-muted`
- Line 68: `text-blue-800` -> `text-foreground`
- Line 94: `text-gray-600` -> `text-muted-foreground`
- Line 101: `bg-gray-50 hover:bg-gray-100` -> `bg-muted hover:bg-muted/80`
- Line 102: `bg-white` -> `bg-card`
- Line 108: `text-gray-600` -> `text-muted-foreground`
- Line 116: `text-gray-700` -> `text-foreground`
- Line 128: `bg-gray-50` -> `bg-muted`
- Line 132: `text-gray-600` -> `text-muted-foreground`
- Line 139: `bg-white` -> `bg-card`
- Line 143: `text-gray-900` -> `text-foreground`
- Line 144: `text-gray-600` -> `text-muted-foreground`
- Line 171: `text-gray-600` -> `text-muted-foreground`

### 1.3 Products.tsx

**Lines to update:**
- Line 47: `bg-white` -> `bg-background`

### 1.4 Chat.tsx

**Lines to update:**
- Line 3: `bg-white` -> `bg-background`
- Line 7: `text-gray-600` -> `text-muted-foreground`

### 1.5 PaymentSuccess.tsx

**Lines to update:**
- Line 1121: `bg-white` -> `bg-background`
- Lines 871, 894, 932, 953, 985, 1009, 1060, 1196, 1231, 1246, 1267, 1290: `text-gray-600` / `text-gray-500` / `text-gray-400` -> `text-muted-foreground`
- Line 1285: `bg-white` -> `bg-card`

### 1.6 Quiz.tsx

**Lines to update:**
- Line 7: `bg-gradient-to-b from-gray-50 to-gray-100` -> `bg-muted`
- Line 12: `text-gray-600` -> `text-muted-foreground`
- Line 16: `bg-white` -> `bg-card`

### 1.7 NotFound.tsx

**Lines to update:**
- Line 25: `bg-gray-100` -> `bg-muted`
- Line 26: `bg-white` -> `bg-card`
- Line 28: `text-gray-600` -> `text-muted-foreground`
- Line 29: `text-gray-500` -> `text-muted-foreground`

---

## Phase 2: Shopping Flow Pages

### 2.1 Checkout.tsx

**Lines to update:**
- Line 438: `text-gray-600` -> `text-muted-foreground`
- Any `bg-white` containers -> `bg-card`

### 2.2 Reviews.tsx

**Lines to update:**
- Line 82: `bg-gray-50` -> `bg-muted`
- Line 92: `text-gray-600` -> `text-muted-foreground`
- Line 108: `text-gray-500` -> `text-muted-foreground`
- Line 113: `text-gray-600` -> `text-muted-foreground`
- Line 124: `bg-gray-200` -> `bg-muted`
- Line 194: `text-gray-600` -> `text-muted-foreground`
- Line 196: `text-gray-500` -> `text-muted-foreground`

---

## Phase 3: Auth & Utility Pages

### 3.1 Login.tsx

**Lines to update:**
- Line 32: `bg-gray-50` -> `bg-muted`
- Line 36: `text-gray-600` -> `text-muted-foreground`
- Line 47: `text-gray-700` -> `text-foreground`
- Line 62: `text-gray-700` -> `text-foreground`
- Line 83: `border-gray-300 text-blue-600` -> `border-border text-primary`
- Line 85: `text-gray-900` -> `text-foreground`

### 3.2 Signup.tsx

**Lines to update:**
- Line 34: `bg-gray-50` -> `bg-muted`
- Line 38: `text-gray-600` -> `text-muted-foreground`
- Line 50, 63, 77, 92: `text-gray-700` -> `text-foreground`
- Line 104: `text-gray-500` -> `text-muted-foreground`
- Line 116: `border-gray-300 text-blue-600` -> `border-border text-primary`
- Line 118: `text-gray-900` -> `text-foreground`

### 3.3 Sitemap.tsx

**Lines to update:**
- Line 32: `bg-white` -> `bg-card`
- Line 44: `hover:bg-gray-50` -> `hover:bg-muted`
- Line 46: `text-gray-900` -> `text-foreground`
- Line 50: `text-gray-600` -> `text-muted-foreground`
- Line 103: `bg-gray-50` -> `bg-muted`
- Line 112: `text-gray-600` -> `text-muted-foreground`
- Line 162: `bg-white` -> `bg-card`
- Line 164: `text-gray-600` -> `text-muted-foreground`
- Line 170: `text-white` -> `text-primary-foreground`
- Line 177: `border-gray-300 hover:bg-gray-50` -> `border-border hover:bg-muted`

### 3.4 DeliveryMapPage.tsx

**Lines to update:**
- Line 15: `text-gray-600` -> `text-muted-foreground`
- Line 19: `text-gray-500` -> `text-muted-foreground`

---

## Phase 4: Calculator & Tool Pages

### 4.1 CalculatorShop.tsx

**Lines to update:**
- Line 17: `bg-gray-50` -> `bg-muted`
- Line 20: `text-gray-600` -> `text-muted-foreground`
- Line 23: `bg-white` -> `bg-card`

### 4.2 ProductCalculator.tsx

**Lines to update:**
- Line 101: `text-slate-900` -> `text-foreground`
- Line 102: `text-slate-600` -> `text-muted-foreground`
- Line 108: `text-slate-600` -> `text-muted-foreground`
- Line 124, 129, 136, 153: `bg-white` -> `bg-card`
- Line 140: `border-gray-200` -> `border-border`

### 4.3 Calculator.tsx

This page is minimal and primarily uses the MaterialCalculator component. Consider adding `bg-background` to wrapper.

---

## Phase 5: Location Pages

### 5.1 LocationPage.tsx

**Lines to update:**
- Line 389: `text-gray-600` -> `text-muted-foreground`
- Line 408: `bg-gray-800 text-white` -> Keep (intentional dark hero)
- Line 445: `bg-white` -> `bg-card`
- Line 453, 457, 461: `text-gray-600` -> `text-muted-foreground`
- Line 468: `bg-white` -> `bg-card`
- Line 515: `bg-white` -> `bg-card`
- Line 525: `text-gray-600` -> `text-muted-foreground`

---

## Phase 6: Specialty Pages (Intentional Dark Themes)

The following pages use an intentional dark theme and should NOT be changed:

1. **Contact.tsx** - Uses custom dark slate theme (`bg-[#0F1115]`, `text-[#F5F7FA]`)
2. **Contractors.tsx** - Uses custom dark slate theme
3. **ContractorsAggregateLanding.tsx** - Uses custom dark slate theme
4. **ContractorsSpecMaterials.tsx** - Uses custom dark slate theme

These are intentional exceptions similar to the Supplier Quotes dashboard.

---

## Phase 7: Partially Fixed Pages (Verify Only)

These pages already have some dark mode support but may need verification:

1. **Shop.tsx** - Has `dark:` variants but uses `bg-white` on line 44
2. **BulkLandscapeMaterials.tsx** - Has `dark:` variants, verify consistency

---

## Implementation Order

| Priority | Files | Impact |
|----------|-------|--------|
| 1 | ProductDetail, About, Products, Chat | Core user-facing pages |
| 2 | PaymentSuccess, Quiz, NotFound | Transaction & utility flows |
| 3 | Login, Signup, Checkout, Reviews | Auth & shopping flow |
| 4 | Sitemap, DeliveryMapPage | Navigation & info pages |
| 5 | CalculatorShop, ProductCalculator, LocationPage | Tools & location pages |

---

## Testing Checklist

After implementation, verify each page in both themes:

- [ ] ProductDetail - Dark mode readable
- [ ] About - No gray-on-gray text
- [ ] Products - Page background adapts
- [ ] Chat - Subtitle readable in dark mode
- [ ] PaymentSuccess - All text visible
- [ ] Quiz - Card and background contrast
- [ ] NotFound - Error page readable
- [ ] Login/Signup - Form labels visible
- [ ] Checkout - All summary text readable
- [ ] Reviews - Star ratings and text visible
- [ ] Sitemap - Links and descriptions visible
- [ ] DeliveryMapPage - Description text visible
- [ ] CalculatorShop - Page background adapts
- [ ] ProductCalculator - All steps readable
- [ ] LocationPage - FAQ answers readable

---

## Files to Modify (Final List)

| File | Estimated Changes |
|------|-------------------|
| `src/pages/ProductDetail.tsx` | 5 |
| `src/pages/About.tsx` | 18 |
| `src/pages/Products.tsx` | 1 |
| `src/pages/Chat.tsx` | 2 |
| `src/pages/PaymentSuccess.tsx` | 15 |
| `src/pages/Quiz.tsx` | 3 |
| `src/pages/NotFound.tsx` | 4 |
| `src/pages/Login.tsx` | 6 |
| `src/pages/Signup.tsx` | 8 |
| `src/pages/Checkout.tsx` | 3 |
| `src/pages/Reviews.tsx` | 7 |
| `src/pages/Sitemap.tsx` | 10 |
| `src/pages/DeliveryMap.tsx` | 2 |
| `src/pages/CalculatorShop.tsx` | 3 |
| `src/pages/ProductCalculator.tsx` | 8 |
| `src/pages/LocationPage.tsx` | 8 |
| `src/pages/Shop.tsx` | 1 (verify) |
| `src/pages/BulkLandscapeMaterials.tsx` | 1 (verify) |

**Total: ~105 targeted replacements across 18 files**

---

## What This Does NOT Change

- No changes to pages with intentional dark themes (Contact, Contractors, etc.)
- No changes to Supplier Quotes dashboard (intentional exception)
- No changes to shadcn/ui components (already theme-aware)
- No changes to CSS variables (already defined correctly)
- No layout or structural changes
- No new components or features

