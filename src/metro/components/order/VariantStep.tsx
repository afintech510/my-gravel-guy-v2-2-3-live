import { Badge } from '@/components/ui/badge';
import { VariantSwatch } from '../shared/VariantSwatch';
import { variantZonePrice, formatMoney } from '../shared/priceHelpers';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

export function VariantStep({ order }: { order: UseMetroOrderReturn }) {
  const { metro, category, zone } = order;
  if (!category || !zone) return null;

  return (
    <div role="radiogroup" aria-label={`Choose a ${category.name.toLowerCase()} type`} className="space-y-3">
      {category.variants.map(variant => {
        const price = variantZonePrice(metro, category, variant, zone);
        const selected = order.variantSlug === variant.slug;
        return (
          <button
            key={variant.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => order.selectVariant(variant.slug)}
            className={`relative flex w-full gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              selected ? 'border-primary bg-primary/10' : 'border-black/10 bg-white hover:border-black/20'
            }`}
          >
            <VariantSwatch color={variant.swatch} size="lg" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-[#0F1115]">{variant.name}</p>
                {variant.popular && (
                  <Badge className="bg-primary text-[#0F1115] hover:bg-primary">Popular</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-[#0F1115]/65">{variant.shortDescription}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variant.bestFor.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#F2F1EA] px-2 py-0.5 text-xs font-medium text-[#0F1115]/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {price != null && (
                <p className="mt-2 text-sm font-bold text-[#0F1115]">
                  {formatMoney(price)}/{category.unit} delivered
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
