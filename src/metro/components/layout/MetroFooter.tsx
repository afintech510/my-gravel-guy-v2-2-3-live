import { Link } from 'react-router-dom';
import type { Metro } from '../../types';
import { CATEGORY_ROUTE_SUFFIX } from '../../config';

export function MetroFooter({ metro }: { metro: Metro }) {
  return (
    <footer className="border-t border-black/5 bg-[#FAF9F6] py-10 text-[#0F1115]">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 sm:grid-cols-4">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">Materials</p>
          <ul className="space-y-2 text-sm">
            {metro.categories.map(category => (
              <li key={category.slug}>
                <Link
                  to={`/${metro.slug}/${category.slug}${CATEGORY_ROUTE_SUFFIX}`}
                  className="hover:underline"
                >
                  {category.name} delivery
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">Towns</p>
          <ul className="space-y-2 text-sm">
            {metro.towns.slice(0, 8).map(town => (
              <li key={town.slug}>
                <Link to={`/${metro.slug}/towns/${town.slug}`} className="hover:underline">
                  {town.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">MyGravelGuy</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/shop" className="hover:underline">All materials</Link>
            </li>
            <li>
              <a href={metro.phoneHref} className="hover:underline">{metro.phone}</a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">Legal</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/privacy" className="hover:underline">Privacy</Link>
            </li>
            <li>
              <Link to="/terms" className="hover:underline">Terms</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-8 border-t border-black/5 px-4 pt-6 text-xs text-[#0F1115]/50">
        © {new Date().getFullYear()} MyGravelGuy. Serving {metro.name}.
      </div>
    </footer>
  );
}
