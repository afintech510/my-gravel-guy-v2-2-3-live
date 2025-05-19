import React, { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import CartItemCard from '../components/cart/CartItemCard';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { items, total, discountTotal, removeFromCart, updateDeliveryDetails } = useCart();
  const navigate = useNavigate();
  
  // Check if any discounts have been applied
  const hasDiscounts = total !== discountTotal;
  const totalDiscount = total - discountTotal;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (items.length === 0) {
    return (
      <div className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center space-y-6 py-12">
          <div className="bg-gray-100 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-gray-500" />
          </div>
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet. 
            Start by exploring our products and adding some to your cart.
          </p>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => (
            <CartItemCard
              key={`${item.id}-${index}`}
              item={item}
              onRemove={removeFromCart}
              onUpdateDelivery={updateDeliveryDetails}
            />
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {/* Order summary details */}
            <div className="space-y-2 mb-4 pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({items.length} items)</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {/* Show discount if applied */}
              {hasDiscounts && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
            </div>
            
            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span>${discountTotal.toFixed(2)}</span>
            </div>
            
            <Button 
              onClick={() => navigate('/checkout')} 
              className="w-full"
            >
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
