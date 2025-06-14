
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export const PaymentOptionsCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We offer flexible payment options to make your purchase convenient:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="font-medium text-sm">Credit/Debit</div>
              <div className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="font-medium text-sm">Klarna</div>
              <div className="text-xs text-gray-500 mt-1">Pay in 4 installments</div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="font-medium text-sm">Afterpay</div>
              <div className="text-xs text-gray-500 mt-1">Buy now, pay later</div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="font-medium text-sm">Affirm</div>
              <div className="text-xs text-gray-500 mt-1">Monthly payments</div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            Payment options may vary based on order total and location. Final options will be displayed at checkout.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
