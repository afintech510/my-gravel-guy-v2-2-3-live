import React from 'react';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';
import { formatCurrency } from '@/utils/feeCalculation';
import type { Product } from './types';

interface StickyCTAMobileProps {
  product: Product;
  minTons: number;
  onOrderClick: () => void;
}

export default function StickyCTAMobile({ product, minTons, onOrderClick }: StickyCTAMobileProps) {
  const estimatedStartPrice = product.price * minTons;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4 md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Starting at</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(estimatedStartPrice)}
          </p>
          <p className="text-xs text-muted-foreground">{minTons}+ tons</p>
        </div>
        <Button size="lg" onClick={onOrderClick} className="flex-1 max-w-[200px]">
          <Truck className="mr-2 h-4 w-4" />
          Order Now
        </Button>
      </div>
    </div>
  );
}
