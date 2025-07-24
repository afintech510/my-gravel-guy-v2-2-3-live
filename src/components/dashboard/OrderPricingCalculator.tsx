import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface OrderPricingCalculatorProps {
  items: OrderItem[];
  zipCode?: string;
}

export function OrderPricingCalculator({ items, zipCode }: OrderPricingCalculatorProps) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const processingFeeRate = 0.03; // 3%
  const processingFee = subtotal * processingFeeRate;
  const total = subtotal + processingFee;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Processing Fee (3%):</span>
          <span>${processingFee.toFixed(2)}</span>
        </div>
        {zipCode && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery to {zipCode}:</span>
            <span>Included</span>
          </div>
        )}
        <hr />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}