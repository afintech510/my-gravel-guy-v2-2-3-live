
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { detectPaymentSuccess, clearCheckoutBackup, getCheckoutBackup } from '../utils/paymentUtils';
import { insertOrderToDatabase } from '../services/orderInsertService';
import { sendBothOrderEmails } from '../services/emailService';

export const usePaymentProcessing = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'stripe_verified' | 'fallback' | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [dbInsertComplete, setDbInsertComplete] = useState(false);
  const [testingDbInsert, setTestingDbInsert] = useState(false);
  const [autoInsertAttempted, setAutoInsertAttempted] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ customer: boolean; business: boolean } | null>(null);

  const transformOrderDataForEmail = (insertedOrders: any[], orderId: string) => {
    console.log('=== TRANSFORMING ORDER DATA FOR EMAIL ===', { insertedOrders, orderId });
    
    if (!insertedOrders || insertedOrders.length === 0) {
      throw new Error('No order data to transform for email');
    }

    const customerEmail = insertedOrders[0].delivery_email;
    if (!customerEmail) {
      throw new Error('No customer email found in order data');
    }

    const emailItems = insertedOrders.map(order => ({
      product_name: order.product_id,
      quantity: order.quantity,
      total_price: order.total_price,
      delivery_date: order.delivery_date,
      delivery_address: order.delivery_street ? {
        street: order.delivery_street,
        city: order.delivery_city,
        state: order.delivery_state,
        zip: order.delivery_zip
      } : undefined,
      contact_info: order.delivery_name ? {
        name: order.delivery_name,
        email: order.delivery_email,
        phone: order.delivery_phone
      } : undefined,
      delivery_time_preference: order.delivery_time_preference,
      delivery_instructions: order.delivery_instructions
    }));

    const totalAmount = insertedOrders.reduce((sum, order) => sum + order.total_price, 0);

    return {
      order_id: orderId,
      items: emailItems,
      total_amount: totalAmount,
      customer_email: customerEmail,
      customer_name: insertedOrders[0].delivery_name || 'Valued Customer'
    };
  };

  const handleEmailSending = async (insertedOrders: any[], orderId: string) => {
    try {
      console.log('=== STARTING EMAIL SENDING ===');
      
      const orderDataForEmail = transformOrderDataForEmail(insertedOrders, orderId);
      console.log('Order data transformed for email:', orderDataForEmail);
      
      const emailResults = await sendBothOrderEmails(orderDataForEmail);
      console.log('Email sending results:', emailResults);
      
      setEmailsSent(true);
      setEmailStatus({
        customer: emailResults.customerEmail.success,
        business: emailResults.internalEmail.success
      });
      
      if (emailResults.overallSuccess) {
        toast({
          title: "Emails Sent Successfully",
          description: "Order confirmation emails have been sent!",
          variant: "default"
        });
      } else {
        let errorMessage = "Some emails failed to send: ";
        if (!emailResults.customerEmail.success) {
          errorMessage += "customer confirmation ";
        }
        if (!emailResults.internalEmail.success) {
          errorMessage += "business notification ";
        }
        
        toast({
          title: "Email Sending Issue",
          description: errorMessage + "Please contact support if needed.",
          variant: "destructive"
        });
      }
      
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      toast({
        title: "Email Error",
        description: "Order processed successfully, but emails couldn't be sent. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const handleDatabaseInsert = async (checkoutOrderBackup: any, currentOrderId: string, verificationData: any) => {
    try {
      console.log('=== STARTING DATABASE INSERT ===');
      
      const orderData = {
        orderId: currentOrderId,
        items: checkoutOrderBackup.items,
        stripeSessionId: verificationData.sessionId,
        stripePaymentIntentId: verificationData.paymentIntentId
      };
      
      const insertedOrders = await insertOrderToDatabase(orderData);
      
      setDbInsertComplete(true);
      
      toast({
        title: "Order Processed Successfully",
        description: "Your order has been recorded successfully!",
        variant: "default"
      });

      await handleEmailSending(insertedOrders, currentOrderId);
      
      return insertedOrders;
      
    } catch (dbError) {
      console.error('Database insert failed:', dbError);
      setProcessingError(`Order confirmed but database insert failed: ${dbError.message}`);
      setDetailedError(dbError.stack || 'No stack trace available');
      
      toast({
        title: "Database Error",
        description: "Your payment was successful, but we couldn't save the order details. Please contact support.",
        variant: "destructive"
      });
      throw dbError;
    }
  };

  const processPaymentSuccess = async (isRetry = false) => {
    console.log('=== PAYMENT SUCCESS PROCESSING START ===', { isRetry, retryCount });
    
    if (!isRetry) {
      setIsLoading(true);
      setProcessingError(null);
      setDetailedError(null);
    }
    
    try {
      const paymentIntentId = searchParams.get('payment_intent') || searchParams.get('payment_intent_id');
      const orderIdParam = searchParams.get('order_id');
      const paymentSuccess = searchParams.get('success');
      
      console.log('URL Parameters:', {
        paymentIntentId: paymentIntentId ? paymentIntentId.substring(0, 20) + '...' : null,
        orderIdParam,
        paymentSuccess,
        hasProcessedPayment
      });
      
      const checkoutOrderBackup = getCheckoutBackup();
      const checkoutInProgress = localStorage.getItem('checkout-in-progress');
      const checkoutOrderId = localStorage.getItem('checkout-order-id');
      
      const shouldProcess = !hasProcessedPayment && (
        paymentIntentId || 
        paymentSuccess === 'true' || 
        (checkoutInProgress === 'true' && checkoutOrderId)
      );
      
      console.log('Should process payment:', shouldProcess);
      
      if (shouldProcess || isRetry) {
        if (!isRetry) {
          setHasProcessedPayment(true);
        }
        
        let verificationResult = null;
        
        if (checkoutOrderBackup) {
          if (!checkoutOrderBackup.items || !Array.isArray(checkoutOrderBackup.items) || checkoutOrderBackup.items.length === 0) {
            throw new Error('Invalid backup data: missing or empty items array');
          }
        }
        
        if (paymentIntentId) {
          console.log('Processing with payment intent ID:', paymentIntentId.substring(0, 20) + '...');
          
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { 
              paymentIntentId,
              orderId: orderIdParam || checkoutOrderId,
              backupData: checkoutOrderBackup,
              skipDbInsert: true
            }
          });

          console.log('Verify payment response (payment intent):', { 
            success: data?.success, 
            paymentVerified: data?.paymentVerified,
            error: error?.message 
          });
          verificationResult = { data, error };
        } 
        else if (checkoutOrderId && checkoutOrderBackup) {
          console.log('Processing with backup data only:', checkoutOrderId);
          
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { 
              orderId: checkoutOrderId,
              fallbackMode: true,
              backupData: checkoutOrderBackup,
              skipDbInsert: true
            }
          });

          console.log('Fallback verification response:', { 
            success: data?.success, 
            paymentVerified: data?.paymentVerified,
            error: error?.message 
          });
          verificationResult = { data, error };
        }
        
        if (verificationResult) {
          const { data, error } = verificationResult;
          
          if (error && !paymentIntentId) {
            console.log('Verification error in fallback mode (likely testing):', error);
          } else if (error) {
            console.error('Payment verification error:', error);
            if (paymentIntentId) {
              setProcessingError(`Payment verification issue: ${error.message}`);
              setDetailedError(error.details || error.stack || 'No additional details available');
              
              toast({
                title: "Payment Processing Issue",
                description: "There was an issue processing your payment verification. Please contact support if this persists.",
                variant: "destructive"
              });
            }
          } else if (data?.success && data?.paymentVerified) {
            console.log('Payment verification successful');
            
            const currentOrderId = data.orderId || orderIdParam || checkoutOrderId;
            setOrderId(currentOrderId);
            setVerificationMethod(data.verification_method || 'stripe_verified');
            setUsedFallback(data.used_fallback || false);
            setProcessingError(null);
            setDetailedError(null);
            
            if (checkoutOrderBackup && !dbInsertComplete) {
              return await handleDatabaseInsert(checkoutOrderBackup, currentOrderId, data);
            }
            
          } else if (data?.success === false && paymentIntentId) {
            console.warn('Verification returned success: false', data);
            setProcessingError(data.error || 'Payment verification failed');
            setDetailedError(data.debug_info || 'No additional debug information');
          } else {
            console.log('No payment verification data found, proceeding with fallback');
            const currentOrderId = orderIdParam || checkoutOrderId;
            setOrderId(currentOrderId);
            setVerificationMethod('fallback');
            setUsedFallback(true);
            
            if (checkoutOrderBackup && !dbInsertComplete) {
              return await handleDatabaseInsert(checkoutOrderBackup, currentOrderId, {});
            }
          }
        } else {
          throw new Error('No verification method available - missing payment intent and backup data');
        }
        
      } else {
        console.log('Payment already processed or no trigger found');
      }
      
    } catch (error) {
      console.error('Error processing payment success:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingError(errorMessage);
      setDetailedError(error instanceof Error ? error.stack || 'No stack trace available' : 'Unknown error type');
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (retryCount >= 3) {
      toast({
        title: "Maximum Retries Reached",
        description: "Please contact support for assistance with your order.",
        variant: "destructive"
      });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await processPaymentSuccess(true);
  };

  return {
    // State
    hasProcessedPayment,
    orderId,
    isLoading,
    processingError,
    verificationMethod,
    usedFallback,
    retryCount,
    detailedError,
    dbInsertComplete,
    testingDbInsert,
    autoInsertAttempted,
    emailsSent,
    emailStatus,
    // Actions
    processPaymentSuccess,
    handleRetry,
    setTestingDbInsert,
    setAutoInsertAttempted
  };
};
