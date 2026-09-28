import { formatMoney } from '../shared/priceHelpers';
import { formatUnit } from '../../lib/pricing';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

/** One delivered price — the premium is folded in, never itemized. */
export function PriceSummary({ order }: { order: UseMetroOrderReturn }) {
  const { metro, category, quoteResult } = order;
  if (!category || !quoteResult) return null;

  const feesNote = [
    quoteResult.saturdayFee > 0 ? `+${formatMoney(quoteResult.saturdayFee)} Saturday` : null,
    quoteResult.rushFee > 0 ? `+${formatMoney(quoteResult.rushFee)} rush` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      {/* Desktop: sticky itemized card */}
      <div className="hidden md:block">
        <div className="sticky top-24 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-[#0F1115]/60">
              {quoteResult.quantity} {formatUnit(category.unit, quoteResult.quantity)} delivered
            </span>
            <span className="text-2xl font-extrabold text-[#0F1115]">{formatMoney(quoteResult.basePrice)}</span>
          </div>
          {quoteResult.saturdayFee > 0 && (
            <div className="mt-1 flex items-center justify-between text-sm text-[#0F1115]/60">
              <span>Saturday delivery</span>
              <span>+{formatMoney(quoteResult.saturdayFee)}</span>
            </div>
          )}
          {quoteResult.rushFee > 0 && (
            <div className="mt-1 flex items-center justify-between text-sm text-[#0F1115]/60">
              <span>Rush delivery</span>
              <span>+{formatMoney(quoteResult.rushFee)}</span>
            </div>
          )}
          <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-3">
            <span className="text-sm font-bold text-[#0F1115]">Total</span>
            <span className="text-xl font-extrabold text-[#0F1115]">{formatMoney(quoteResult.total)}</span>
          </div>
          {!metro.priceBookConfirmed && (
            <p className="mt-3 text-xs text-[#0F1115]/50">
              Estimated delivered price — confirmed by text before we charge anything.
            </p>
          )}
        </div>
      </div>

      {/* Mobile: sticky condensed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium text-[#0F1115]/60">
            {quoteResult.quantity} {formatUnit(category.unit, quoteResult.quantity)}
            {feesNote ? ` · ${feesNote}` : ''}
          </p>
          <p className="shrink-0 text-lg font-extrabold text-[#0F1115]">{formatMoney(quoteResult.total)}</p>
        </div>
        {!metro.priceBookConfirmed && (
          <p className="mt-1 text-[11px] text-[#0F1115]/50">
            Estimated — confirmed by text before we charge anything.
          </p>
        )}
      </div>
    </>
  );
}
