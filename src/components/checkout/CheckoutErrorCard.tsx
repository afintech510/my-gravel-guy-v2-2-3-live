
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface CheckoutErrorCardProps {
  error: string;
}

export const CheckoutErrorCard: React.FC<CheckoutErrorCardProps> = ({ error }) => {
  return (
    <Card className="mb-8 border-red-200">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Checkout Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
