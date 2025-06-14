
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useCart } from '../contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { clearCheckoutBackup, getCheckoutBackup } from '../utils/paymentUtils';
import { testDatabaseInsert } from '../services/orderInsertService';
import { usePaymentProcessing } from '../hooks/usePaymentProcessing';
import { OrderConfirmationCard } from '../components/payment-success/OrderConfirmationCard';
import { ProcessingStatusCard } from '../components/payment-success/ProcessingStatusCard';
import { OrderDetailsCard } from '../components/payment-success/OrderDetailsCard';
import { WhatHappensNextSection } from '../components/payment-success/WhatHappensNextSection';

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date: string | null;
  delivery_address_street: string | null;
  delivery_address_city: string | null;
  delivery_address_state: string | null;
  delivery_address_zip: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  delivery_time_preference: string | null;
  delivery_instructions: string | null;
  status: string;
}

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const {
    orderId,
    isLoading,
    processingError,
    usedFallback,
    retryCount,
    detailedError,
    dbInsertComplete,
    testingDbInsert,
    autoInsertAttempted,
    processPaymentSuccess,
    handleRetry,
    setTestingDbInsert,
    setAutoInsertAttempted
  } = usePaymentProcessing();

  const handleCheckoutStyleDatabaseInsert = async () => {
    setTestingDbInsert(true);
    try {
      console.log('=== TESTING CHECKOUT-STYLE DATABASE INSERT ===');
      
      const checkoutOrderBackup = getCheckoutBackup();
      const checkoutOrderId = localStorage.getItem('checkout-order-id') || `TEST-CHECKOUT-${Date.now()}`;
      
      console.log('Backup data for checkout-style insert:', checkoutOrderBackup);
      
      if (!checkoutOrderBackup?.items || checkoutOrderBackup.items.length === 0) {
        toast({
          title: "No Backup Data",
          description: "No cart backup data found for testing",
          variant: "destructive"
        });
        return;
      }
      
      // Process items directly from backup data
      const orderRecords = checkoutOrderBackup.items.map((item: any, index: number) => {
        const contactInfo = item.contactInfo || {};
        const deliveryAddress = item.deliveryAddress || {};
        const deliveryDate = item.deliveryDate;
        const quantity = item.tons || item.quantity || 1;
        const deliveryTimePreference = item.deliveryTimePreference;
        const deliveryInstructions = item.deliveryInstructions;

        return {
          order_id: checkoutOrderId,
          product_id: item.id.toString(),
          unit: 'tons',
          unit_price: item.price || 0,
          total_price: (item.price || 0) * quantity,
          quantity: quantity,
          status: 'confirmed',
          delivery_name: contactInfo.name || null,
          delivery_phone: contactInfo.phone || null,
          delivery_email: contactInfo.email || null,
          billing_name: contactInfo.name || null,
          billing_email: contactInfo.email || null,
          delivery_date: deliveryDate || null,
          delivery_street: deliveryAddress.street || null,
          delivery_city: deliveryAddress.city || null,
          delivery_state: deliveryAddress.state || null,
          delivery_zip: deliveryAddress.zip || null,
          delivery_time_preference: deliveryTimePreference || null,
          delivery_instructions: deliveryInstructions || null
        };
      });
      
      // Use Supabase client for direct insert
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();
      
      if (error) {
        console.error('Checkout-style insert error:', error);
        toast({
          title: "Checkout-Style Insert Failed",
          description: `Database error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Checkout-style insert successful:', data);
      
      // Transform to display format
      const displayOrders = data.map(order => ({
        id: order.id,
        order_id: order.order_id,
        product_name: order.product_id,
        quantity: order.quantity,
        total_price: order.total_price,
        delivery_date: order.delivery_date,
        delivery_address_street: order.delivery_street,
        delivery_address_city: order.delivery_city,
        delivery_address_state: order.delivery_state,
        delivery_address_zip: order.delivery_zip,
        contact_name: order.delivery_name,
        contact_email: order.delivery_email,
        contact_phone: order.delivery_phone,
        delivery_time_preference: order.delivery_time_preference,
        delivery_instructions: order.delivery_instructions,
        status: order.status
      }));
      
      setOrderItems(displayOrders);
      
      toast({
        title: "Checkout-Style Insert Successful",
        description: "Order inserted using checkout method with metadata access!",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Checkout-style insert failed:', error);
      toast({
        title: "Checkout-Style Insert Error",
        description: `An error occurred: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setTestingDbInsert(false);
    }
  };

  // Auto-trigger checkout-style database insert
  useEffect(() => {
    const attemptAutoInsert = async () => {
      console.log('=== AUTO-INSERT ATTEMPT STARTED ===', {
        autoInsertAttempted,
        isLoading,
        dbInsertComplete,
        hasBackupData: !!getCheckoutBackup()?.items?.length
      });

      if (autoInsertAttempted || isLoading || dbInsertComplete) {
        return;
      }

      const checkoutOrderBackup = getCheckoutBackup();
      if (!checkoutOrderBackup?.items || checkoutOrderBackup.items.length === 0) {
        console.log('❌ No backup data available for auto-insert');
        return;
      }

      console.log('✅ All conditions met, attempting auto checkout-style insert');
      setAutoInsertAttempted(true);
      
      try {
        await handleCheckoutStyleDatabaseInsert();
        console.log('✅ Auto checkout-style insert completed successfully');
      } catch (error) {
        console.error('❌ Auto checkout-style insert failed:', error);
      }
    };

    const timer = setTimeout(attemptAutoInsert, 2500);
    return () => clearTimeout(timer);
  }, [isLoading, dbInsertComplete, autoInsertAttempted]);

  useEffect(() => {
    processPaymentSuccess();
  }, [clearCart, toast]);

  const handleContinueShopping = () => {
    clearCart();
    clearCheckoutBackup();
    localStorage.removeItem('checkout-in-progress');
    localStorage.removeItem('checkout-order-id');
    toast({
      title: "Cart Cleared",
      description: "Your cart has been cleared. Happy shopping!",
      variant: "default"
    });
    navigate('/products');
  };

  const handleReturnHome = () => {
    clearCart();
    clearCheckoutBackup();
    localStorage.removeItem('checkout-in-progress');
    localStorage.removeItem('checkout-order-id');
    toast({
      title: "Cart Cleared",
      description: "Your cart has been cleared. Thank you for your order!",
      variant: "default"
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <OrderConfirmationCard orderId={orderId} usedFallback={usedFallback} />

        <ProcessingStatusCard
          isLoading={isLoading}
          processingError={processingError}
          detailedError={detailedError}
          retryCount={retryCount}
          testingDbInsert={testingDbInsert}
          onRetry={handleRetry}
          onSetTestingDbInsert={setTestingDbInsert}
        />

        <OrderDetailsCard orderItems={orderItems} />

        <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={handleContinueShopping} variant="default">
            Continue Shopping
          </Button>
          <Button onClick={handleReturnHome} variant="outline">
            Return to Homepage
          </Button>
        </div>

        <WhatHappensNextSection />
      </div>
    </div>
  );
};

export default PaymentSuccess;
