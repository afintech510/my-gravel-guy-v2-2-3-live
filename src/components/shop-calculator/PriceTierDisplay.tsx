
import React from 'react';
import { PriceTier } from '../../services/productTypes';
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from 'lucide-react';

interface PriceTierDisplayProps {
  priceTiers: PriceTier[];
  basePrice: number;
  appliedTier?: PriceTier;
}

const PriceTierDisplay: React.FC<PriceTierDisplayProps> = ({
  priceTiers,
  basePrice,
  appliedTier
}) => {
  if (!priceTiers || priceTiers.length === 0) {
    return null;
  }
  
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <InfoIcon className="h-4 w-4" />
          <h4 className="font-semibold text-sm">Volume Discount Tiers</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Order more to save on the per-ton price
        </p>
        
        <div className="space-y-2">
          {priceTiers.map((tier) => {
            const isApplied = tier.id === appliedTier?.id;
            const discountPercentage = ((1 - tier.multiplier) * 100).toFixed(0);
            const tierPrice = (basePrice * tier.multiplier).toFixed(2);
            
            return (
              <div 
                key={tier.id} 
                className={`flex justify-between items-center py-1 px-2 rounded text-sm ${
                  isApplied ? 'bg-primary/10 border border-primary/30' : ''
                }`}
              >
                <div>
                  <span className="font-medium">
                    {tier.min_tons}-{tier.max_tons ? tier.max_tons : '∞'} tons:
                  </span>
                  {isApplied && <span className="text-xs ml-2 text-primary">(Current tier)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">${tierPrice}/ton</span>
                  {tier.multiplier < 1 && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                      Save {discountPercentage}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceTierDisplay;
