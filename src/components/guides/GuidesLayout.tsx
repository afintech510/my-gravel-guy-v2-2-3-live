import type { CSSProperties, ReactNode } from 'react';

// Guides pages keep the classic site chrome (TopBanner/Navbar/Footer, rendered by
// AppContent in src/App.tsx — /gravel-driveways is not in the metro-slug hide list,
// and App.tsx ownership here is limited to adding lazy routes, so we deliberately do
// NOT touch that hiding logic) but want the same calm, light editorial look used on
// the metro pages. This re-declares the same light CSS custom properties as
// src/metro/components/layout/MetroLayout.tsx (a simple variant, not an import of a
// component that expects a `metro` prop) so shadcn primitives don't flip to dark-mode
// colors when the visitor's OS prefers dark, and wraps content in the same
// container/max-width rhythm used across the guide pages.
const FORCE_LIGHT_THEME: CSSProperties = {
  '--background': '0 0% 100%',
  '--foreground': '222.2 84% 4.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '222.2 84% 4.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '222.2 84% 4.9%',
  '--primary': '72 75% 51%',
  '--primary-foreground': '0 0% 0%',
  '--secondary': '210 40% 96.1%',
  '--secondary-foreground': '222.2 47.4% 11.2%',
  '--muted': '210 40% 96.1%',
  '--muted-foreground': '215.4 16.3% 46.9%',
  '--accent': '210 40% 96.1%',
  '--accent-foreground': '222.2 47.4% 11.2%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '210 40% 98%',
  '--border': '214.3 31.8% 91.4%',
  '--input': '214.3 31.8% 91.4%',
  '--ring': '72 75% 51%',
} as CSSProperties;

export function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#FAF9F6] font-sans text-[#0F1115]" style={FORCE_LIGHT_THEME}>
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">{children}</div>
    </div>
  );
}
