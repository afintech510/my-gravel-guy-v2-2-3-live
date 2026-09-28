import type { CSSProperties, ReactNode } from 'react';
import type { Metro } from '../../types';
import { MetroHeader } from './MetroHeader';
import { MetroFooter } from './MetroFooter';

// Metro pages are always light (stone/off-white), but shadcn/ui primitives (Button,
// Input, Checkbox, ...) read their colors from CSS custom properties that flip when an
// ancestor <html> has class="dark" (next-themes with defaultTheme="system" follows the
// visitor's OS preference app-wide). Without this, a visitor on a dark-mode OS would see
// dark-on-dark form controls inside our otherwise-light metro pages. Re-declaring the
// light values here overrides the inherited (possibly dark) custom properties for
// everything nested inside the metro layout, regardless of the app-wide theme.
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

export function MetroLayout({ metro, children }: { metro: Metro; children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#FAF9F6] font-sans text-[#0F1115]"
      style={FORCE_LIGHT_THEME}
    >
      <MetroHeader metro={metro} />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <MetroFooter metro={metro} />
    </div>
  );
}
