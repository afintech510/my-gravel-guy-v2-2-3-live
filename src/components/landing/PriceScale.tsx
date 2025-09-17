import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, CreditCard, Banknote } from 'lucide-react';
import { useLandingPage } from '@/contexts/LandingPageContext';

export const PriceScale = () => {
  const { state } = useLandingPage();

  if (!state.priceData) return null;

  const { normalPrice, discountedPrice, depositEstimate, cashPriceEstimate, cardPriceEstimate } = state.priceData;

  // Calculate scale positions (0-100%)
  const minPrice = Math.min(cashPriceEstimate, depositEstimate);
  const maxPrice = Math.max(normalPrice, cardPriceEstimate);
  const range = maxPrice - minPrice;

  const getPosition = (price: number) => {
    return ((price - minPrice) / range) * 100;
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-primary/5">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Current Price Display */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Your Pricing</h3>
            <div className="flex items-center justify-center gap-4">
              {!state.discountUnlocked && (
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    ${normalPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Normal Price</div>
                </div>
              )}
              
              {state.discountUnlocked && (
                <>
                  <div className="text-center">
                    <div className="text-lg text-muted-foreground line-through">
                      ${normalPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Before Discount</div>
                  </div>
                  <TrendingDown className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                      ${discountedPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-primary font-medium">Discounted Price</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Visual Price Scale */}
          <div className="relative">
            {/* Scale Line */}
            <div className="h-3 bg-gradient-to-r from-primary to-primary/30 rounded-full relative overflow-hidden">
              {/* Current Price Marker */}
              <div 
                className="absolute top-0 w-1 h-full bg-foreground shadow-lg"
                style={{ left: `${getPosition(state.discountUnlocked ? discountedPrice : normalPrice)}%` }}
              />
            </div>

            {/* Price Points */}
            <div className="flex justify-between mt-4 text-xs">
              <div className="text-center">
                <div className="flex items-center gap-1 text-primary">
                  <Banknote className="h-3 w-3" />
                  <span className="font-semibold">${cashPriceEstimate.toLocaleString()}</span>
                </div>
                <div className="text-muted-foreground">Cash Price</div>
                <div className="text-muted-foreground">(Best Rate)</div>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-1 text-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold">${depositEstimate}</span>
                </div>
                <div className="text-muted-foreground">Deposit</div>
                <div className="text-muted-foreground">(Refundable)</div>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-semibold">${cardPriceEstimate.toLocaleString()}</span>
                </div>
                <div className="text-muted-foreground">Card Price</div>
                <div className="text-muted-foreground">(Convenience)</div>
              </div>
            </div>
          </div>

          {/* Deposit Note */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Badge variant="secondary" className="mb-2">
              Important Note
            </Badge>
            <p className="text-sm text-muted-foreground">
              Your <strong className="text-primary">$199 refundable reservation deposit</strong> applies to the final price. 
              Choose cash to unlock the lowest wholesale rate, or card for convenience.
            </p>
          </div>

          {/* Cash vs Card Explanation */}
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
              <Banknote className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Cash Price (Lowest)</div>
                <div className="text-muted-foreground">
                  Pay remaining balance in cash for the best wholesale rate
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Card Price (Convenience)</div>
                <div className="text-muted-foreground">
                  Pay by card for convenience (standard rate applies)
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};