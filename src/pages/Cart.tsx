import React, { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import CartItemCard from '../components/cart/CartItemCard';
import { CartPricingUpdater } from '../components/cart/CartPricingUpdater';
import CouponCode from '../components/cart/CouponCode';
import PaymentMethodLogos from '../components/payment/PaymentMethodLogos';
import DepositOption from '../components/cart/DepositOption';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendCartConfirmationEmail } from '@/services/cartEmailService';

const Cart = () => {
  const {
    items,
    total,
    discountTotal,
    removeFromCart,
    updateDeliveryDetails,
    depositOption,
    toggleDepositOption,
    getPaymentTotal
  } = useCart();
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

  // Function to scroll to the first incomplete item
  const scrollToFirstIncompleteItem = () => {
    const incompleteItemIndex = items.findIndex(item => 
      !item.deliveryDate || 
      !item.deliveryAddress?.street || 
      !item.contactInfo?.name || 
      !item.contactInfo?.phone || 
      !item.contactInfo?.email
    );

    if (incompleteItemIndex !== -1) {
      // Find the cart item card element
      const cartItemElement = document.querySelector(`[data-item-index="${incompleteItemIndex}"]`);
      if (cartItemElement) {
        cartItemElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // If the delivery form is collapsed, try to expand it
        setTimeout(() => {
          const expandButton = cartItemElement.querySelector('[data-testid="expand-delivery-form"]');
          if (expandButton instanceof HTMLElement) {
            expandButton.click();
          }
        }, 500);
      }
    }
  };

  // Handle delivery details update without auto-checkout logic
  const handleDeliveryUpdate = (productId: string | number, details: any) => {
    updateDeliveryDetails(productId, {
      deliveryDate: details.deliveryDate,
      deliveryAddress: details.deliveryAddress,
      contactInfo: details.contactInfo,
      deliveryTimePreference: details.deliveryTimePreference,
      deliveryInstructions: details.deliveryInstructions
    });

    // Scroll to top of page after saving delivery info
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Form will collapse automatically when delivery info is complete
    // No auto-navigation to checkout - let customer consider deposit option
  };

  const handleProceedToCheckout = async () => {
    // If not all items are complete, scroll to the first incomplete item
    if (!allItemsComplete) {
      scrollToFirstIncompleteItem();
      toast({
        variant: "destructive",
        title: "Incomplete Information",
        description: "Please complete the delivery information for all items to proceed.",
      });
      return;
    }
    
    setIsProcessingCheckout(true);
    try {
      // Send enhanced cart confirmation email for checkout
      await sendCartConfirmationEmail({
        items,
        cartId: `CHECKOUT-${Date.now()}`,
        actionType: 'checkout'
      });

      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error processing enhanced checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process checkout. Please try again."
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
      
      <h1 className="text-3xl font-bold mb-8">Confirm Delivery Details</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} data-item-index={index}>
              <CartItemCard 
                item={item} 
                onRemove={removeFromCart} 
                onUpdateDelivery={handleDeliveryUpdate}
                autoExpandDelivery={true} // Auto-expand for better UX
              />
            </div>
          ))}
          
          {/* Deposit Option */}
          <DepositOption 
            isSelected={depositOption}
            onToggle={toggleDepositOption}
            totalOrder={discountTotal}
          />
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-muted rounded-lg p-6 sticky top-24">
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
              
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span className="text-green-600 font-medium">Included</span>
              </div>
            </div>
            
            {/* Payment Total */}
            <div className="flex justify-between font-semibold text-lg mb-2">
              <span>{depositOption ? 'Payment Today' : 'Total'}</span>
              <span>${getPaymentTotal().toFixed(2)}</span>
            </div>
            
            {/* Balance Due Display */}
            {depositOption && (
              <div className="mb-4 p-3 bg-card rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">Balance Due:</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Card Price:</span>
                    <span>${Math.round((discountTotal - 199) * 0.85)} - ${Math.round((discountTotal - 199) * 1.0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Price:</span>
                    <span>${Math.round((discountTotal - 199) * 0.70)} - ${Math.round((discountTotal - 199) * 0.90)}</span>
                  </div>
                </div>
              </div>
            )}

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

            {/* Coupon Code Component */}
            <CouponCode />

            {/* Payment Method Logos */}
            <PaymentMethodLogos />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
