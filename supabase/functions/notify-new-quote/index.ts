
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuoteAlert {
  orderId: string;
  customerName: string;
  customerPhone: string;
  material: string;
  estimatedTons?: number;
  zipCode: string;
  sourcePage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, customerName, customerPhone, material, estimatedTons, zipCode, sourcePage }: QuoteAlert = await req.json()

    if (!orderId || !customerName) {
      return new Response(
        JSON.stringify({ error: 'orderId and customerName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: { sms: string[]; slack: string | null } = { sms: [], slack: null }

    // --- SMS Alerts ---
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    // Comma-separated list of phone numbers to alert
    const alertPhones = Deno.env.get('QUOTE_ALERT_PHONES')

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber && alertPhones) {
      const phones = alertPhones.split(',').map(p => p.trim()).filter(Boolean)

      const tonsText = estimatedTons ? `${estimatedTons}T` : 'TBD'
      const smsBody =
        `NEW QUOTE: ${customerName} wants ${material || 'materials'} (${tonsText}) ` +
        `delivered to ${zipCode}. ` +
        `Call: ${customerPhone}. ` +
        `Ref: ${orderId}${sourcePage ? ` (from ${sourcePage})` : ''}`

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`

      for (const phone of phones) {
        try {
          let formatted = phone.replace(/\D/g, '')
          if (!formatted.startsWith('1') && formatted.length === 10) {
            formatted = '1' + formatted
          }
          formatted = '+' + formatted

          const res = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            },
            body: new URLSearchParams({
              From: twilioPhoneNumber,
              To: formatted,
              Body: smsBody,
            }),
          })
          const data = await res.json()
          console.log(`SMS alert sent to ${formatted}:`, data.sid || data)
          results.sms.push(formatted)
        } catch (smsErr) {
          console.error(`SMS alert failed for ${phone}:`, smsErr)
        }
      }
    } else {
      console.log('SMS alerts skipped: QUOTE_ALERT_PHONES not configured')
    }

    // --- Slack Webhook ---
    const slackWebhookUrl = Deno.env.get('SLACK_QUOTE_WEBHOOK_URL')

    if (slackWebhookUrl) {
      try {
        const tonsText = estimatedTons ? `${estimatedTons} tons` : 'TBD'
        const slackPayload = {
          text: `🪨 New Quote Request`,
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "🪨 New Quote Request", emoji: true }
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Customer:*\n${customerName}` },
                { type: "mrkdwn", text: `*Phone:*\n${customerPhone}` },
                { type: "mrkdwn", text: `*Material:*\n${material || 'Not specified'}` },
                { type: "mrkdwn", text: `*Amount:*\n${tonsText}` },
                { type: "mrkdwn", text: `*ZIP:*\n${zipCode}` },
                { type: "mrkdwn", text: `*Ref:*\n${orderId}` },
              ]
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `Source: ${sourcePage || 'Direct'}` }
              ]
            }
          ]
        }

        const slackRes = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload),
        })
        results.slack = slackRes.ok ? 'sent' : 'failed'
        console.log('Slack alert:', results.slack)
      } catch (slackErr) {
        console.error('Slack alert failed:', slackErr)
        results.slack = 'error'
      }
    } else {
      console.log('Slack alerts skipped: SLACK_QUOTE_WEBHOOK_URL not configured')
    }

    return new Response(
      JSON.stringify({ success: true, alerts: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in notify-new-quote:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
