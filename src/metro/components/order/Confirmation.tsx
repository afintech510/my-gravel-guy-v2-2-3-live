import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

export function Confirmation({ order }: { order: UseMetroOrderReturn }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
        <CheckCircle2 className="h-7 w-7 text-[#0F1115]" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-extrabold text-[#0F1115]">Request received</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#0F1115]/70">
        We'll text you within 1 business hour to confirm your delivery window. Nothing is charged yet.
      </p>
      <Button type="button" variant="outline" className="mt-6 min-h-[44px]" onClick={order.reset}>
        Start another order
      </Button>
    </div>
  );
}
