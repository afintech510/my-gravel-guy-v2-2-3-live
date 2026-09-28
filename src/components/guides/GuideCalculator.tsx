import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { METROS, CATEGORY_ROUTE_SUFFIX } from '@/metro/config';
import { getCategory, formatUnit } from '@/metro/lib/pricing';
import { calculateGravelQuantity } from '@/content/guides/drivewayEstimate';

/** Interactive length x width x depth calculator, converted to tons/yards per metro
 * material via the shared quantityForArea/convertQuantity pricing-engine math (never
 * hardcoded). CTA links carry the computed quantity as a query hint for the order flow. */
export function GuideCalculator() {
  const [length, setLength] = useState(50);
  const [width, setWidth] = useState(12);
  const [depth, setDepth] = useState(4);

  const results = useMemo(() => {
    return METROS.map(metro => {
      const category = getCategory(metro, 'gravel');
      if (!category) return null;
      const result = calculateGravelQuantity(length, width, depth, category);
      return { metro, result };
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [length, width, depth]);

  const numberInput = (
    id: string,
    label: string,
    value: number,
    onChange: (next: number) => void,
  ) => (
    <label htmlFor={id} className="block text-sm font-semibold text-[#0F1115]">
      {label}
      <input
        id={id}
        type="number"
        min={0}
        step={0.5}
        value={value}
        onChange={event => onChange(Number(event.target.value) || 0)}
        className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-[#0F1115]"
      />
    </label>
  );

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 md:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {numberInput('guide-calc-length', 'Length (ft)', length, setLength)}
        {numberInput('guide-calc-width', 'Width (ft)', width, setWidth)}
        {numberInput('guide-calc-depth', 'Depth (in)', depth, setDepth)}
      </div>

      <div className="mt-6 space-y-3">
        {results.map(({ metro, result }) => (
          <div
            key={metro.slug}
            className="flex flex-col gap-2 rounded-lg bg-[#F2F1EA] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-bold text-[#0F1115]">{metro.name}</p>
              <p className="text-[#0F1115]/70">
                About {result.primaryQuantity} {formatUnit(result.primaryUnit, result.primaryQuantity)}{' '}
                (~{result.convertedQuantity} {formatUnit(result.convertedUnit, result.convertedQuantity)})
              </p>
            </div>
            <Link
              to={`/${metro.slug}/gravel${CATEGORY_ROUTE_SUFFIX}?qty=${result.primaryQuantity}&unit=${result.primaryUnit}`}
              className="whitespace-nowrap rounded-md bg-[#0F1115] px-4 py-2 text-center text-sm font-bold text-white hover:bg-[#0F1115]/85"
            >
              Order in {metro.shortName}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-[#0F1115]/50">
        Estimate only — order quantity rounds up to the nearest half unit. Enter your ZIP on the order page for your
        exact delivered price.
      </p>
    </div>
  );
}
