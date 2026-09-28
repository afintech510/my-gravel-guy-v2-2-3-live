import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Metro } from '../../types';

export function MetroHeader({ metro }: { metro: Metro }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#FAF9F6]/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to={`/${metro.slug}`} className="flex min-w-0 items-baseline gap-2">
          <span className="text-lg font-extrabold tracking-tight text-[#0F1115]">MyGravelGuy</span>
          <span className="hidden truncate text-sm font-medium text-[#0F1115]/60 sm:inline">{metro.shortName}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={metro.phoneHref}
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#0F1115] hover:text-[#0F1115]/70 sm:flex"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {metro.phone}
          </a>
          <Button asChild size="sm" className="min-h-[44px] font-bold">
            <Link to={`/${metro.slug}#order`}>Order</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
