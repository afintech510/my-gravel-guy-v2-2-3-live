import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CreditCard, Banknote, ArrowRight } from 'lucide-react';
import { useLandingPage } from '@/contexts/LandingPageContext';

interface DepositFlowProps {
  priceData: {
    normalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    cashPriceEstimate: number;
    cardPriceEstimate: number;
  } | null;
  discountUnlocked: boolean;
}

export const DepositFlow = ({ priceData, discountUnlocked }: DepositFlowProps) => {
  const { initiateCheckout } = useLandingPage();

  if (!priceData) return null;

  const currentPrice = discountUnlocked ? priceData.discountedPrice : priceData.normalPrice;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">Choose Your Path</h3>
        <p className="text-muted-foreground">
          Reserve with a deposit or buy it now at the price shown
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Option A: Refundable Deposit */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
                <Shield className="h-3 w-3 mr-1" />
                Recommended
              </Badge>
              <h4 className="text-lg font-semibold text-foreground">Pay $199 Refundable Deposit</h4>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Lock in and let Gravel Guy negotiate the lowest wholesale price within 24 hours. 
                Your $199 applies to the final total.
              </p>
              <p>
                <strong className="text-foreground">Fully refundable</strong> if you don't like the price or material photos.
              </p>
            </div>

            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  <span>Cash Price (Estimate)</span>
                </div>
                <span className="font-semibold">${priceData.cashPriceEstimate.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Card Price (Estimate)</span>
                </div>
                <span className="font-semibold">${priceData.cardPriceEstimate.toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={() => initiateCheckout('deposit')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              Reserve with $199 (Refundable)
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Option B: Buy It Now */}
        <Card className="border-2 border-muted hover:border-muted-foreground/40 transition-colors">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-foreground">Buy It Now</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {discountUnlocked ? 'At Your Discounted Price' : 'At Current Price'}
              </p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                ${currentPrice.toLocaleString()}
              </div>
              {discountUnlocked && (
                <Badge variant="secondary" className="mt-2">
                  ${priceData.discountAmount.toFixed(0)} Discount Applied
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Pay the full amount now and we'll handle the rest:</p>
              <ul className="space-y-1 ml-4">
                <li>• Coordinate with local suppliers</li>
                <li>• Send material photos for approval</li>
                <li>• Schedule convenient delivery</li>
              </ul>
            </div>

            <Button
              onClick={() => initiateCheckout('buy_now')}
              variant="outline"
              className="w-full border-foreground/20 hover:bg-muted"
              size="lg"
            >
              Buy It Now - ${currentPrice.toLocaleString()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Both options include:</p>
        <p>✓ Material photo confirmation ✓ Professional delivery ✓ Expert consultation</p>
      </div>
    </div>
  );
};