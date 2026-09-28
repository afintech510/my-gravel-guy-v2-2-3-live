import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';
import { categoryFromPrice, formatMoney } from '../shared/priceHelpers';

export function CategoryStep({ order }: { order: UseMetroOrderReturn }) {
  return (
    <div role="radiogroup" aria-label="Choose a material" className="grid grid-cols-2 gap-3 sm:gap-4">
      {order.metro.categories.map(category => {
        const fromPrice = categoryFromPrice(order.metro, category);
        const selected = order.categorySlug === category.slug;
        return (
          <button
            key={category.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => order.selectCategory(category.slug)}
            className={`rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              selected ? 'border-primary bg-primary/10' : 'border-black/10 bg-white hover:border-black/20'
            }`}
          >
            <span className="block text-lg font-extrabold text-[#0F1115]">{category.name}</span>
            <span className="mt-1 block text-sm text-[#0F1115]/60">{category.tagline}</span>
            {fromPrice != null && (
              <span className="mt-3 block text-sm font-bold text-[#0F1115]">
                from {formatMoney(fromPrice)}/{category.unit} delivered
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
