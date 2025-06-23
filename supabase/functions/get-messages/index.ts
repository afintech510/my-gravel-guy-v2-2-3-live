
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Missing authorization', { status: 401 })
    }

    // Initialize Supabase client with user context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const url = new URL(req.url)
    const phoneNumber = url.searchParams.get('phone_number')

    if (phoneNumber) {
      // Get specific conversation
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: true })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      // Get all conversations (grouped by phone number)
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Group messages by phone number to create conversations
      const conversationsMap = new Map()

      messages.forEach(message => {
        const phone = message.phone_number
        if (!conversationsMap.has(phone)) {
          conversationsMap.set(phone, {
            phoneNumber: phone,
            customerName: message.customer_name,
            lastMessage: message.body || 'Media message',
            lastMessageTime: message.created_at,
            unreadCount: 0,
            messages: []
          })
        }

        const conversation = conversationsMap.get(phone)
        conversation.messages.push(message)
        
        if (!message.is_read && message.direction === 'inbound') {
          conversation.unreadCount++
        }

        // Update last message if this message is newer
        if (new Date(message.created_at) > new Date(conversation.lastMessageTime)) {
          conversation.lastMessage = message.body || 'Media message'
          conversation.lastMessageTime = message.created_at
        }
      })

      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())

      return new Response(JSON.stringify({ conversations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error fetching messages:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
