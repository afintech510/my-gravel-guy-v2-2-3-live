
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { 
  detectPaymentSuccess, 
  getCheckoutBackup, 
  setProcessingState, 
  getProcessingState,
  isProcessingComplete,
  isProcessingInProgress,
  completeOrderProcessing,
  wasOrderCompleted
} from '../utils/paymentUtils';
import { insertOrderToDatabase } from '../services/orderInsertService';
import { sendBothOrderEmails } from '../services/emailService';

export interface PaymentSuccessState {
  paymentVerified: boolean;
  dbInsertComplete: boolean;
  emailsSent: boolean;
  processing: boolean;
  error: string | null;
  orderItems: any[];
  orderId: string | null;
}

export const usePaymentSuccessFlow = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  
  const [state, setState] = useState<PaymentSuccessState>({
    paymentVerified: false,
    dbInsertComplete: false,
    emailsSent: false,
    processing: false,
    error: null,
    orderItems: [],
    orderId: null
  });

  const updateState = useCallback((updates: Partial<PaymentSuccessState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const processPaymentSuccess = useCallback(async () => {
    const { paymentIntentId, orderId: urlOrderId, success } = detectPaymentSuccess();
    
    if (!success || !paymentIntentId) {
      updateState({ error: 'Payment verification failed' });
      return;
    }

    const backupData = getCheckoutBackup();
    const orderId = urlOrderId || backupData?.orderId;

    if (!orderId) {
      updateState({ error: 'Order ID not found' });
      return;
    }

    // Check if this order was already completed
    if (wasOrderCompleted(orderId)) {
      console.log('Order already completed, skipping processing:', orderId);
      updateState({
        paymentVerified: true,
        dbInsertComplete: true,
        emailsSent: true,
        processing: false,
        orderId
      });
      return;
    }

    // Check if processing is already in progress
    if (isProcessingInProgress(orderId)) {
      console.log('Processing already in progress for order:', orderId);
      const currentState = getProcessingState();
      updateState({
        processing: true,
        orderId,
        paymentVerified: currentState?.stage !== 'payment_detected',
        dbInsertComplete: ['db_insert_completed', 'email_started', 'email_completed', 'processing_complete'].includes(currentState?.stage || ''),
        emailsSent: ['email_completed', 'processing_complete'].includes(currentState?.stage || '')
      });
      return;
    }

    // Start processing
    updateState({ processing: true, orderId, paymentVerified: true });
    setProcessingState({ orderId, stage: 'payment_detected', timestamp: Date.now() });

    try {
      // Step 1: Verify payment and insert to database
      if (backupData?.items) {
        setProcessingState({ orderId, stage: 'db_insert_started', timestamp: Date.now() });
        
        const orderData = {
          orderId,
          items: backupData.items,
          stripePaymentIntentId: paymentIntentId
        };

        const insertedOrders = await insertOrderToDatabase(orderData);
        console.log('Database insertion successful:', insertedOrders);
        
        updateState({ 
          dbInsertComplete: true, 
          orderItems: insertedOrders || [] 
        });
        
        setProcessingState({ orderId, stage: 'db_insert_completed', timestamp: Date.now() });

        // Step 2: Send emails
        setProcessingState({ orderId, stage: 'email_started', timestamp: Date.now() });
        
        const emailOrderData = {
          order_id: orderId,
          items: insertedOrders || [],
          total_amount: backupData.total,
          customer_email: backupData.customerInfo?.email || 'guest@mygravelguy.com',
          customer_name: backupData.customerInfo?.name || 'Guest User',
          payment_intent_id: paymentIntentId
        };

        await sendBothOrderEmails(emailOrderData);
        console.log('Emails sent successfully');
        
        updateState({ emailsSent: true });
        setProcessingState({ orderId, stage: 'email_completed', timestamp: Date.now() });

        // Step 3: Complete processing and clear session data
        completeOrderProcessing(orderId);
        clearCart();
        
        updateState({ processing: false });
        
        toast({
          title: "Order Confirmed!",
          description: `Order ${orderId} has been successfully processed.`,
          className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
        });

      } else {
        throw new Error('No backup data found for order processing');
      }

    } catch (error) {
      console.error('Error during payment success processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      updateState({ 
        error: errorMessage, 
        processing: false 
      });
      
      setProcessingState({ 
        orderId, 
        stage: 'payment_detected', 
        timestamp: Date.now(), 
        error: errorMessage 
      });

      toast({
        variant: "destructive",
        title: "Processing Error",
        description: errorMessage,
      });
    }
  }, [clearCart, toast, updateState]);

  // Auto-start processing on component mount
  useEffect(() => {
    const { success, paymentIntentId } = detectPaymentSuccess();
    if (success && paymentIntentId && !state.processing) {
      processPaymentSuccess();
    }
  }, [processPaymentSuccess, state.processing]);

  return {
    ...state,
    processPaymentSuccess,
    retryProcessing: processPaymentSuccess
  };
};
