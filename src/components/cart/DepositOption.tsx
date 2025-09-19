import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, CreditCard, HandCoins } from 'lucide-react';

interface DepositOptionProps {
  isSelected: boolean;
  onToggle: (selected: boolean) => void;
  totalOrder: number;
}

const DepositOption = ({ isSelected, onToggle, totalOrder }: DepositOptionProps) => {
  const depositAmount = 199;
  const balanceDue = totalOrder - depositAmount;
  
  // Calculate price ranges
  const cardPriceRange = {
    min: Math.round(balanceDue * 0.85),
    max: Math.round(balanceDue * 1.0)
  };
  
  const cashPriceRange = {
    min: Math.round(balanceDue * 0.70),
    max: Math.round(balanceDue * 0.90)
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 mb-4">
      <div className="flex items-start space-x-3">
        <Checkbox 
          id="deposit-option" 
          checked={isSelected} 
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="deposit-option" className="text-lg font-semibold text-primary cursor-pointer">
              $199 Down Payment
            </label>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
              <TrendingDown className="w-3 h-3 mr-1" />
              Best Value
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Let MyGravelGuy negotiate the best price for you. We will offer you both a Cash on Delivery Price and a Card Price. 
            <span className="font-semibold text-primary"> This could save up to 25% off the Buy it Now price.</span>
          </p>
          
          {isSelected && (
            <div className="bg-white/80 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Down Payment (Today):</span>
                <span className="font-bold text-primary text-lg">${depositAmount}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2 text-muted-foreground">Balance Due Options:</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-medium text-blue-800">Card Price</div>
                      <div className="text-sm font-semibold text-blue-900">
                        ${cardPriceRange.min} - ${cardPriceRange.max}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <HandCoins className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-xs font-medium text-green-800">Cash Price</div>
                      <div className="text-sm font-semibold text-green-900">
                        ${cashPriceRange.min} - ${cashPriceRange.max}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositOption;