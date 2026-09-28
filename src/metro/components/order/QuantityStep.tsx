import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Calculator } from 'lucide-react';
import { convertQuantity, formatUnit, quantityForArea } from '../../lib/pricing';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

const QUICK_PICKS = [3, 5, 10, 15, 20];

export function QuantityStep({ order }: { order: UseMetroOrderReturn }) {
  const { category, quantity, setQuantity, quoteResult } = order;
  const [showCalc, setShowCalc] = useState(false);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState(String(category?.defaultDepthIn ?? 3));

  if (!category) return null;

  const converted = convertQuantity(quantity, category);

  function applyCalc() {
    if (!category) return;
    const l = parseFloat(length);
    const w = parseFloat(width);
    const d = parseFloat(depth);
    if (!Number.isFinite(l) || !Number.isFinite(w) || !Number.isFinite(d) || l <= 0 || w <= 0 || d <= 0) return;
    setQuantity(quantityForArea(l * w, d, category));
    setShowCalc(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {QUICK_PICKS.map(q => (
          <Button
            key={q}
            type="button"
            variant={quantity === q ? 'default' : 'outline'}
            size="sm"
            className="min-h-[44px]"
            onClick={() => setQuantity(q)}
          >
            {q} {category.unit}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease quantity"
          className="min-h-[44px] min-w-[44px]"
          // Functional updater (not the `quantity` closure value) — React 18 batches
          // state updates queued within the same synchronous handler/tick, so reading
          // the stale `quantity` closure here would make rapid clicks (double-tap,
          // press-and-hold repeat, or a fast synthetic click loop) all compute from the
          // same starting number instead of accumulating.
          onClick={() => setQuantity(prev => Math.max(0.5, Math.round((prev - 0.5) * 2) / 2))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span data-testid="metro-quantity-value" className="min-w-[6rem] text-center text-lg font-bold text-[#0F1115]">
          {quantity} {formatUnit(category.unit, quantity)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase quantity"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => setQuantity(prev => Math.round((prev + 0.5) * 2) / 2)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <p className="text-sm text-[#0F1115]/60">
        &asymp; {converted.value} {formatUnit(converted.unit, converted.value)}
      </p>

      {quoteResult?.belowMinimum && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          This zone's minimum order is {quoteResult.minUnits} {formatUnit(category.unit, quoteResult.minUnits)}.
        </p>
      )}

      {quoteResult && quoteResult.loads.length > 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm font-bold text-[#0F1115]">Truck plan</p>
          <ul className="mt-1 space-y-1 text-sm text-[#0F1115]/70">
            {quoteResult.loads.map((load, i) => (
              <li key={i}>
                {load.truck.name} — {load.quantity} {formatUnit(category.unit, load.quantity)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCalc(s => !s)}
          className="h-auto w-full min-w-0 max-w-full justify-start gap-1.5 whitespace-normal px-0 py-2 text-left text-[#0F1115]/70 hover:bg-transparent hover:text-[#0F1115]"
        >
          <Calculator className="h-4 w-4 shrink-0" aria-hidden="true" />
          Not sure how much you need? Calculate from an area
        </Button>
        {showCalc && (
          <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-black/10 bg-white p-4">
            <div>
              <Label htmlFor="calc-length">Length (ft)</Label>
              <Input id="calc-length" inputMode="decimal" value={length} onChange={e => setLength(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="calc-width">Width (ft)</Label>
              <Input id="calc-width" inputMode="decimal" value={width} onChange={e => setWidth(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="calc-depth">Depth (in)</Label>
              <Input id="calc-depth" inputMode="decimal" value={depth} onChange={e => setDepth(e.target.value)} />
            </div>
            <Button type="button" onClick={applyCalc} className="col-span-3">
              Use this amount
            </Button>
          </div>
        )}
      </div>

      <Button
        type="button"
        className="w-full font-bold"
        size="lg"
        onClick={() => order.setStep('date')}
        disabled={!quoteResult || quoteResult.belowMinimum}
      >
        Continue
      </Button>
    </div>
  );
}
