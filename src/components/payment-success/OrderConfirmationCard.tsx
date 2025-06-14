
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface OrderConfirmationCardProps {
  orderId: string | null;
  usedFallback: boolean;
}

export const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({
  orderId,
  usedFallback
}) => {
  return (
    <Card className="bg-green-50 border-green-200 mb-8">
      <CardContent className="pt-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-green-800">Order Confirmed!</h1>
        {orderId && (
          <p className="text-green-700 mb-2 font-medium">
            Order ID: {orderId}
          </p>
        )}
        <p className="text-green-700 mb-2">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
        <p className="text-green-600">
          You will receive confirmation emails shortly with your delivery details.
        </p>
        {usedFallback && (
          <p className="text-amber-600 text-sm mt-2">
            <em>Order processed using backup data.</em>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
