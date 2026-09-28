import { quote } from '../../lib/pricing';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

export function DayStep({ order }: { order: UseMetroOrderReturn }) {
  const { metro, category, variant, zone, quantity, dayOptions, day, selectDay } = order;
  if (!category || !variant || !zone) return null;

  return (
    <div role="radiogroup" aria-label="Choose a delivery day" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {dayOptions.map(option => {
        const q = quote({
          metro,
          categorySlug: category.slug,
          variantSlug: variant.slug,
          quantity,
          zoneSlug: zone.slug,
          saturday: option.isSaturday,
          speed: option.isRush ? 'rush' : 'standard',
        });
        const fee = q ? q.saturdayFee + q.rushFee : 0;
        const selected = day?.date === option.date;
        const tags = [option.isSaturday ? 'Saturday' : null, option.isRush ? 'Rush' : null].filter(Boolean).join(' + ');

        return (
          <button
            key={option.date}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => selectDay(option)}
            className={`rounded-xl border p-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              selected ? 'border-primary bg-primary/10' : 'border-black/10 bg-white hover:border-black/20'
            }`}
          >
            <span className="block font-semibold text-[#0F1115]">{option.label}</span>
            {tags && (
              <span className="mt-1 block text-xs font-medium text-[#0F1115]/60">
                {tags}
                {fee > 0 && ` — +$${fee.toFixed(0)}`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
