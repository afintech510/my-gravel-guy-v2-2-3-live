
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientId } from "../shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'customer_confirmation' | 'internal_notification';
  orderData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Rate limiting check
  const clientId = getClientId(req);
  const rateLimitResult = await checkRateLimit('send-email', clientId);
  
  if (!rateLimitResult.allowed) {
    console.log('Rate limit exceeded for send-email:', clientId);
    return new Response(
      JSON.stringify({ 
        error: "Too many email requests. Please try again later.",
        success: false,
        rateLimitExceeded: true
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 429,
      }
    );
  }

  try {
    console.log('=== EMAIL FUNCTION START ===');
    
    const { to, subject, html, type, orderData }: EmailRequest = await req.json();
    
    console.log('Email type:', type);
    console.log('Recipient (to):', to);
    console.log('Subject:', subject);
    console.log('From address will be: team@mygravelguy.com');
    
    if (orderData) {
      console.log('Order customer email:', orderData.customer_email);
      console.log('Order ID:', orderData.order_id);
    }
    
    if (!to || !subject || !html) {
      throw new Error("Missing required email fields: to, subject, or html");
    }

    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error("Invalid email address format");
    }

    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Resend API key not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured. Please contact support.",
          success: false
        }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 500,
        }
      );
    }

    console.log(`Sending ${type} email to: ${to}`);

    const emailPayload = {
      from: "team@mygravelguy.com",
      to: [to],
      subject: subject,
      html: html,
    };
    
    console.log('Email payload prepared for Resend API');

    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", response.status, errorData);
      throw new Error(`Failed to send email: ${response.status} ${errorData}`);
    }

    const result = await response.json();
    console.log("Email sent successfully");
    console.log("Email ID:", result.id);
    console.log('=== EMAIL FUNCTION SUCCESS ===');

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: result.id,
        message: "Email sent successfully",
        emailType: type,
        recipient: to
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Email sending error:", error);
    console.log('=== EMAIL FUNCTION ERROR ===');
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        success: false
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  }
});
