
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Detailed logging for debugging
      console.log('Checkout Items:', items);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: JSON.stringify({ items })
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw new Error(error.message || "Failed to create checkout session");
      }
      
      if (!data?.url) {
        console.error('No checkout URL received:', data);
        throw new Error("No checkout URL received from payment service");
      }
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout Error:", error);
      
      // More informative error handling
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Could not process checkout. Please try again.";
      
      setError(errorMessage);
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <Button asChild>
            <a href="/products">Continue Shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Product</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity (tons)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, +(item.quantity - 0.1).toFixed(1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, +e.target.value)}
                        step="0.1"
                        min="0.1"
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, +(item.quantity + 0.1).toFixed(1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-500 mt-1 block">{item.quantity.toFixed(1)} tons</span>
                  </TableCell>
                  <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col items-end space-y-4">
            <div className="text-2xl font-bold">
              Total: ${total.toFixed(2)}
            </div>
            <Button 
              onClick={handleCheckout} 
              className="w-48"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
