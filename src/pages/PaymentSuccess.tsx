
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useCart } from '../contexts/CartContext';
import { useToast } from "@/components/ui/use-toast";

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  
  useEffect(() => {
    // Clear the cart when the payment success page is loaded
    clearCart();
    
    // Show a success toast
    toast({
      title: "Payment Successful",
      description: "Thank you for your purchase! Your order has been received.",
    });
  }, [clearCart, toast]);

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been processed successfully and you will receive a confirmation email shortly.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild variant="default">
            <a href="/products">Continue Shopping</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/">Return to Homepage</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
