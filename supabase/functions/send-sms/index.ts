import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { checkRateLimit, getClientId } from "../shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting check
  const clientId = getClientId(req);
  const rateLimitResult = await checkRateLimit('send-sms', clientId);
  
  if (!rateLimitResult.allowed) {
    console.log('Rate limit exceeded for send-sms:', clientId);
    return new Response(
      JSON.stringify({ 
        error: "Too many SMS requests. Please try again later.",
        rateLimitExceeded: true
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  try {
    const { phoneNumber } = await req.json()

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneNumber || !phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            'Content-Type': 'application/json' 
          } 
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
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Format phone number to ensure it has country code
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone
    }
    formattedPhone = '+' + formattedPhone

    // Send SMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    
    const body = new URLSearchParams({
      From: twilioPhoneNumber,
      To: formattedPhone,
      Body: 'Test message from My Gravel Guy SMS system. This confirms SMS delivery is working correctly for your order notifications.'
    })

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
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    const data = await response.json()
    console.log('SMS sent successfully:', data.sid)

    return new Response(
      JSON.stringify({ success: true, messageSid: data.sid }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
