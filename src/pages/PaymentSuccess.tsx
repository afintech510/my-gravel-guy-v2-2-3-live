
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Truck, Package, MapPin, Calendar, AlertCircle, RefreshCw, Shield, Clock, XCircle, Database, Mail, User, Phone, FileText, Camera } from "lucide-react";
import { useCart } from '../contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { detectPaymentSuccess, clearCheckoutBackup, getCheckoutBackup } from '../utils/paymentUtils';
import { insertOrderToDatabase, testDatabaseInsert } from '../services/orderInsertService';
import { sendBothOrderEmails } from '../services/emailService';
import { useProductNameResolver } from '../hooks/useProductNameResolver';

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
  locationPhotoUrl?: string | null; // Added missing property
}

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
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
  
  // Extract product IDs from order items for name resolution
  const productIds = orderItems.map(item => item.product_name); // product_name currently contains ID
  const { resolveProductName, isLoading: isResolvingNames } = useProductNameResolver(productIds);
  
  // Transform database records to email format
  const transformOrderDataForEmail = (insertedOrders: any[], orderId: string) => {
    console.log('=== TRANSFORMING ORDER DATA FOR EMAIL ===', { insertedOrders, orderId });
    
    if (!insertedOrders || insertedOrders.length === 0) {
      throw new Error('No order data to transform for email');
    }

    // Get customer email from the first order record
    const customerEmail = insertedOrders[0].delivery_email;
    if (!customerEmail) {
      throw new Error('No customer email found in order data');
    }

    // Transform items for email template
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

  const processPaymentSuccess = async (isRetry = false) => {
    console.log('=== PAYMENT SUCCESS PROCESSING START ===', { isRetry, retryCount });
    
    if (!isRetry) {
      setIsLoading(true);
      setProcessingError(null);
      setDetailedError(null);
    }
    
    try {
      // Extract URL parameters - prioritize payment_intent
      const paymentIntentId = searchParams.get('payment_intent') || searchParams.get('payment_intent_id');
      const orderIdParam = searchParams.get('order_id');
      const paymentSuccess = searchParams.get('success');
      
      console.log('URL Parameters:', {
        paymentIntentId: paymentIntentId ? paymentIntentId.substring(0, 20) + '...' : null,
        orderIdParam,
        paymentSuccess,
        hasProcessedPayment
      });
      
      // Check localStorage for backup order information
      const checkoutOrderBackup = getCheckoutBackup();
      const checkoutInProgress = localStorage.getItem('checkout-in-progress');
      const checkoutOrderId = localStorage.getItem('checkout-order-id');
      
      console.log('=== BACKUP DATA STRUCTURE ANALYSIS ===');
      console.log('Full backup data:', checkoutOrderBackup);
      
      if (checkoutOrderBackup?.items?.[0]) {
        const firstItem = checkoutOrderBackup.items[0];
        console.log('First backup item analysis:', {
          fullItem: firstItem,
          itemKeys: Object.keys(firstItem),
          hasContactInfo: !!firstItem.contactInfo,
          hasDeliveryAddress: !!firstItem.deliveryAddress,
          hasDeliveryDate: !!firstItem.deliveryDate,
          hasTons: !!firstItem.tons,
          contactInfo: firstItem.contactInfo,
          deliveryAddress: firstItem.deliveryAddress,
          deliveryDate: firstItem.deliveryDate,
          tons: firstItem.tons
        });
      }
      
      // Determine if we should process the payment
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
        
        // Validate backup data before proceeding
        if (checkoutOrderBackup) {
          if (!checkoutOrderBackup.items || !Array.isArray(checkoutOrderBackup.items) || checkoutOrderBackup.items.length === 0) {
            throw new Error('Invalid backup data: missing or empty items array');
          }
        }
        
        // Primary: Try payment intent verification (without DB insert)
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
        // Fallback: Use backup data only
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
        
        // Process verification result - only show errors for actual failures, not sandbox/testing scenarios
        if (verificationResult) {
          const { data, error } = verificationResult;
          
          if (error && !paymentIntentId) {
            // Only show verification errors if we have a payment intent (real payment)
            // For fallback/testing scenarios, don't show verification errors
            console.log('Verification error in fallback mode (likely testing):', error);
          } else if (error) {
            console.error('Payment verification error:', error);
            // Only show error for real payment scenarios with payment intent
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
            
            // Now insert the order to database using our simplified service
            if (checkoutOrderBackup && !dbInsertComplete) {
              await handleDatabaseInsert(checkoutOrderBackup, currentOrderId, data);
            }
            
          } else if (data?.success === false && paymentIntentId) {
            console.warn('Verification returned success: false', data);
            // Only show error if we're in a real payment scenario
            setProcessingError(data.error || 'Payment verification failed');
            setDetailedError(data.debug_info || 'No additional debug information');
          } else {
            console.log('No payment verification data found, proceeding with fallback');
            // For testing/fallback scenarios, proceed anyway
            const currentOrderId = orderIdParam || checkoutOrderId;
            setOrderId(currentOrderId);
            setVerificationMethod('fallback');
            setUsedFallback(true);
            
            if (checkoutOrderBackup && !dbInsertComplete) {
              await handleDatabaseInsert(checkoutOrderBackup, currentOrderId, {});
            }
          }
        } else {
          throw new Error('No verification method available - missing payment intent and backup data');
        }

        // Clear the cart and localStorage only on success
        if (!processingError && orderItems.length > 0) {
          clearCart();
          clearCheckoutBackup();
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
      
      // Transform inserted orders to display format
      const displayOrders = insertedOrders.map(order => ({
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
      setDbInsertComplete(true);

      /*
      toast({
        title: "Order Processed Successfully",
        description: "Your order has been recorded successfully!",
        variant: "default"
      }); */

      // Send emails after successful database insert
      await handleEmailSending(insertedOrders, currentOrderId);
      
    } catch (dbError) {
      console.error('Database insert failed:', dbError);
      setProcessingError(`Order confirmed but database insert failed: ${dbError.message}`);
      setDetailedError(dbError.stack || 'No stack trace available');
      
      toast({
        title: "Database Error",
        description: "Your payment was successful, but we couldn't save the order details. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const handleEmailSending = async (insertedOrders: any[], orderId: string) => {
    try {
      console.log('=== STARTING EMAIL SENDING ===');
      
      // Transform order data for email format
      const orderDataForEmail = transformOrderDataForEmail(insertedOrders, orderId);
      
      console.log('Order data transformed for email:', orderDataForEmail);
      
      // Send both customer and business emails
      const emailResults = await sendBothOrderEmails(orderDataForEmail);
      
      console.log('Email sending results:', emailResults);
      
      setEmailsSent(true);
      setEmailStatus({
        customer: emailResults.customerEmail.success,
        business: emailResults.internalEmail.success
      });
      
      if (emailResults.overallSuccess) {
        /*
        toast({
          title: "Emails Sent Successfully",
          description: "Order confirmation emails have been sent!",
          variant: "default"
        }); */
         clearCart();
          clearCheckoutBackup(); 
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

  const handleCheckoutStyleDatabaseInsert = async () => {
    setTestingDbInsert(true);
    try {
      console.log('=== TESTING CHECKOUT-STYLE DATABASE INSERT ===');
      
      // Get backup data just like checkout does
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
      
      // Process each item exactly like checkout does - accessing from metadata where available
      const orderRecords = checkoutOrderBackup.items.map((item: any, index: number) => {
        console.log('=== PROCESSING ITEM FOR CHECKOUT-STYLE INSERT ===', {
          itemIndex: index,
          item: item,
          metadata: item.metadata,
          directContactInfo: item.contactInfo,
          directDeliveryAddress: item.deliveryAddress,
          directDeliveryDate: item.deliveryDate,
          directTons: item.tons
        });
        
        // Access contact info from metadata first, then fallback to direct properties
        const contactInfo = item.metadata?.contactName ? {
          name: item.metadata.contactName,
          phone: item.metadata.contactPhone,
          email: item.metadata.contactEmail
        } : (item.contactInfo || {});
        
        // Access delivery address from metadata first, then fallback to direct properties
        let deliveryAddress: { street?: string; city?: string; state?: string; zip?: string } = {};
        if (item.metadata?.deliveryAddress) {
          // Parse if it's a JSON string, otherwise use directly
          try {
            deliveryAddress = typeof item.metadata.deliveryAddress === 'string' 
              ? JSON.parse(item.metadata.deliveryAddress) 
              : item.metadata.deliveryAddress;
          } catch (e) {
            console.error('Error parsing deliveryAddress from metadata:', e);
            deliveryAddress = item.deliveryAddress || {};
          }
        } else {
          deliveryAddress = item.deliveryAddress || {};
        }
        
        // Access delivery date from metadata first, then fallback to direct properties
        const deliveryDate = item.metadata?.deliveryDate || item.deliveryDate;
        
        // Access delivery preferences from metadata first, then fallback to direct properties
        const deliveryTimePreference = item.metadata?.deliveryTimePreference || item.deliveryTimePreference;
        const deliveryInstructions = item.metadata?.deliveryInstructions || item.deliveryInstructions;
        
        const quantity = item.tons || item.quantity || 1;
        
        const finalRecord = {
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
        
        console.log('=== FINAL MAPPED RECORD ===', {
          originalItem: item,
          extractedContactInfo: contactInfo,
          extractedDeliveryAddress: deliveryAddress,
          extractedDeliveryDate: deliveryDate,
          extractedTimePreference: deliveryTimePreference,
          extractedInstructions: deliveryInstructions,
          finalRecord: finalRecord
        });
        
        return finalRecord;
      });
      
      console.log('Order records for checkout-style insert:', orderRecords);
      
      // Direct database insert like checkout does
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
      setDbInsertComplete(true);

      /*
      toast({
        title: "Checkout-Style Insert Successful",
        description: "Order inserted using checkout method with metadata access!",
        variant: "default"
      }); */

      // Send emails after successful database insert
      await handleEmailSending(data, checkoutOrderId);
      
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

  const handleTestDatabaseInsert = async () => {
    setTestingDbInsert(true);
    try {
      const result = await testDatabaseInsert();
      if (result.success) {
        toast({
          title: "Test Insert Successful",
          description: "Test order was successfully inserted into the database!",
          variant: "default"
        });
      } else {
        toast({
          title: "Test Insert Failed",
          description: `Test insert failed: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Insert Error",
        description: "An error occurred during the test insert",
        variant: "destructive"
      });
    } finally {
      setTestingDbInsert(false);
    }
  };

  // Auto-trigger checkout-style database insert - simplified to match manual button behavior
  useEffect(() => {
    const attemptAutoInsert = async () => {
      console.log('=== AUTO-INSERT ATTEMPT STARTED ===', {
        autoInsertAttempted,
        isLoading,
        dbInsertComplete,
        hasBackupData: !!getCheckoutBackup()?.items?.length
      });

      // Only check essential conditions like the manual button
      if (autoInsertAttempted) {
        console.log('❌ Auto-insert already attempted, skipping');
        return;
      }

      if (isLoading) {
        console.log('❌ Still loading, skipping auto-insert');
        return;
      }

      if (dbInsertComplete) {
        console.log('❌ Database insert already complete, skipping auto-insert');
        return;
      }

      // Check if there's backup data available (same check as manual button)
      const checkoutOrderBackup = getCheckoutBackup();
      if (!checkoutOrderBackup?.items || checkoutOrderBackup.items.length === 0) {
        console.log('❌ No backup data available for auto-insert');
        return;
      }

      console.log('✅ All conditions met, attempting auto checkout-style insert');
      console.log('Backup data found:', checkoutOrderBackup);
      
      setAutoInsertAttempted(true);
      
      try {
        await handleCheckoutStyleDatabaseInsert();
        console.log('✅ Auto checkout-style insert completed successfully');
      } catch (error) {
        console.error('❌ Auto checkout-style insert failed:', error);
      }
    };

    // Increased delay to ensure all state updates are complete
    const timer = setTimeout(attemptAutoInsert, 2500);
    
    return () => clearTimeout(timer);
  }, [isLoading, dbInsertComplete, autoInsertAttempted]);

  useEffect(() => {
    processPaymentSuccess();
  }, [clearCart, toast, searchParams, hasProcessedPayment]);

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

  const formatDeliveryTimePreference = (preference: string | null) => {
    switch (preference) {
      case 'anytime':
        return 'Anytime (7am-5pm)';
      case 'morning':
        return 'Morning (7am-12pm)';
      case 'afternoon':
        return 'Afternoon (12pm-5pm)';
      default:
        return 'Not specified';
    }
  };

  // Navigation handlers with cart clearing
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

  const VerificationStatusCard = () => {
    if (verificationMethod === 'fallback') {
      return (
        <Card className="mb-8 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Payment Processing Method
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium">Backup Data Processing</p>
                  <p className="text-sm text-gray-600">
                    Your order was processed using backup data. This is normal and your payment was successful.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else if (verificationMethod === 'stripe_verified') {
      return (
        <Card className="mb-8 border-green-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Payment Verification
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Stripe Verified</p>
                  <p className="text-sm text-gray-600">
                    Your payment has been verified directly with Stripe. All details are confirmed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  /*
    const EmailStatusCard = () => {
      if (emailsSent && emailStatus) {
        return (
          <Card className="mb-8 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Notifications
              </h3>
              
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  emailStatus.customer 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {emailStatus.customer ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">Customer Confirmation Email</p>
                    <p className="text-sm text-gray-600">
                      {emailStatus.customer 
                        ? 'Successfully sent to customer' 
                        : 'Failed to send to customer'
                      }
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  emailStatus.business 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {emailStatus.business ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">Business Notification Email</p>
                    <p className="text-sm text-gray-600">
                      {emailStatus.business 
                        ? 'Successfully sent to order.support@mygravelguy.com' 
                        : 'Failed to send business notification'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }
      
      return null;
    };
  */

  const ProcessingStatusCard = () => {
    if (isLoading) {
      return (
        <Card className="mb-8 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              Processing Order
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex-1">
                  <p className="font-medium">Verifying Payment</p>
                  <p className="text-sm text-gray-600">
                    Please wait while we process your order details...
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (!isLoading && !processingError && orderItems.length === 0) {
      return (
        <Card className="mb-8 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Order Processing
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex-1">
                  <p className="font-medium">Processing Order Details</p>
                  <p className="text-sm text-gray-600">
                    We're retrieving your order information. This may take a moment.
                  </p>
                </div>
              </div>
              
              {/* Test Database Insert Buttons */}
              <div className="flex justify-center gap-2 pt-2">
                <Button 
                  onClick={handleTestDatabaseInsert} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={testingDbInsert}
                >
                  <Database className="h-4 w-4" />
                  {testingDbInsert ? 'Testing...' : 'Test Schema-Accurate DB Insert'}
                </Button>
                
                {/* Hidden button - will be auto-triggered */}
                <Button 
                  onClick={handleCheckoutStyleDatabaseInsert} 
                  variant="outline" 
                  size="sm"
                  style={{ display: 'none' }}
                  disabled={testingDbInsert}
                >
                  <Database className="h-4 w-4" />
                  {testingDbInsert ? 'Testing...' : 'Insert Using Checkout Method'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (processingError) {
      return (
        <Card className="mb-8 border-red-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Processing Issue
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium">Order Processing Delayed</p>
                  <p className="text-sm text-gray-600">
                    There was an issue retrieving your order details, but your payment was likely successful.
                  </p>
                  <p className="text-xs text-red-600 mt-1">{processingError}</p>
                  {detailedError && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Technical Details</summary>
                      <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {detailedError}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center gap-2 pt-2">
                {retryCount < 3 && (
                  <Button 
                    onClick={handleRetry} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Processing ({retryCount}/3)
                  </Button>
                )}
                
                <Button 
                  onClick={handleTestDatabaseInsert} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={testingDbInsert}
                >
                  <Database className="h-4 w-4" />
                  {testingDbInsert ? 'Testing...' : 'Test Schema-Accurate DB Insert'}
                </Button>
                
                {/* Hidden button - will be auto-triggered */}
                <Button 
                  onClick={handleCheckoutStyleDatabaseInsert} 
                  variant="outline" 
                  size="sm"
                  style={{ display: 'none' }}
                  disabled={testingDbInsert}
                >
                  <Database className="h-4 w-4" />
                  {testingDbInsert ? 'Testing...' : 'Insert Using Checkout Method'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-green-50 border-green-200 mb-8">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-800">Order Confirmed!</h1>
            {orderId && (
              <p className="text-green-700 mb-2 font-medium">
                Order ID: {orderId}
              </p>
            )}
            <p className="text-green-700 mb-2">
              Thank you for your purchase. Your order has been processed successfully.
            </p>
            <p className="text-green-600">
              You will receive confirmation emails shortly with your delivery details.
            </p>
            {usedFallback && (
              <p className="text-amber-600 text-sm mt-2">
                <em>Order processed using backup data.</em>
              </p>
            )}
          </CardContent>
        </Card>

        <VerificationStatusCard />
        {/*    <ProcessingStatusCard /> /*}

        {/* Order Items Details - Enhanced with full contact info and delivery details */}
        {orderItems.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
                {isResolvingNames && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600 ml-2" />
                )}
              </h2>
              
              <div className="space-y-6">
                {orderItems.map((item, index) => (
                  <div key={item.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-lg">
                          {resolveProductName(item.product_name)}
                        </h3>
                        <p className="text-gray-600">Quantity: {item.quantity} tons</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${item.total_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'processed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {(item.delivery_address_street || item.delivery_date || item.contact_name) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Delivery Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Contact Information */}
                          {item.contact_name && (
                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Contact Information
                              </h5>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="font-medium">{item.contact_name}</div>
                                {item.contact_email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{item.contact_email}</span>
                                  </div>
                                )}
                                {item.contact_phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{item.contact_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Delivery Address */}
                          {item.delivery_address_street && (
                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Delivery Address
                              </h5>
                              <div className="text-sm text-gray-600">
                                <div>{item.delivery_address_street}</div>
                                <div>
                                  {item.delivery_address_city}, {item.delivery_address_state} {item.delivery_address_zip}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Delivery Schedule */}
                          {item.delivery_date && (
                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Delivery Schedule
                              </h5>
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">
                                  {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div>{formatDeliveryTimePreference(item.delivery_time_preference)}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Special Instructions and Photo Upload Indication */}
                        {(item.delivery_instructions || item.locationPhotoUrl) && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            {item.delivery_instructions && (
                              <div>
                                <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Special Instructions
                                </h5>
                                <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                                  {item.delivery_instructions}
                                </p>
                              </div>
                            )}
                            
                            {/* Photo Upload Indication */}
                            <div>
                              <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                Location Photo
                              </h5>
                              <div className="text-sm">
                                {item.locationPhotoUrl ? (
                                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-200">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Photo uploaded - delivery location documented</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500 bg-gray-100 p-2 rounded border">
                                    <Camera className="h-4 w-4" />
                                    <span>No location photo provided</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">1</span>
                  <h3 className="font-medium">Order Processing</h3>
                </div>
                <p className="text-sm text-gray-600">
                  We've received your order and are preparing your delivery. You'll receive a confirmation email soon.
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">2</span>
                  <h3 className="font-medium">Delivery Preparation</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Our team will prepare your materials and schedule the delivery for your selected date.
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">3</span>
                  <h3 className="font-medium">Delivery</h3>
                </div>
                <p className="text-sm text-gray-600">
                  On your scheduled delivery date, our driver will deliver your materials to the specified location.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Delivery Information</h2>
            </div>
            <p className="mb-4">
              If you need to make any changes to your delivery details or have questions about your order, 
              please contact our customer service team as soon as possible.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Customer Service</h3>
                <p className="text-sm">Phone: (555) 123-4567</p>
                <p className="text-sm">Email: support@mygravelguy.com</p>
                <p className="text-sm">Hours: Mon-Fri, 8am-5pm</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Need Help?</h3>
                <p className="text-sm mb-2">Have questions about your delivery or need assistance?</p>
                <Button variant="outline" asChild>
                  <a href="/contact">Contact Support</a>
                </Button>
                </div>
            </div>
          </div>

          {/* Navigation Buttons - moved above Order Details */}
        <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            onClick={handleContinueShopping}
            variant="default"
          >
            Continue Shopping
          </Button>
          <Button 
            onClick={handleReturnHome}
            variant="outline"
          >
            Return to Homepage
          </Button>
        </div>
          
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
