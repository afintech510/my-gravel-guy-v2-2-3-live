import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function verifyToken(email: string, secret: string, token: string): boolean {
  const expected = btoa(`${email}:${secret}`).replace(/[+/=]/g, (c) =>
    c === "+" ? "-" : c === "/" ? "_" : ""
  );
  return token === expected;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email || !token) {
      return new Response(renderPage("Missing Parameters", "Invalid unsubscribe link. Please use the link from your email."), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET") || serviceRoleKey.slice(0, 32);

    // Verify the token
    if (!verifyToken(email, unsubscribeSecret, token)) {
      return new Response(renderPage("Invalid Link", "This unsubscribe link is invalid or has expired."), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Mark all records for this email as unsubscribed
    const { error } = await supabase
      .from("abandoned_cart_emails")
      .update({ unsubscribed: true })
      .eq("customer_email", email);

    if (error) {
      console.error("Unsubscribe error:", error);
      return new Response(renderPage("Error", "Something went wrong. Please try again later."), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Also insert a sentinel row so future carts from this email are skipped
    // even if there are no existing records yet
    await supabase.from("abandoned_cart_emails").upsert(
      {
        cart_order_id: `unsub-${email}`,
        customer_email: email,
        sequence_number: 1,
        cart_created_at: new Date().toISOString(),
        cart_items_json: [],
        unsubscribed: true,
      },
      { onConflict: "cart_order_id,sequence_number" }
    );

    console.log(`Unsubscribed: ${email}`);

    return new Response(
      renderPage(
        "Unsubscribed",
        "You have been unsubscribed from cart reminder emails. You will no longer receive abandoned cart notifications from MyGravelGuy."
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("Unsubscribe handler error:", error);
    return new Response(renderPage("Error", "Something went wrong. Please try again later."), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title} — MyGravelGuy</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:500px;margin:60px auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:30px 20px;text-align:center;">
      <h1 style="color:#fff;font-size:24px;margin:0;">&#x1FAA8; My Gravel Guy</h1>
    </div>
    <div style="padding:40px 30px;text-align:center;">
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;">${title}</h2>
      <p style="color:#6b7280;font-size:16px;line-height:1.6;margin:0 0 24px;">${message}</p>
      <a href="https://mygravelguy.com" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:14px;">
        Visit MyGravelGuy
      </a>
    </div>
    <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; 2024 My Gravel Guy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
