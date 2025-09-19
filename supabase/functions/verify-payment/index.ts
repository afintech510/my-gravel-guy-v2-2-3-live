
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to verify JWT and extract user info (optional for guest verification)
const verifyAuth = async (authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null; // Return null for guest users
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Environment validation
    const stripeSecretKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Try to verify authentication (optional for guest verification)
    const authHeader = req.headers.get('authorization');
    const user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);
    
    console.log('Auth check result:', { hasUser: !!user, userEmail: user?.email });

    const requestBody = await req.text();
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { 
      paymentIntentId, 
      orderId, 
      fallbackMode = false, 
      backupData,
      skipDbInsert = false
    } = parsedData;

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    let verificationResult = {
      success: false,
      paymentVerified: false,
      verification_method: 'unknown',
      used_fallback: false,
      orderId: orderId,
      sessionId: null,
      paymentIntentId: null,
      error: null,
      isAuthorized: false // Add authorization flag
    };

    // Primary verification: Check with Stripe
    if (paymentIntentId && !fallbackMode) {
      try {
        let stripeObject;
        let isCheckoutSession = false;

        console.log('=== STRIPE VERIFICATION START ===', { paymentIntentId });

        if (paymentIntentId.startsWith('cs_')) {
          stripeObject = await stripe.checkout.sessions.retrieve(paymentIntentId);
          isCheckoutSession = true;
          console.log('Retrieved checkout session:', { 
            id: stripeObject.id,
            status: stripeObject.status,
            payment_status: stripeObject.payment_status,
            payment_intent: stripeObject.payment_intent
          });
        } else if (paymentIntentId.startsWith('pi_')) {
          stripeObject = await stripe.paymentIntents.retrieve(paymentIntentId);
          console.log('Retrieved payment intent:', { 
            id: stripeObject.id,
            status: stripeObject.status
          });
        } else {
          throw new Error(`Unknown payment identifier format: ${paymentIntentId}`);
        }

        // For authenticated users, validate that the payment belongs to them
        // For guest users, we rely on the backup data validation
        if (user && isCheckoutSession) {
          if (stripeObject.customer_email !== user.email) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Payment does not belong to authenticated user" 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
            );
          }
        }

        let paymentSuccess = false;
        let isAuthorized = false;
        if (isCheckoutSession) {
          paymentSuccess = stripeObject.status === 'complete' && stripeObject.payment_status === 'paid';
          // IMPORTANT: Always set the Stripe IDs in verification result
          verificationResult.sessionId = stripeObject.id;
          verificationResult.paymentIntentId = stripeObject.payment_intent;
          console.log('=== STRIPE IDs CAPTURED ===', {
            sessionId: verificationResult.sessionId,
            paymentIntentId: verificationResult.paymentIntentId
          });
        } else {
          // Handle Payment Intent status - check for authorization vs captured
          paymentSuccess = stripeObject.status === 'succeeded';
          isAuthorized = stripeObject.status === 'requires_capture'; // Authorization hold created
          verificationResult.paymentIntentId = stripeObject.id;
          console.log('=== PAYMENT INTENT ID CAPTURED ===', {
            paymentIntentId: verificationResult.paymentIntentId,
            status: stripeObject.status,
            isAuthorized: isAuthorized
          });
        }

        // For checkout sessions with manual capture, check the payment intent status
        if (isCheckoutSession && stripeObject.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(stripeObject.payment_intent);
            isAuthorized = paymentIntent.status === 'requires_capture';
            console.log('=== CHECKOUT SESSION PAYMENT INTENT STATUS ===', {
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
              isAuthorized: isAuthorized
            });
          } catch (error) {
            console.warn('Failed to retrieve payment intent from checkout session:', error);
          }
        }

        if (paymentSuccess || isAuthorized) {
          verificationResult.success = true;
          verificationResult.paymentVerified = true;
          verificationResult.verification_method = 'stripe_verified';
          verificationResult.isAuthorized = isAuthorized; // Add authorization flag
          console.log('=== STRIPE VERIFICATION SUCCESS ===', { 
            ...verificationResult,
            paymentSuccess,
            isAuthorized 
          });
        } else {
          verificationResult.error = `Payment not successful. Status: ${stripeObject.status}`;
          console.log('=== STRIPE VERIFICATION FAILED ===', { 
            status: stripeObject.status,
            payment_status: isCheckoutSession ? stripeObject.payment_status : 'N/A'
          });
        }

      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        verificationResult.error = `Stripe verification failed: ${stripeError.message}`;
      }
    }

    // Fallback verification with guest support
    if ((fallbackMode || !verificationResult.paymentVerified) && backupData) {
      console.log('=== FALLBACK VERIFICATION START ===', { fallbackMode, hasBackupData: !!backupData });
      
      if (backupData.items && Array.isArray(backupData.items) && backupData.items.length > 0) {
        // For authenticated users, validate email match
        if (user && backupData.customer?.email !== user.email) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Backup data does not match authenticated user" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
        
        // For guest users, validate that backup data contains contact email
        if (!user && !backupData.customer?.email) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Guest checkout requires customer email in backup data" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        verificationResult.success = true;
        verificationResult.paymentVerified = true;
        verificationResult.verification_method = 'fallback';
        verificationResult.used_fallback = true;
        verificationResult.orderId = backupData.orderId;
        verificationResult.error = null;

        // IMPORTANT: For fallback mode, try to preserve any Stripe IDs from URL or backup
        if (paymentIntentId) {
          if (paymentIntentId.startsWith('cs_')) {
            verificationResult.sessionId = paymentIntentId;
          } else if (paymentIntentId.startsWith('pi_')) {
            verificationResult.paymentIntentId = paymentIntentId;
          }
        }

        console.log('=== FALLBACK VERIFICATION SUCCESS ===', verificationResult);
      } else {
        verificationResult.error = 'Invalid backup data: missing or empty items';
        console.log('=== FALLBACK VERIFICATION FAILED ===', verificationResult.error);
      }
    }

    // Skip database operations if requested - but still return Stripe IDs
    if (skipDbInsert) {
      console.log('=== SKIPPING DB INSERT - RETURNING VERIFICATION RESULT ===', verificationResult);
      return new Response(
        JSON.stringify(verificationResult),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Database operation with guest support - update existing cart or create new order
    if (verificationResult.success && backupData && !skipDbInsert) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Determine order status based on payment verification results
        let orderStatus = 'pending';
        if (verificationResult.used_fallback) {
          orderStatus = 'processed';
        } else if (verificationResult.paymentVerified) {
          // Check if this is an authorization hold or actual payment
          orderStatus = verificationResult.isAuthorized ? 'authorized' : 'paid';
        }
        
        console.log('=== ORDER STATUS DETERMINED ===', {
          orderStatus,
          isAuthorized: verificationResult.isAuthorized,
          paymentVerified: verificationResult.paymentVerified,
          usedFallback: verificationResult.used_fallback
        });
        
        // Use guest defaults if no user is authenticated
        const billingEmail = user?.email || backupData.customer?.email || 'guest@mygravelguy.com';
        const billingName = backupData.customer?.name || 'Guest User';

        // Check if this is a deposit payment and adjust status accordingly
        const isDepositPayment = backupData.depositOption === true;
        if (isDepositPayment && orderStatus === 'paid') {
          orderStatus = 'Deposit Paid';
          console.log('=== SETTING DEPOSIT PAID STATUS ===', { 
            originalStatus: 'paid',
            newStatus: orderStatus,
            depositAmount: 199 
          });
        }

        let data;
        let insertError;

        // Step 1: Check if quote records exist for this order (for quote conversions)
        if (verificationResult.orderId && verificationResult.orderId.startsWith('QUOTE-')) {
          console.log('=== ATTEMPTING QUOTE TO ORDER CONVERSION ===', { quoteId: verificationResult.orderId });
          
          // Convert QUOTE- to ORDER- for quote conversions
          const orderIdFromQuote = verificationResult.orderId.replace('QUOTE-', 'ORDER-');
          
          // First, check how many quote records exist for this order
          const { data: existingQuotes, error: checkError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', verificationResult.orderId)
            .eq('status', 'Quote');
          
          console.log('=== QUOTE RECORDS FOUND ===', { 
            count: existingQuotes?.length || 0, 
            orderId: verificationResult.orderId,
            checkError: checkError?.message,
            queryUsed: 'eq order_id + eq status',
            quotes: existingQuotes?.map(q => ({ id: q.id, order_id: q.order_id, status: q.status })) || []
          });
          
          let quoteConversionData = null;
          let quoteUpdateError = null;
          let emailSent = false;
          
          // CRITICAL: Send email FIRST regardless of database update success
          // This ensures customers always get confirmation emails after successful payment
          if (existingQuotes && existingQuotes.length > 0) {
            console.log('=== SENDING CONFIRMATION EMAIL (PRIORITY) ===', { orderId: orderIdFromQuote });
            try {
              // Calculate total amount from quote data
              const totalAmount = existingQuotes.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
              
              console.log('=== EMAIL DATA PREPARED ===', {
                orderId: orderIdFromQuote,
                customerName: billingName,
                customerEmail: billingEmail,
                totalAmount: totalAmount,
                itemCount: existingQuotes.length
              });
              
              const emailResult = await supabase.functions.invoke('send-quote-conversion-email', {
                body: {
                  orderId: orderIdFromQuote,
                  customerName: billingName,
                  customerEmail: billingEmail,
                  totalAmount: totalAmount,
                  orderItems: existingQuotes.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_name: item.product_name || 'Unknown Product',
                    quantity: item.quantity,
                    unit: item.unit,
                    unit_price: parseFloat(item.unit_price) || 0,
                    total_price: parseFloat(item.total_price) || 0,
                    delivery_date: item.delivery_date,
                    delivery_street: item.delivery_street,
                    delivery_city: item.delivery_city,
                    delivery_state: item.delivery_state,
                    delivery_zip: item.delivery_zip,
                    delivery_name: item.delivery_name,
                    delivery_phone: item.delivery_phone,
                    delivery_email: item.delivery_email,
                    delivery_time_preference: item.delivery_time_preference,
                    delivery_instructions: item.delivery_instructions
                  }))
                }
              });

              console.log('=== EMAIL FUNCTION RESULT ===', {
                success: !emailResult.error,
                error: emailResult.error?.message || null,
                data: emailResult.data
              });

              if (emailResult.error) {
                console.error('Quote conversion email failed:', emailResult.error);
              } else {
                console.log('Quote conversion email sent successfully:', emailResult.data);
                emailSent = true;
              }
            } catch (emailError) {
              console.error('Failed to send quote conversion email:', emailError);
            }
          } else {
            console.log('=== NO QUOTE RECORDS FOUND - CANNOT SEND EMAIL ===', {
              orderId: verificationResult.orderId,
              checkError: checkError?.message,
              recordCount: existingQuotes?.length || 0
            });
          }

          // Now attempt database update (secondary priority)
          if (existingQuotes && existingQuotes.length > 0) {
            // Prepare update data for quote conversion
            const quoteUpdateData: any = {
              order_id: orderIdFromQuote,
              status: 'confirmed', // Quotes become confirmed orders
              stripe_payment_intent_id: paymentIntentId || null,
              stripe_session_id: verificationResult.sessionId || null,
              quote_converted: true, // Important: Mark as converted
              updated_at: new Date().toISOString()
            };
            
            console.log('=== STARTING DATABASE UPDATE ===', {
              updateData: quoteUpdateData,
              quotesToUpdate: existingQuotes.length
            });
            
            // Handle single vs multiple product scenarios with improved logic
            if (existingQuotes.length === 1) {
              // Single product: use exact match
              console.log('=== SINGLE PRODUCT QUOTE CONVERSION ===');
              const { data: singleQuoteData, error: singleError } = await supabase
                .from('orders')
                .update(quoteUpdateData)
                .eq('order_id', verificationResult.orderId)
                .eq('status', 'Quote')
                .select();
              
              quoteConversionData = singleQuoteData;
              quoteUpdateError = singleError;
              
              console.log('=== SINGLE QUOTE UPDATE RESULT ===', {
                success: !singleError,
                error: singleError?.message || null,
                updatedCount: singleQuoteData?.length || 0
              });
            } else {
              // Multiple products: update each record individually for better error handling
              console.log('=== MULTIPLE PRODUCT QUOTE CONVERSION ===');
              const updatePromises = existingQuotes.map(async (quote) => {
                console.log(`=== UPDATING QUOTE ${quote.id} ===`);
                const { data, error } = await supabase
                  .from('orders')
                  .update(quoteUpdateData)
                  .eq('id', quote.id)
                  .eq('status', 'Quote')
                  .select()
                  .single();
                
                console.log(`=== QUOTE ${quote.id} UPDATE RESULT ===`, {
                  success: !error,
                  error: error?.message || null,
                  data: data || null
                });
                
                return { data, error };
              });
              
              const results = await Promise.all(updatePromises);
              const successfulUpdates = results.filter(r => !r.error && r.data).map(r => r.data);
              const errors = results.filter(r => r.error).map(r => r.error);
              
              quoteConversionData = successfulUpdates;
              quoteUpdateError = errors.length > 0 ? errors[0] : null;
              
              console.log('=== MULTIPLE QUOTE UPDATE RESULTS ===', {
                successful: successfulUpdates.length,
                failed: errors.length,
                errors: errors.map(e => e.message),
                totalAttempted: existingQuotes.length
              });
            }
          }

          if (!quoteUpdateError && quoteConversionData && quoteConversionData.length > 0) {
            console.log('=== QUOTE TO ORDER CONVERSION SUCCESS ===', { 
              updatedRecords: quoteConversionData.length,
              newOrderId: orderIdFromQuote,
              emailSent: emailSent,
              convertedItems: quoteConversionData.map(item => ({ id: item.id, product_id: item.product_id }))
            });
            data = quoteConversionData;
            insertError = null;
            // Update the orderId for response
            verificationResult.orderId = orderIdFromQuote;
          } else {
            console.log('=== QUOTE CONVERSION FAILED (DB UPDATE) ===', { 
              error: quoteUpdateError?.message || 'No quote records updated',
              orderId: verificationResult.orderId,
              existingQuotesCount: existingQuotes?.length || 0,
              emailSent: emailSent // Email was still sent even if DB failed
            });
            
            // Even if DB update failed, consider this a partial success if email was sent
            if (emailSent && existingQuotes && existingQuotes.length > 0) {
              console.log('=== PARTIAL SUCCESS: EMAIL SENT DESPITE DB FAILURE ===');
              // Use original quote data as fallback
              data = existingQuotes;
              verificationResult.orderId = orderIdFromQuote;
            }
          }

        // Step 2: Check if cart records exist for this order
        } else if (verificationResult.orderId && verificationResult.orderId.startsWith('CART-')) {
          console.log('=== ATTEMPTING CART TO ORDER CONVERSION ===', { orderId: verificationResult.orderId });
          
          // Try to update existing cart records to order status
          const orderIdFromCart = verificationResult.orderId.replace('CART-', 'ORDER-');
          
          // Prepare update data with coupon information
          const updateData: any = {
            order_id: orderIdFromCart,
            status: paymentStatus,
            stripe_payment_intent_id: paymentIntentId || null,
            stripe_session_id: verificationResult.sessionId || null,
            updated_at: new Date().toISOString()
          };

          // Add coupon information if present
          if (backupData.couponInfo && backupData.couponInfo.applied) {
            updateData.coupon = backupData.couponInfo.code;
            console.log('=== APPLYING COUPON TO CART CONVERSION ===', { 
              couponCode: backupData.couponInfo.code,
              discount: backupData.couponInfo.discount 
            });
          }

          // Add deposit information if present
          if (backupData.depositOption === true) {
            const originalTotal = backupData.items.reduce((sum, i) => sum + i.total_price, 0);
            const totalCouponDiscount = backupData.couponInfo?.applied ? backupData.couponInfo.discount : 0;
            updateData.is_deposit_payment = true;
            updateData.deposit_amount = 199;
            updateData.balance_due = originalTotal - totalCouponDiscount - 199;
            
            console.log('=== APPLYING DEPOSIT TO CART CONVERSION ===', { 
              depositAmount: updateData.deposit_amount,
              balanceDue: updateData.balance_due,
              originalTotal: originalTotal
            });
          }
          
          const { data: cartUpdateData, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('order_id', verificationResult.orderId)
            .eq('status', 'cart')
            .select();

          if (updateError) {
            console.error('Cart update failed, falling back to insert:', updateError);
          } else if (cartUpdateData && cartUpdateData.length > 0) {
            console.log('=== CART TO ORDER CONVERSION SUCCESS ===', { 
              updatedRecords: cartUpdateData.length,
              newOrderId: orderIdFromCart 
            });
            data = cartUpdateData;
            insertError = null;
            // Update the orderId for response
            verificationResult.orderId = orderIdFromCart;
          } else {
            console.log('No cart records found, falling back to insert');
          }
        }

        // Step 2: If cart update failed or no cart existed, create new order records
        if (!data) {
          console.log('=== CREATING NEW ORDER RECORDS ===');
          
          // Calculate final prices with coupon discounts
          let totalCouponDiscount = 0;
          if (backupData.couponInfo && backupData.couponInfo.applied) {
            totalCouponDiscount = backupData.couponInfo.discount;
            console.log('=== APPLYING COUPON TO NEW ORDER ===', {
              couponCode: backupData.couponInfo.code,
              totalDiscount: totalCouponDiscount
            });
          }

          const orderRecords = backupData.items.map((item, index) => {
            // Calculate item-level discount proportionally
            const itemBasePrice = item.total_price;
            const itemDiscount = totalCouponDiscount > 0 ? 
              (itemBasePrice / backupData.items.reduce((sum, i) => sum + i.total_price, 0)) * totalCouponDiscount : 0;
            const finalItemPrice = itemBasePrice - itemDiscount;

            // Check if this is a deposit payment
            const isDepositPayment = backupData.depositOption === true;
            const depositAmount = isDepositPayment ? 199 : null;
            const originalTotal = backupData.items.reduce((sum, i) => sum + i.total_price, 0);
            const balanceDue = isDepositPayment ? (originalTotal - totalCouponDiscount - 199) : null;

            console.log('=== DEPOSIT PAYMENT CALCULATION ===', {
              isDepositPayment,
              depositAmount,
              originalTotal,
              totalCouponDiscount,
              balanceDue,
              finalItemPrice: isDepositPayment ? depositAmount / backupData.items.length : finalItemPrice
            });

            return {
              order_id: verificationResult.orderId,
              stripe_payment_intent_id: paymentIntentId || null,
              stripe_session_id: verificationResult.sessionId || null,
              product_id: item.product_id,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: isDepositPayment ? (depositAmount / backupData.items.length) : finalItemPrice, // Split deposit across items
              quantity: item.quantity,
              delivery_date: item.delivery_date,
              delivery_street: item.delivery_street,
              delivery_city: item.delivery_city,
              delivery_state: item.delivery_state,
              delivery_zip: item.delivery_zip,
              delivery_name: item.delivery_name,
              delivery_phone: item.delivery_phone,
              delivery_email: item.delivery_email,
              delivery_time_preference: item.delivery_time_preference,
              delivery_instructions: item.delivery_instructions,
              billing_name: billingName,
              billing_email: billingEmail,
              status: paymentStatus,
              coupon: backupData.couponInfo?.applied ? backupData.couponInfo.code : null,
              is_deposit_payment: isDepositPayment,
              deposit_amount: depositAmount,
              balance_due: balanceDue,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });

          const { data: insertData, error: newInsertError } = await supabase
            .from('orders')
            .insert(orderRecords)
            .select();

          data = insertData;
          insertError = newInsertError;
        }

        if (insertError) {
          throw new Error(`Database insertion failed: ${insertError.message}`);
        }
        
        const transformedOrders = (data || []).map(order => ({
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
          status: order.status,
          is_deposit_payment: order.is_deposit_payment,
          deposit_amount: order.deposit_amount,
          balance_due: order.balance_due
        }));
        
        const totalAmount = backupData.items.reduce((sum, item) => sum + item.total_price, 0);
        
        console.log('Order saved successfully:', { 
          orderId: verificationResult.orderId, 
          userType: user ? 'authenticated' : 'guest',
          customerEmail: billingEmail 
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            payment_status: paymentStatus,
            orderId: verificationResult.orderId,
            orders: transformedOrders,
            customer_email: billingEmail,
            customer_name: billingName,
            payment_intent_id: paymentIntentId,
            total_amount: totalAmount,
            timestamp: new Date().toISOString(),
            verification_method: verificationResult.verification_method,
            used_fallback: verificationResult.used_fallback,
            user_type: user ? 'authenticated' : 'guest'
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );

      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        verificationResult.error = 'Database operation failed';
      }
    }
    
    return new Response(
      JSON.stringify(verificationResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Payment verification failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
