# Global Light/Dark Theme System Implementation Plan (Final – Approved)

## Overview

This plan implements a global light/dark theme system across the entire MGG application using a Tailwind + shadcn semantic token approach. It resolves prior issues with missing toggles, theme persistence, flash on load, and poor text contrast (lime-on-light), while explicitly avoiding scope creep.

This is a **polish + production hardening pass only** — no new features, tables, layouts, or refactors.

---

## Phase 1: ThemeProvider Configuration (Single Source of Truth)

**File:** `src/App.tsx`

Update ThemeProvider configuration to:

* Use system preference by default
* Persist user choice to a custom storage key
* Disable transition flashes on change

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  storageKey="mgg-theme"
  enableSystem
  disableTransitionOnChange
>
```

**Important:** Confirm `ThemeProvider` wraps the **entire app router and all layouts** (marketing pages, cart/checkout, dashboard, modals). No route group should exist outside the provider.

---

## Phase 2: Flash Prevention (Pre-Hydration Theme Application)

**File:** `index.html`

Add the following inline script **before** the React root element to prevent light/dark flash on hard refresh. Script is hardened with try/catch for localStorage safety.

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('mgg-theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme =
        (stored === 'dark' || stored === 'light')
          ? stored
          : (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (e) {
      var prefersDarkFallback = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', !!prefersDarkFallback);
    }
  })();
</script>
```

---

## Phase 3: Theme Toggle Placement (Single Control)

**File:** `src/components/Navbar.tsx`

* Mount the `ThemeToggle` component in the Navbar
* Place next to the cart icon in desktop view
* Include in mobile navigation (sheet/drawer)

**Important:**

* The Navbar is the **only** place where a theme toggle is mounted
* Do **not** add additional toggles elsewhere

**File:** `src/components/TopBanner.tsx`

* Keep theme toggle removed / commented out
* No changes required

---

## Phase 4: Deposit Option Contrast Fix (Cart / Checkout)

**File:** `src/components/cart/DepositOption.tsx`

Fix lime-on-light readability issues by using dark text with lime accents.

| Location           | Current        | New                             |
| ------------------ | -------------- | ------------------------------- |
| Down Payment label | `text-primary` | `text-foreground font-medium`   |
| Badge text         | `text-primary` | `text-foreground`               |
| Price display      | `text-primary` | `text-foreground font-semibold` |

* Keep existing `bg-primary/10` and `border-primary/30`
* Verify readability in **both light and dark themes** after changes

---

## Phase 5: Global Contrast Sweep (Targeted)

### Contrast Rule (Critical)

Replace `text-primary` **only when used for body/value/label text on light backgrounds**.

**Keep `text-primary` for:**

* Icons
* Accent badges with background
* Hover states
* Borders and UI accents

### Targeted Fixes

| File                      | Location | Current        | New                                  | Reason          |
| ------------------------- | -------- | -------------- | ------------------------------------ | --------------- |
| `ReviewCard.tsx`          | ~75      | `text-primary` | `text-foreground font-medium`        | Body label      |
| `ConsultationSection.tsx` | ~23      | `text-primary` | `font-bold text-foreground`          | Inline emphasis |
| `LocationPage.tsx`        | ~496     | `text-primary` | `text-foreground hover:text-primary` | Link text       |

---

## Phase 6: Replace Hard-Coded Backgrounds with Semantic Tokens

### Token Usage Rules

| Use Case                 | Token           |
| ------------------------ | --------------- |
| Page background          | `bg-background` |
| Primary containers/cards | `bg-card`       |
| Sub-panels / callouts    | `bg-muted`      |
| Borders                  | `border-border` |

### Files to Update

| File                  | Current                                     | New             | Reason             |
| --------------------- | ------------------------------------------- | --------------- | ------------------ |
| `src/App.tsx`         | `bg-gray-50 dark:bg-gray-900`               | `bg-background` | Page body          |
| `src/pages/Cart.tsx`  | `bg-gray-50`                                | `bg-muted`      | Section background |
| `src/pages/Cart.tsx`  | `bg-white`                                  | `bg-card`       | Order summary      |
| `src/pages/Index.tsx` | `bg-gradient-to-b from-gray-50 to-gray-100` | `bg-background` | Page body          |
| `DashboardLayout.tsx` | `bg-gray-50`                                | `bg-muted`      | Section background |
| `DashboardLayout.tsx` | `bg-white`                                  | `bg-card`       | Content container  |

### Forward Rule

Going forward, new components must prefer semantic tokens over hard-coded grays/whites. Hard-coded colors are allowed only inside the Supplier Quotes module (intentional custom theme).

---

## Phase 7: Supplier Quotes Module (Intentional Exception)

**Current State:** Supplier Quotes uses a custom slate-dark theme with hard-coded dark colors.

**This Implementation:**

* No changes to Supplier Quotes internal theming
* Confirm module remains readable when global theme is light
* Treat Supplier Quotes as an internal ops tool with intentional dark UI

**Future Scope (not part of this plan):**

* Migrate Supplier Quotes to semantic tokens

---

## Files to Modify (Final List)

* `index.html`
* `src/App.tsx`
* `src/components/Navbar.tsx`
* `src/components/cart/DepositOption.tsx`
* `src/components/reviews/ReviewCard.tsx`
* `src/components/landing/ConsultationSection.tsx`
* `src/pages/LocationPage.tsx`
* `src/pages/Cart.tsx`
* `src/pages/Index.tsx`
* `src/components/dashboard/DashboardLayout.tsx`

---

## Testing Checklist

* [ ] Single theme toggle visible in Navbar (desktop + mobile)
* [ ] Theme persists using `mgg-theme` localStorage key
* [ ] System preference applied when no saved value exists
* [ ] No flash on hard refresh
* [ ] Cart page readable in both light and dark
* [ ] Checkout page readable in both light and dark
* [ ] Deposit option text readable (no lime-on-light)
* [ ] Dashboard pages inherit theme correctly
* [ ] Supplier Quotes remains dark-styled and functional
* [ ] No new hard-coded background colors introduced

---

## Explicit Non-Goals

* No new features or toggles
* No layout redesigns
* No Tailwind config changes
* No CSS variable changes
* No database or backend changes
* No changes to Supplier Quotes logic

---

**Status:** Approved for implementation
