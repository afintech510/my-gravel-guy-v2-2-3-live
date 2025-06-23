
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  phoneNumber: string;
  message: string;
  mediaUrls?: string[];
  orderId?: string;
  type?: 'test' | 'order_update' | 'delivery_notification' | 'custom';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const { phoneNumber, message, mediaUrls, orderId, type = 'custom' }: SMSRequest = await req.json()

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneNumber || !phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate message content
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message content is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Twilio credentials from Supabase secrets
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Format phone number to ensure it has country code
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone
    }
    formattedPhone = '+' + formattedPhone

    // Send SMS/MMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    
    const body = new URLSearchParams({
      From: twilioPhoneNumber,
      To: formattedPhone,
      Body: message
    })

    // Add media URLs if provided
    if (mediaUrls && mediaUrls.length > 0) {
      mediaUrls.forEach(url => {
        body.append('MediaUrl', url)
      })
    }

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Twilio API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('SMS sent successfully:', data.sid, 'Order ID:', orderId, 'Type:', type)

    // Store message in database if we have auth context
    if (authHeader) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: authHeader }
            }
          }
        )

        // Get user info
        const { data: { user } } = await supabase.auth.getUser()

        await supabase
          .from('messages')
          .insert({
            phone_number: formattedPhone,
            body: message,
            media_urls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : null,
            direction: 'outbound',
            status: 'sent',
            twilio_sid: data.sid,
            user_email: user?.email,
            order_id: orderId,
            is_read: true // Outbound messages are always "read"
          })

      } catch (dbError) {
        console.error('Error storing message in database:', dbError)
        // Don't fail the API call if database storage fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageSid: data.sid,
        orderId: orderId,
        type: type 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
