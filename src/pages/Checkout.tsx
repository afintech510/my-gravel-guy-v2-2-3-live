import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storeCheckoutBackup, createEnhancedBackup } from '../utils/paymentUtils';
import { testDatabaseInsert } from '../services/orderInsertService';
import type { OrderInsertData } from '../services/productTypes';

// Import new components
import { CheckoutErrorCard } from '../components/checkout/CheckoutErrorCard';
import { OrderSummaryCard } from '../components/checkout/OrderSummaryCard';
import { PaymentOptionsCard } from '../components/checkout/PaymentOptionsCard';
import { PaymentSummaryCard } from '../components/checkout/PaymentSummaryCard';

// Import utilities
import { generateCheckoutConfirmationEmail } from '../utils/checkout/emailTemplates';
import { formatCartItemsForStripe, validateCartItems } from '../utils/checkout/checkoutHelpers';

const Checkout = () => {
  const { items, total, discountTotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingDB, setIsTestingDB] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if any items are in cart
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // Calculate if discounts are applied
  const hasDiscounts = total !== discountTotal;
  const totalDiscount = total - discountTotal;

  // Test database insertion function with schema-accurate data
  const testDatabaseInsertion = async () => {
    setIsTestingDB(true);
    setCheckoutError(null);
    
    try {
      console.log('=== TESTING SCHEMA-ACCURATE DATABASE INSERTION ===');
      
      const testOrderId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const orderRecords: OrderInsertData[] = items.map((item, index) => ({
        order_id: testOrderId,
        stripe_session_id: `test_session_${testOrderId}_${index}`,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price,
        total_price: item.price * (item.tons || 1),
        quantity: item.tons || 1,
        status: 'test',
        delivery_name: item.contactInfo?.name,
        delivery_phone: item.contactInfo?.phone,
        delivery_email: item.contactInfo?.email,
        billing_name: item.contactInfo?.name,
        billing_email: item.contactInfo?.email,
        delivery_date: item.deliveryDate?.toISOString(),
        delivery_street: item.deliveryAddress?.street,
        delivery_city: item.deliveryAddress?.city,
        delivery_state: item.deliveryAddress?.state,
        delivery_zip: item.deliveryAddress?.zip,
        delivery_time_preference: item.deliveryTimePreference,
        delivery_instructions: item.deliveryInstructions
      }));

      console.log('Schema-accurate order records to insert:', orderRecords);

      const { data, error } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (error) {
        console.error('Database insertion error:', error);
        throw error;
      }

      console.log('Successfully inserted schema-accurate test orders:', data);
      
      toast({
        title: "Schema-Accurate Database Test Successful!",
        description: `Inserted ${data?.length || 0} test records with ID: ${testOrderId}`,
        className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
      });

    } catch (error) {
      console.error('Schema-accurate database test failed:', error);
      
      toast({
        variant: "destructive",
        title: "Database Test Failed",
        description: error instanceof Error ? error.message : "Failed to insert test records",
      });
    } finally {
      setIsTestingDB(false);
    }
  };

  // Send checkout confirmation email to internal team with enhanced delivery details
  const sendCheckoutConfirmationEmail = async (orderId: string) => {
    try {
      console.log('=== CHECKOUT CONFIRMATION EMAIL DEBUG ===');
      console.log('Sending checkout confirmation email...');
      
      const orderData = {
        order_id: orderId,
        items: items.map(item => ({
          product_name: item.name,
          quantity: item.tons,
          total_price: item.price * item.tons,
          delivery_date: item.deliveryDate?.toISOString(),
          delivery_address: item.deliveryAddress,
          contact_info: item.contactInfo,
          delivery_time_preference: item.deliveryTimePreference,
          delivery_instructions: item.deliveryInstructions,
          location_photo_url: item.locationPhotoUrl
        })),
        total_amount: discountTotal,
        customer_email: items[0]?.contactInfo?.email || 'checkout-confirmation@customer.com',
        customer_name: items[0]?.contactInfo?.name || 'Checkout Customer'
      };

      console.log('Checkout confirmation order data:', orderData);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: 'Continued to Payment - Customer Proceeded to Stripe',
          html: generateCheckoutConfirmationEmail(orderData),
          type: 'internal_notification',
          orderData
        }
      });

      if (error) {
        console.error('Checkout confirmation email error:', error);
      } else {
        console.log('Checkout confirmation email sent successfully:', data);
      }
    } catch (error) {
      console.error('Checkout confirmation email exception:', error);
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setCheckoutError(null);
    
    try {
      // Validate cart items before proceeding
      validateCartItems(items);

      const formattedItems = formatCartItemsForStripe(items);
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('=== CHECKOUT DEBUG START ===');
      console.log('Order ID generated:', orderId);
      console.log('Formatted items with discounts:', formattedItems);
      console.log('Original total:', total);
      console.log('Discounted total:', discountTotal);
      
      // Send checkout confirmation email first
      await sendCheckoutConfirmationEmail(orderId);
      
      // Create enhanced backup with better validation
      const orderBackup = createEnhancedBackup(orderId, items, {
        email: items[0]?.contactInfo?.email || 'guest@mygravelguy.com',
        name: items[0]?.contactInfo?.name || 'Guest User'
      });
      
      storeCheckoutBackup(orderBackup);
      
      console.log('Enhanced order backup stored:', orderBackup);
      
      // Call the create-payment Supabase Edge function with better error handling
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: JSON.stringify({ 
          items: formattedItems,
          orderId: orderId
        })
      });
      
      if (error) {
        console.error('Create payment error:', error);
        throw new Error(`Payment service error: ${error.message}`);
      }
      
      if (!data || !data.url) {
        console.error('Invalid payment response:', data);
        throw new Error('Invalid response from payment service - no checkout URL received');
      }
      
      console.log('Payment URL received:', data.url);
      console.log('=== CHECKOUT DEBUG END ===');
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCheckoutError(errorMessage);
      
      // Clear the checkout progress flag on error
      localStorage.removeItem('checkout-in-progress');
      
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: errorMessage,
      });
      
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/cart')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
      </Button>
      
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Checkout Error Display */}
      {checkoutError && <CheckoutErrorCard error={checkoutError} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Cards */}
          <OrderSummaryCard items={items} />

          {/* Payment Options Info Card */}
          <PaymentOptionsCard />
        </div>
        
        <div className="lg:col-span-1">
          <PaymentSummaryCard
            total={total}
            discountTotal={discountTotal}
            hasDiscounts={hasDiscounts}
            totalDiscount={totalDiscount}
            onCheckout={handleCheckout}
            isLoading={isLoading}
          />

          {/* Hidden test button - keeping functionality but hiding from users */}
          <Button 
            onClick={testDatabaseInsertion}
            disabled={isTestingDB}
            variant="outline"
            className="w-full mb-4 hidden"
          >
            {isTestingDB ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Schema-Accurate DB...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Test Schema-Accurate DB Insert
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
