
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse Twilio webhook data
    const formData = await req.formData()
    const data: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      data[key] = value.toString()
    }

    const {
      MessageSid,
      From,
      To,
      Body,
      NumMedia,
      ...mediaData
    } = data

    // Extract media URLs if any
    const mediaUrls: string[] = []
    const numMedia = parseInt(NumMedia || '0')
    
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = data[`MediaUrl${i}`]
      if (mediaUrl) {
        mediaUrls.push(mediaUrl)
      }
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Store message in database
    const { data: messageData, error } = await supabase
      .from('messages')
      .insert({
        phone_number: From,
        body: Body || '',
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        direction: 'inbound',
        status: 'received',
        twilio_sid: MessageSid,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing message:', error)
      return new Response('Error storing message', { status: 500 })
    }

    console.log('Stored incoming message:', messageData.id)

    // Return TwiML response (empty for now)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: {
          'Content-Type': 'text/xml',
          ...corsHeaders
        }
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
