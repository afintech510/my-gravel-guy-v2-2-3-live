import { Link } from 'react-router-dom';
import { GUIDE_SPOKES } from '@/content/guides';
import { CATEGORY_ROUTE_SUFFIX } from '@/metro/config';

/** Sibling-spoke internal links + the "order gravel in your metro" CTA, shown at the
 * bottom of every guide page (hub and spokes alike). */
export function SpokeNav({ currentPath }: { currentPath: string }) {
  const siblings = GUIDE_SPOKES.filter(spoke => spoke.path !== currentPath);

  return (
    <nav aria-label="More gravel driveway guides" className="space-y-6 border-t border-black/10 pt-8">
      {siblings.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">
            More gravel driveway guides
          </p>
          <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {siblings.map(spoke => (
              <li key={spoke.path}>
                <Link to={spoke.path} className="text-[#0F1115] hover:underline">
                  {spoke.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <p className="mb-3 text-sm font-bold text-[#0F1115]">Order gravel in your metro</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/dallas-fort-worth/gravel${CATEGORY_ROUTE_SUFFIX}`}
            className="rounded-md bg-[#0F1115] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F1115]/85"
          >
            Order in Dallas-Fort Worth
          </Link>
          <Link
            to={`/long-island/gravel${CATEGORY_ROUTE_SUFFIX}`}
            className="rounded-md border border-[#0F1115]/20 px-4 py-2 text-sm font-bold text-[#0F1115] hover:bg-[#F2F1EA]"
          >
            Order on Long Island
          </Link>
        </div>
      </div>
    </nav>
  );
}
