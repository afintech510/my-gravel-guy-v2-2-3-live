import { Link } from 'react-router-dom';
import type { BreadcrumbEntry } from '@/metro/components/shared/jsonLd';
import { SITE_URL } from '@/content/guides/schema';

/** Visible breadcrumb trail matching the BreadcrumbList JSON-LD emitted alongside it. */
export function Breadcrumbs({ items }: { items: BreadcrumbEntry[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[#0F1115]/60">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const path = item.url.startsWith(SITE_URL) ? item.url.slice(SITE_URL.length) || '/' : item.url;
          return (
            <li key={item.url} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span className="font-medium text-[#0F1115]" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link to={path} className="hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
