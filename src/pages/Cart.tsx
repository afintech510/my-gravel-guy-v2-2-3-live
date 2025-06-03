import React, { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import CartItemCard from '../components/cart/CartItemCard';
import { CartPricingUpdater } from '../components/cart/CartPricingUpdater';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Cart = () => {
  const { items, total, discountTotal, removeFromCart, updateDeliveryDetails } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  
  // Check if any discounts have been applied
  const hasDiscounts = total !== discountTotal;
  const totalDiscount = total - discountTotal;

  // Check if all items have complete delivery info
  const allItemsComplete = items.every(item => 
    item.deliveryDate && 
    item.deliveryAddress?.street && 
    item.contactInfo?.name && 
    item.contactInfo?.phone && 
    item.contactInfo?.email
  );

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  // Handle delivery details update with auto-checkout logic
  const handleDeliveryUpdate = (productId: string | number, details: any) => {
    updateDeliveryDetails(productId, {
      deliveryDate: details.deliveryDate,
      deliveryAddress: details.deliveryAddress,
      contactInfo: details.contactInfo,
      deliveryTimePreference: details.deliveryTimePreference,
      deliveryInstructions: details.deliveryInstructions,
      locationPhotoUrl: details.locationPhotoUrl
    });

    // Check if this update makes all items complete
    // We need to simulate the updated state since React state updates are async
    const updatedItems = items.map(item => 
      item.id === productId 
        ? { ...item, ...details }
        : item
    );
    
    const allWillBeComplete = updatedItems.every(item => 
      item.deliveryDate && 
      item.deliveryAddress?.street && 
      item.contactInfo?.name && 
      item.contactInfo?.phone && 
      item.contactInfo?.email
    );

    // Auto-navigate to checkout if all items are now complete
    if (allWillBeComplete) {
      setTimeout(() => {
        navigate('/checkout');
      }, 100); // Small delay to ensure state updates
    }
  };

  // Send cart confirmation email using the form email directly
  const sendCartConfirmationEmail = async () => {
    try {
      console.log('=== CART CONFIRMATION EMAIL DEBUG ===');
      console.log('Sending cart confirmation email...');
      
      // Get the email from the first item's contact info (from the form)
      const customerEmail = items[0]?.contactInfo?.email;
      const customerName = items[0]?.contactInfo?.name || 'Cart Customer';
      
      console.log('Cart confirmation customer email from form:', customerEmail);
      console.log('Cart confirmation customer name from form:', customerName);
      
      if (!customerEmail) {
        console.error('No customer email found in cart form data');
        return;
      }
      
      const orderData = {
        order_id: `CART-${Date.now()}`,
        items: items.map(item => ({
          product_name: item.name,
          quantity: item.tons,
          total_price: item.price * item.tons,
          delivery_date: item.deliveryDate?.toISOString(),
          delivery_address: item.deliveryAddress,
          contact_info: item.contactInfo
        })),
        total_amount: discountTotal,
        customer_email: customerEmail,
        customer_name: customerName
      };

      console.log('Cart confirmation order data:', orderData);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: 'Confirmed in Cart - Cart Information Completed',
          html: generateCartConfirmationEmail(orderData),
          type: 'internal_notification',
          orderData
        }
      });

      if (error) {
        console.error('Cart confirmation email error:', error);
      } else {
        console.log('Cart confirmation email sent successfully:', data);
      }
    } catch (error) {
      console.error('Cart confirmation email exception:', error);
    }
  };

  // Generate simple email template for cart confirmation
  const generateCartConfirmationEmail = (orderData: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmed in Cart</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Confirmed in Cart 🛒</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Customer completed delivery information</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a8a; margin-top: 0;">Cart ID: ${orderData.order_id}</h2>
          <p><strong>Customer:</strong> ${orderData.customer_name}</p>
          <p><strong>Email:</strong> ${orderData.customer_email}</p>
          <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
          <p><strong>Items:</strong> ${orderData.items.length}</p>
          
          <div style="margin: 20px 0;">
            <h3>Items:</h3>
            ${orderData.items.map((item: any) => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px;">
                <strong>${item.product_name}</strong><br>
                Quantity: ${item.quantity} tons<br>
                Price: $${item.total_price.toFixed(2)}
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleProceedToCheckout = async () => {
    if (!allItemsComplete) return;
    
    setIsProcessingCheckout(true);
    
    try {
      // Send cart confirmation email using form data
      await sendCartConfirmationEmail();
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process checkout. Please try again.",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

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
          <Button onClick={() => navigate('/shop')} className="mt-4">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {/* Add the pricing updater component */}
      <CartPricingUpdater />
      
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => (
            <CartItemCard
              key={`${item.id}-${index}`}
              item={item}
              onRemove={removeFromCart}
              onUpdateDelivery={handleDeliveryUpdate}
              autoExpandDelivery={true} // Auto-expand for better UX
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

            {/* Delivery completion status */}
            {!allItemsComplete && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  Complete delivery information for all items to proceed automatically to checkout.
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleProceedToCheckout}
              disabled={!allItemsComplete || isProcessingCheckout}
              className="w-full h-auto py-3 px-4 text-sm leading-tight"
            >
              {isProcessingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                  <span className="text-center">Processing...</span>
                </>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <span className="text-center flex-1">
                    {allItemsComplete ? 'Confirm Delivery & Proceed' : 'Complete Delivery Info'}
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
