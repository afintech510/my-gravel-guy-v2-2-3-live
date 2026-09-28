import { Link } from 'react-router-dom';
import type { Metro } from '../../types';
import { CATEGORY_ROUTE_SUFFIX } from '../../config';
import { categoryFromPrice, formatMoney } from '../shared/priceHelpers';

export function CategoryCards({ metro }: { metro: Metro }) {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-extrabold text-[#0F1115] md:text-3xl">
          Four materials, one delivered price
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {metro.categories.map(category => {
            const fromPrice = categoryFromPrice(metro, category);
            return (
              <Link
                key={category.slug}
                to={`/${metro.slug}/${category.slug}${CATEGORY_ROUTE_SUFFIX}`}
                className="group flex flex-col rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:p-6"
              >
                <span className="text-lg font-extrabold text-[#0F1115]">{category.name}</span>
                <span className="mt-1 text-sm text-[#0F1115]/60">{category.tagline}</span>
                {fromPrice != null && (
                  <span className="mt-4 text-sm font-bold text-[#0F1115]">
                    from {formatMoney(fromPrice)}/{category.unit} delivered
                  </span>
                )}
                <span className="mt-3 text-sm font-semibold text-primary group-hover:underline">
                  Order {category.name.toLowerCase()} &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
