
import React, { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import CartItemCard from '../components/cart/CartItemCard';
import { CartPricingUpdater } from '../components/cart/CartPricingUpdater';
import CouponCode from '../components/cart/CouponCode';
import PaymentMethodLogos from '../components/payment/PaymentMethodLogos';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Cart = () => {
  const {
    items,
    total,
    discountTotal,
    removeFromCart,
    updateDeliveryDetails
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
      item.id === productId ? { ...item, ...details } : item
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

  // Enhanced cart confirmation email with better data structure
  const sendCartConfirmationEmail = async () => {
    try {
      console.log('=== ENHANCED CART CONFIRMATION EMAIL DEBUG ===');
      console.log('Sending enhanced cart confirmation email...');

      // Get customer info from the first item's contact info
      const customerEmail = items[0]?.contactInfo?.email;
      const customerName = items[0]?.contactInfo?.name || 'Cart Customer';
      
      console.log('Customer email:', customerEmail);
      console.log('Customer name:', customerName);
      
      if (!customerEmail) {
        console.error('No customer email found in cart form data');
        return;
      }

      // Create enhanced order data with properly structured delivery information
      const orderData = {
        order_id: `CART-${Date.now()}`,
        items: items.map(item => {
          console.log('Processing cart item for email:', {
            id: item.id,
            name: item.name,
            hasContactInfo: !!item.contactInfo,
            hasDeliveryAddress: !!item.deliveryAddress,
            hasDeliveryDate: !!item.deliveryDate
          });

          return {
            product_name: item.name,
            quantity: item.tons,
            total_price: item.price * item.tons,
            delivery_date: item.deliveryDate?.toISOString(),
            delivery_address: item.deliveryAddress ? {
              street: item.deliveryAddress.street,
              city: item.deliveryAddress.city,
              state: item.deliveryAddress.state,
              zip: item.deliveryAddress.zip
            } : null,
            contact_info: item.contactInfo ? {
              name: item.contactInfo.name,
              email: item.contactInfo.email,
              phone: item.contactInfo.phone
            } : null,
            delivery_time_preference: item.deliveryTimePreference,
            delivery_instructions: item.deliveryInstructions,
            location_photo_url: item.locationPhotoUrl
          };
        }),
        total_amount: discountTotal,
        customer_email: customerEmail,
        customer_name: customerName
      };

      console.log('Enhanced cart confirmation order data:', orderData);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: 'Enhanced Cart Confirmation - Complete Delivery Information',
          html: generateCartConfirmationEmail(orderData),
          type: 'internal_notification',
          orderData
        }
      });

      if (error) {
        console.error('Enhanced cart confirmation email error:', error);
      } else {
        console.log('Enhanced cart confirmation email sent successfully:', data);
      }
    } catch (error) {
      console.error('Enhanced cart confirmation email exception:', error);
    }
  };

  // Generate enhanced email template for cart confirmation with delivery details
  const generateCartConfirmationEmail = (orderData: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Enhanced Cart Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Enhanced Cart Confirmation 🛒</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Customer completed enhanced delivery information</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e3a8a; margin-top: 0;">Cart ID: ${orderData.order_id}</h2>
          <p><strong>Customer:</strong> ${orderData.customer_name}</p>
          <p><strong>Email:</strong> ${orderData.customer_email}</p>
          <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
          <p><strong>Items:</strong> ${orderData.items.length}</p>
          
          <div style="margin: 20px 0;">
            <h3>Enhanced Order Items with Complete Delivery Details:</h3>
            ${orderData.items.map((item: any) => `
              <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #1e3a8a;">
                <h4 style="margin-top: 0; color: #1e3a8a;">${item.product_name}</h4>
                <p><strong>Quantity:</strong> ${item.quantity} tons</p>
                <p><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
                
                ${item.contact_info ? `
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                    <h5 style="margin-top: 0; color: #1e40af;">✅ Contact Information (Complete):</h5>
                    <p><strong>Name:</strong> ${item.contact_info.name}</p>
                    <p><strong>Phone:</strong> ${item.contact_info.phone}</p>
                    <p><strong>Email:</strong> ${item.contact_info.email}</p>
                  </div>
                ` : '<p style="color: #dc2626;">❌ Missing contact information</p>'}
                
                ${item.delivery_address ? `
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                    <h5 style="margin-top: 0; color: #1e40af;">✅ Delivery Address (Complete):</h5>
                    <p>${item.delivery_address.street}</p>
                    <p>${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}</p>
                  </div>
                ` : '<p style="color: #dc2626;">❌ Missing delivery address</p>'}
                
                ${item.delivery_date ? `
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                    <h5 style="margin-top: 0; color: #1e40af;">✅ Delivery Schedule (Complete):</h5>
                    <p><strong>Date:</strong> ${new Date(item.delivery_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</p>
                    ${item.delivery_time_preference ? `
                      <p><strong>Time Preference:</strong> ${
                        item.delivery_time_preference === 'anytime' ? 'Anytime (7am-5pm)' : 
                        item.delivery_time_preference === 'morning' ? 'Morning (7am-12pm)' : 
                        item.delivery_time_preference === 'afternoon' ? 'Afternoon (12pm-5pm)' : 
                        'Not specified'
                      }</p>
                    ` : ''}
                  </div>
                ` : '<p style="color: #dc2626;">❌ Missing delivery date</p>'}
                
                ${item.delivery_instructions ? `
                  <div style="background: #fff7ed; padding: 15px; border-radius: 6px; margin: 10px 0;">
                    <h5 style="margin-top: 0; color: #c2410c;">📝 Special Instructions:</h5>
                    <p>${item.delivery_instructions}</p>
                  </div>
                ` : ''}
                
                ${item.location_photo_url ? `
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">
                    <h5 style="margin-top: 0; color: #374151;">📷 Location Photo:</h5>
                    <p>Photo uploaded by customer</p>
                    <p style="font-size: 12px; color: #6b7280;">URL: ${item.location_photo_url}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div style="background: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h5 style="margin-top: 0; color: #166534;">✅ Data Quality Check:</h5>
            <p style="color: #166534; margin: 0;">All required delivery information has been collected and is ready for checkout processing.</p>
          </div>
        </div>
      </body>
      </html>
    `;
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
      // Send enhanced cart confirmation email
      await sendCartConfirmationEmail();

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
              
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span className="text-green-600 font-medium">Included</span>
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
