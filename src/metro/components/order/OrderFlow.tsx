import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useMetroOrder } from '../../hooks/useMetroOrder';
import type { CategorySlug, Metro, SellUnit } from '../../types';
import type { OrderStep } from '../../hooks/useMetroOrder';
import { ZipStep } from './ZipStep';
import { CategoryStep } from './CategoryStep';
import { VariantStep } from './VariantStep';
import { QuantityStep } from './QuantityStep';
import { DayStep } from './DayStep';
import { DetailsStep } from './DetailsStep';
import { PriceSummary } from './PriceSummary';
import { Confirmation } from './Confirmation';

const STEP_TITLES: Record<OrderStep, string> = {
  zip: 'Where should we deliver?',
  'out-of-area': "We're not there yet",
  category: 'What do you need?',
  variant: 'Pick your material',
  quantity: 'How much do you need?',
  date: 'When works for you?',
  contact: 'Delivery details',
  confirmed: "You're all set",
};

export interface OrderFlowProps {
  metro: Metro;
  /** Preselects a category, skipping the category tile step (category pages) */
  initialCategory?: CategorySlug;
  /** Prefills and auto-checks the ZIP step (town pages) */
  initialZip?: string;
}

/**
 * Reads the ?zip=&category=&variant=&qty=&unit= prefill hints (the guides calculator's
 * "Order in DFW/Long Island" CTA sends ?qty=&unit=; the others exist for future deep
 * links). A query param wins over the page-supplied prop when both are present, since
 * the query string is the more specific, one-off signal. Every value is validated
 * against this metro's own config before use — an unknown/mistyped category or variant
 * slug is silently ignored rather than producing a broken preselection.
 */
function usePrefillOptions(metro: Metro, initialCategory: CategorySlug | undefined, initialZip: string | undefined) {
  const [searchParams] = useSearchParams();
  return useMemo(() => {
    const qpZip = searchParams.get('zip')?.trim();
    const qpCategoryRaw = searchParams.get('category')?.trim();
    const qpVariantRaw = searchParams.get('variant')?.trim();
    const qpQtyRaw = searchParams.get('qty');
    const qpUnitRaw = searchParams.get('unit')?.trim();

    const qpCategory = qpCategoryRaw && metro.categories.some(c => c.slug === qpCategoryRaw)
      ? (qpCategoryRaw as CategorySlug)
      : undefined;
    const resolvedCategorySlug = qpCategory ?? initialCategory;
    const resolvedCategory = resolvedCategorySlug
      ? metro.categories.find(c => c.slug === resolvedCategorySlug)
      : undefined;

    const qpVariant = qpVariantRaw && resolvedCategory?.variants.some(v => v.slug === qpVariantRaw)
      ? qpVariantRaw
      : undefined;

    const qpQty = qpQtyRaw != null ? Number(qpQtyRaw) : NaN;
    const initialQuantity = Number.isFinite(qpQty) && qpQty > 0 ? qpQty : undefined;
    const initialQuantityUnit: SellUnit | undefined =
      qpUnitRaw === 'ton' || qpUnitRaw === 'yd' ? qpUnitRaw : undefined;

    return {
      initialZip: qpZip || initialZip,
      initialCategory: resolvedCategorySlug,
      initialVariantSlug: qpVariant,
      initialQuantity,
      initialQuantityUnit,
    };
  }, [searchParams, metro, initialCategory, initialZip]);
}

export function OrderFlow({ metro, initialCategory, initialZip }: OrderFlowProps) {
  const prefill = usePrefillOptions(metro, initialCategory, initialZip);
  const order = useMetroOrder(metro, prefill);
  const showBack = order.step !== 'zip' && order.step !== 'confirmed';
  const showSummary = order.quoteResult != null && order.step !== 'confirmed';

  return (
    <section id="order" className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-[1fr_18rem]">
          <div className="min-w-0 rounded-3xl border border-black/10 bg-white p-5 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-2">
              {showBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Go back"
                  onClick={order.goBack}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
              <h2 className="text-xl font-extrabold text-[#0F1115]">{STEP_TITLES[order.step]}</h2>
            </div>

            {/* Extra bottom clearance on mobile so the fixed price bar (rendered by
                PriceSummary below md) never overlaps the last field or CTA of a step —
                without it, a step's final button can sit directly under the sticky bar
                and become untappable once the user scrolls it into view. */}
            <div className={showSummary ? 'pb-24 md:pb-0' : undefined}>
              {(order.step === 'zip' || order.step === 'out-of-area') && <ZipStep order={order} />}
              {order.step === 'category' && <CategoryStep order={order} />}
              {order.step === 'variant' && <VariantStep order={order} />}
              {order.step === 'quantity' && <QuantityStep order={order} />}
              {order.step === 'date' && <DayStep order={order} />}
              {order.step === 'contact' && <DetailsStep order={order} />}
              {order.step === 'confirmed' && <Confirmation order={order} />}
            </div>
          </div>

          {showSummary && (
            <div className="min-w-0">
              <PriceSummary order={order} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
