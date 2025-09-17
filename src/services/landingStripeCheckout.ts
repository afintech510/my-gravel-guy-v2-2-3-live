import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/services/productTypes';
import { storeCheckoutBackup, createEnhancedBackup } from '@/utils/paymentUtils';
import { LandingCheckoutFormData } from '@/components/landing/LandingCheckoutForm';

export interface LandingCheckoutData {
  selectedMaterial: Product;
  quantity: number;
  paymentPath: 'deposit' | 'buy_now';
  priceData: {
    normalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    depositEstimate: number;
    cashPriceEstimate: number;
    cardPriceEstimate: number;
  };
  discountUnlocked: boolean;
  formData: LandingCheckoutFormData;
}

export class LandingStripeCheckout {
  static async processCheckout(checkoutData: LandingCheckoutData): Promise<string> {
    const { selectedMaterial, quantity, paymentPath, priceData, discountUnlocked, formData } = checkoutData;

    // Generate order ID
    const orderId = `LANDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine the price based on payment path and discount status
    let finalPrice: number;
    if (paymentPath === 'deposit') {
      finalPrice = 199; // Fixed deposit amount
    } else {
      finalPrice = discountUnlocked ? priceData.discountedPrice : priceData.normalPrice;
    }

    // Create cart-like item structure for Stripe
    const stripeItem = {
      id: selectedMaterial.id,
      name: selectedMaterial.name,
      description: paymentPath === 'deposit' 
        ? `Refundable deposit for ${quantity} tons of ${selectedMaterial.name}`
        : `${quantity} tons of ${selectedMaterial.name}`,
      price: paymentPath === 'deposit' ? 199 : Math.round((finalPrice / quantity) * 100) / 100,
      quantity: paymentPath === 'deposit' ? 1 : quantity,
      image: selectedMaterial.images?.[0] || '',
      metadata: {
        contactName: formData.name,
        contactPhone: formData.phone,
        contactEmail: formData.email,
        deliveryAddress: JSON.stringify({
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        }),
        deliveryDate: formData.deliveryDate.toISOString(),
        deliveryTimePreference: formData.deliveryTimePreference,
        deliveryInstructions: formData.deliveryInstructions || '',
        paymentPath: paymentPath,
        originalPrice: priceData.normalPrice,
        discountApplied: discountUnlocked,
        discountAmount: discountUnlocked ? priceData.discountAmount : 0,
        materialQuantity: quantity,
        landingPageOrder: 'true'
      }
    };

    // Create cart items for backup (using cart structure)
    const cartItems = [{
      id: selectedMaterial.id,
      name: selectedMaterial.name,
      category: selectedMaterial.category,
      price: paymentPath === 'deposit' ? 199 : Math.round((finalPrice / quantity) * 100) / 100,
      tons: paymentPath === 'deposit' ? 1 : quantity,
      quantity: paymentPath === 'deposit' ? 1 : quantity,
      image: selectedMaterial.images?.[0] || '',
      short_description: selectedMaterial.short_description,
      deliveryDate: formData.deliveryDate,
      deliveryAddress: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      },
      contactInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      },
      deliveryTimePreference: formData.deliveryTimePreference,
      deliveryInstructions: formData.deliveryInstructions,
      // Additional landing page specific data
      paymentPath,
      originalQuantity: quantity,
      materialId: selectedMaterial.id
    }];

    // Create and store backup
    const orderBackup = createEnhancedBackup(orderId, cartItems, {
      email: formData.email,
      name: formData.name
    });
    
    storeCheckoutBackup(orderBackup);

    // Send notification email about the landing page checkout
    await this.sendLandingCheckoutNotification(orderId, checkoutData);

    try {
      // Get current session (optional for guest checkout)
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call create-payment edge function
      const requestOptions: any = {
        body: JSON.stringify({ 
          items: [stripeItem],
          orderId: orderId,
          source: 'landing_page'
        })
      };
      
      if (session?.access_token) {
        requestOptions.headers = {
          Authorization: `Bearer ${session.access_token}`
        };
      }
      
      const { data, error } = await supabase.functions.invoke('create-payment', requestOptions);
      
      if (error) {
        throw new Error(`Payment service error: ${error.message}`);
      }
      
      if (!data || !data.url) {
        throw new Error('Invalid response from payment service - no checkout URL received');
      }
      
      console.log('Landing page Stripe checkout created:', { 
        orderId, 
        paymentPath,
        finalPrice,
        checkoutUrl: data.url 
      });
      
      return data.url;
      
    } catch (error) {
      console.error('Landing page Stripe checkout error:', error);
      // Clear the checkout progress flag on error
      localStorage.removeItem('checkout-in-progress');
      throw error;
    }
  }

  private static async sendLandingCheckoutNotification(orderId: string, checkoutData: LandingCheckoutData) {
    try {
      const { selectedMaterial, quantity, paymentPath, priceData, discountUnlocked, formData } = checkoutData;
      
      const finalPrice = paymentPath === 'deposit' ? 199 : 
        (discountUnlocked ? priceData.discountedPrice : priceData.normalPrice);

      const emailData = {
        order_id: orderId,
        source: 'landing_page',
        payment_path: paymentPath,
        material_name: selectedMaterial.name,
        quantity: quantity,
        final_price: finalPrice,
        original_price: priceData.normalPrice,
        discount_applied: discountUnlocked,
        discount_amount: discountUnlocked ? priceData.discountAmount : 0,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        delivery_address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },
        delivery_date: formData.deliveryDate.toISOString(),
        delivery_time_preference: formData.deliveryTimePreference,
        delivery_instructions: formData.deliveryInstructions
      };

      await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: `Landing Page Checkout - ${paymentPath === 'deposit' ? 'Deposit' : 'Buy Now'} - ${orderId}`,
          html: this.generateLandingCheckoutEmail(emailData),
          type: 'internal_notification',
          orderData: emailData
        }
      });
    } catch (error) {
      console.error('Failed to send landing page checkout notification:', error);
      // Don't throw - this shouldn't block the checkout process
    }
  }

  private static generateLandingCheckoutEmail(data: any): string {
    const formatDeliveryTime = (preference: string) => {
      switch (preference) {
        case 'anytime': return 'Anytime (7am-5pm)';
        case 'morning': return 'Morning (7am-12pm)';
        case 'afternoon': return 'Afternoon (12pm-5pm)';
        default: return 'Not specified';
      }
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Landing Page Checkout</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14FF6A; color: black; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎯 Landing Page Checkout</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.8;">
            ${data.payment_path === 'deposit' ? 'Deposit Reserved' : 'Full Purchase'} - Proceeding to Stripe
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #059669; margin-top: 0;">Order Details</h2>
          <p><strong>Order ID:</strong> ${data.order_id}</p>
          <p><strong>Source:</strong> Landing Page</p>
          <p><strong>Payment Path:</strong> ${data.payment_path === 'deposit' ? 'Refundable Deposit ($199)' : 'Buy It Now'}</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #14FF6A;">
            <h3 style="margin-top: 0; color: #059669;">Material Information</h3>
            <p><strong>Material:</strong> ${data.material_name}</p>
            <p><strong>Quantity:</strong> ${data.quantity} tons</p>
            <p><strong>Final Price:</strong> $${data.final_price.toLocaleString()}</p>
            ${data.discount_applied ? `
              <div style="background: #d1fae5; padding: 10px; border-radius: 6px; margin: 10px 0;">
                <p style="margin: 0; color: #065f46;">
                  <strong>💰 Discount Applied:</strong> -$${data.discount_amount.toFixed(0)}<br>
                  <strong>Original Price:</strong> $${data.original_price.toLocaleString()}
                </p>
              </div>
            ` : ''}
          </div>

          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1e40af;">Customer Information</h3>
            <p><strong>Name:</strong> ${data.customer_name}</p>
            <p><strong>Email:</strong> ${data.customer_email}</p>
            <p><strong>Phone:</strong> ${data.customer_phone}</p>
          </div>

          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">Delivery Information</h3>
            <p><strong>Address:</strong><br>
              ${data.delivery_address.street}<br>
              ${data.delivery_address.city}, ${data.delivery_address.state} ${data.delivery_address.zip}
            </p>
            <p><strong>Date:</strong> ${formatDate(data.delivery_date)}</p>
            <p><strong>Time:</strong> ${formatDeliveryTime(data.delivery_time_preference)}</p>
            ${data.delivery_instructions ? `
              <p><strong>Instructions:</strong> ${data.delivery_instructions}</p>
            ` : ''}
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">🚀 Next Steps</h4>
            <p style="margin: 0; color: #78350f;">
              ${data.payment_path === 'deposit' 
                ? 'Customer is paying $199 deposit. Follow up with material photos and final pricing within 24 hours.'
                : 'Customer is paying full amount. Coordinate with suppliers and send material photos for approval.'
              }
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}