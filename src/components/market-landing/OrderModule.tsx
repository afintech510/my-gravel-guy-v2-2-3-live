import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Truck, Zap, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import type { MarketMaterialData, Product, OrderModuleState } from './types';
import { calculateTotalWithFees, formatCurrency, formatPercentage } from '@/utils/feeCalculation';
import { getMaterialDisplayName } from '@/services/marketMaterialService';
import { shouldFireAddToCart, trackAddToCart } from '@/utils/analytics';

interface OrderModuleProps {
  pageData: MarketMaterialData;
  product: Product;
  canonicalMarketSlug: string;
  onBeginCheckout?: (state: OrderModuleState, totalPrice: number) => void;
}

export default function OrderModule({ 
  pageData, 
  product, 
  canonicalMarketSlug,
  onBeginCheckout 
}: OrderModuleProps) {
  const materialName = getMaterialDisplayName(pageData, product);
  const [orderState, setOrderState] = useState<OrderModuleState>({
    tons: pageData.min_tons,
    zipCode: null,
    email: null,
    phone: null,
    expediteEnabled: false,
    saturdayEnabled: false,
    deliveryDate: null,
    deliveryStreet: null,
    deliveryCity: null,
    deliveryState: null,
    name: null,
    instructions: null
  });

  const basePrice = product.price;
  
  // Calculate fees
  const feeResult = calculateTotalWithFees({
    baseTons: orderState.tons,
    pricePerTon: basePrice,
    expediteEnabled: orderState.expediteEnabled,
    saturdayEnabled: orderState.saturdayEnabled,
    expediteFeePct: pageData.expedite_fee_pct,
    saturdayFeePct: pageData.sat_fee_pct
  });

  // Track add_to_cart when conditions are met
  useEffect(() => {
    if (shouldFireAddToCart(orderState, product.slug || '')) {
      trackAddToCart(
        canonicalMarketSlug,
        product.slug || '',
        materialName,
        orderState.tons,
        feeResult.totalWithFees
      );
    }
  }, [orderState.tons, orderState.zipCode, orderState.email, orderState.phone]);

  const handleTonsChange = (value: number[]) => {
    setOrderState(prev => ({ ...prev, tons: value[0] }));
  };

  const handleInputChange = (field: keyof OrderModuleState, value: string | boolean | null) => {
    setOrderState(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      orderState.tons >= pageData.min_tons &&
      orderState.tons <= pageData.max_tons &&
      orderState.zipCode &&
      orderState.zipCode.length >= 5 &&
      (orderState.email || orderState.phone) &&
      orderState.name
    );
  };

  const handleBeginCheckout = () => {
    if (onBeginCheckout && isFormValid()) {
      onBeginCheckout(orderState, feeResult.totalWithFees);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-xl">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Order {materialName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Direct bulk delivery • {pageData.min_tons}-{pageData.max_tons} tons
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Quantity Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">Quantity (Tons)</Label>
            <span className="text-2xl font-bold text-primary">{orderState.tons}</span>
          </div>
          <Slider
            value={[orderState.tons]}
            onValueChange={handleTonsChange}
            min={pageData.min_tons}
            max={pageData.max_tons}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pageData.min_tons} tons min</span>
            <span>{pageData.max_tons} tons max</span>
          </div>
        </div>

        {/* Fee Options */}
        <div className="space-y-4 border-t border-b py-4">
          {pageData.expedite_enabled && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <Label className="font-medium">Expedited Delivery</Label>
                  <p className="text-xs text-muted-foreground">
                    Same-day or next-day (+{formatPercentage(pageData.expedite_fee_pct)})
                  </p>
                </div>
              </div>
              <Switch
                checked={orderState.expediteEnabled}
                onCheckedChange={(checked) => handleInputChange('expediteEnabled', checked)}
              />
            </div>
          )}

          {pageData.sat_enabled && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <Label className="font-medium">Saturday Delivery</Label>
                  <p className="text-xs text-muted-foreground">
                    Weekend availability (+{formatPercentage(pageData.sat_fee_pct)})
                  </p>
                </div>
              </div>
              <Switch
                checked={orderState.saturdayEnabled}
                onCheckedChange={(checked) => handleInputChange('saturdayEnabled', checked)}
              />
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base ({orderState.tons} tons × {formatCurrency(basePrice)}/ton)</span>
            <span>{formatCurrency(feeResult.baseTotal)}</span>
          </div>
          {orderState.expediteEnabled && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>Expedite Fee (+{formatPercentage(pageData.expedite_fee_pct)})</span>
              <span>+{formatCurrency(feeResult.expediteFeeAmount)}</span>
            </div>
          )}
          {orderState.saturdayEnabled && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Saturday Fee (+{formatPercentage(pageData.sat_fee_pct)})</span>
              <span>+{formatCurrency(feeResult.saturdayFeeAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(feeResult.totalWithFees)}</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="font-medium">Contact Information</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={orderState.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value || null)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={orderState.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value || null)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 555-5555"
                value={orderState.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value || null)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="zipCode">Delivery ZIP Code *</Label>
            <Input
              id="zipCode"
              placeholder="12345"
              maxLength={5}
              value={orderState.zipCode || ''}
              onChange={(e) => handleInputChange('zipCode', e.target.value || null)}
            />
          </div>
        </div>

        {/* Confirmation Window Notice */}
        <div className="flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-blue-700 dark:text-blue-300">
            We'll confirm expedite/Saturday requests within {pageData.confirmation_window_hours} hours. 
            If we can't meet your timing, extra fees are fully refundable.
          </p>
        </div>

        {/* CTA Button */}
        <Button 
          size="lg" 
          className="w-full text-lg h-14"
          onClick={handleBeginCheckout}
          disabled={!isFormValid()}
        >
          {isFormValid() ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Continue to Checkout
            </>
          ) : (
            'Complete Required Fields'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
