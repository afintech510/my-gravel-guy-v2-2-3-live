import type { ReactNode } from 'react';
import { MetroStatusBadge } from '../shared/MetroStatusBadge';
import type { Metro } from '../../types';

interface MetroHeroProps {
  metro: Metro;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  children?: ReactNode;
}

export function MetroHero({ metro, eyebrow, headline, subhead, children }: MetroHeroProps) {
  return (
    <section className="border-b border-black/5 bg-gradient-to-b from-[#F2F1EA] to-[#FAF9F6]">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex justify-center">
            <MetroStatusBadge status={metro.status} />
          </div>
          {eyebrow && (
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">{eyebrow}</p>
          )}
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0F1115] sm:text-4xl md:text-5xl">
            {headline ?? metro.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#0F1115]/70 md:text-lg">
            {subhead ?? metro.subhead}
          </p>
        </div>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
