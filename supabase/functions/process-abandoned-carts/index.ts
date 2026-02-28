import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Email Templates ───

const SUPABASE_FUNCTIONS_URL = "https://losrkjvrcambvgijfism.supabase.co/functions/v1";

interface CartItem {
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_address?: { street: string; city: string; state: string; zip: string } | null;
  delivery_date?: string | null;
}

function buildUnsubscribeUrl(email: string, secret: string): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  // Simple token: base64 of email + secret (edge function will verify)
  const token = btoa(`${email}:${secret}`).replace(/[+/=]/g, (c) =>
    c === "+" ? "-" : c === "/" ? "_" : ""
  );
  return `${SUPABASE_FUNCTIONS_URL}/unsubscribe-cart-emails?email=${encodeURIComponent(email)}&token=${token}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Not specified";
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function renderCartItems(items: CartItem[]): string {
  return items
    .map(
      (item) => `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
      <h3 style="margin:0 0 8px;color:#1f2937;font-size:16px;">${item.product_name}</h3>
      <p style="margin:4px 0;color:#6b7280;font-size:14px;"><strong>Quantity:</strong> ${item.quantity} tons</p>
      <p style="margin:4px 0;color:#6b7280;font-size:14px;"><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
      ${item.delivery_address ? `<p style="margin:4px 0;color:#6b7280;font-size:14px;"><strong>Deliver to:</strong> ${item.delivery_address.street}, ${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}</p>` : ""}
      ${item.delivery_date ? `<p style="margin:4px 0;color:#6b7280;font-size:14px;"><strong>Date:</strong> ${formatDate(item.delivery_date)}</p>` : ""}
    </div>`
    )
    .join("");
}

function buildEmail(
  seq: number,
  name: string,
  items: CartItem[],
  total: number,
  unsubUrl: string
): { subject: string; html: string } {
  const firstName = name.split(" ")[0] || "there";
  const productNames = items.map((i) => i.product_name).join(", ");

  const subjects: Record<number, string> = {
    1: "You left something in your cart!",
    2: `Still thinking about your ${productNames} delivery?`,
    3: `Don't miss out on your ${productNames} delivery`,
  };

  const headings: Record<number, string> = {
    1: "Your cart is waiting for you",
    2: "Great choice — here's why",
    3: "Your saved order is still available",
  };

  const intros: Record<number, string> = {
    1: `Hi ${firstName}, it looks like you started an order but didn't finish checking out. Your cart is saved and ready when you are.`,
    2: `Hi ${firstName}, we noticed you're still thinking about your order. Here's why customers love ordering from MyGravelGuy:`,
    3: `Hi ${firstName}, your saved order is still available, but pricing and delivery availability can change. Don't wait too long!`,
  };

  const extras: Record<number, string> = {
    1: "",
    2: `
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:4px 0;color:#065f46;font-size:14px;">&#x2705; <strong>Free delivery</strong> on all orders</p>
        <p style="margin:4px 0;color:#065f46;font-size:14px;">&#x2705; <strong>Authorization only</strong> — your card isn't charged until we confirm</p>
        <p style="margin:4px 0;color:#065f46;font-size:14px;">&#x2705; <strong>Volume discounts</strong> — the more you order, the less you pay per ton</p>
      </div>`,
    3: `
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          &#x23F3; <strong>Heads up:</strong> Prices are based on current market rates and may change. Delivery slots also fill up quickly in peak season.
        </p>
      </div>`,
  };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:30px 20px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;font-size:28px;margin:0 0 8px;">&#x1FAA8; My Gravel Guy</h1>
    <p style="color:#d1fae5;font-size:16px;margin:0;">${headings[seq]}</p>
  </div>

  <div style="padding:30px 20px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">${intros[seq]}</p>

    ${renderCartItems(items)}

    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin:20px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#065f46;font-size:18px;font-weight:bold;">Total</span>
        <span style="color:#065f46;font-size:18px;font-weight:bold;">$${total.toFixed(2)}</span>
      </div>
      <p style="margin:4px 0 0;color:#059669;font-size:13px;">Free delivery included</p>
    </div>

    ${extras[seq]}

    <div style="text-align:center;margin:30px 0;">
      <a href="https://mygravelguy.com/cart" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:bold;font-size:16px;">
        ${seq === 3 ? "Complete Your Order Now" : "Return to My Cart"}
      </a>
    </div>
  </div>

  <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
    <p style="color:#9ca3af;font-size:12px;margin:5px 0;">&copy; 2024 My Gravel Guy. All rights reserved.</p>
    <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;">
      <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe from cart reminders</a>
    </p>
  </div>
</div>
</body>
</html>`;

  return { subject: subjects[seq], html };
}

// ─── Main handler ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET") || serviceRoleKey.slice(0, 32);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Find all cart orders older than 1 hour with a customer email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: cartOrders, error: cartErr } = await supabase
      .from("orders")
      .select("order_id, delivery_email, delivery_name, product_id, quantity, unit_price, total_price, delivery_street, delivery_city, delivery_state, delivery_zip, delivery_date, created_at")
      .eq("status", "cart")
      .not("delivery_email", "is", null)
      .lt("created_at", oneHourAgo);

    if (cartErr) {
      console.error("Error querying cart orders:", cartErr);
      return new Response(JSON.stringify({ error: cartErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!cartOrders || cartOrders.length === 0) {
      return new Response(JSON.stringify({ message: "No eligible carts found", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Group by order_id
    const cartMap = new Map<string, typeof cartOrders>();
    for (const row of cartOrders) {
      const existing = cartMap.get(row.order_id) || [];
      existing.push(row);
      cartMap.set(row.order_id, existing);
    }

    // 3. Get already-sent emails and unsubscribed emails
    const orderIds = Array.from(cartMap.keys());
    const { data: sentRecords } = await supabase
      .from("abandoned_cart_emails")
      .select("cart_order_id, sequence_number, customer_email, unsubscribed")
      .in("cart_order_id", orderIds);

    const sentMap = new Map<string, Set<number>>();
    const unsubscribedEmails = new Set<string>();
    for (const rec of sentRecords || []) {
      if (rec.unsubscribed) unsubscribedEmails.add(rec.customer_email);
      const key = rec.cart_order_id;
      if (!sentMap.has(key)) sentMap.set(key, new Set());
      sentMap.get(key)!.add(rec.sequence_number);
    }

    // Also check for globally unsubscribed emails
    const allEmails = Array.from(new Set(cartOrders.map((r) => r.delivery_email).filter(Boolean)));
    if (allEmails.length > 0) {
      const { data: unsubRecords } = await supabase
        .from("abandoned_cart_emails")
        .select("customer_email")
        .in("customer_email", allEmails)
        .eq("unsubscribed", true);
      for (const rec of unsubRecords || []) {
        unsubscribedEmails.add(rec.customer_email);
      }
    }

    // 4. Process each cart
    let emailsSent = 0;
    const now = Date.now();

    for (const [orderId, rows] of cartMap) {
      const email = rows[0].delivery_email;
      const name = rows[0].delivery_name || "Customer";
      if (!email || unsubscribedEmails.has(email)) continue;

      const createdAt = new Date(rows[0].created_at).getTime();
      const ageMs = now - createdAt;
      const ageHours = ageMs / (1000 * 60 * 60);

      const alreadySent = sentMap.get(orderId) || new Set();

      // Determine which sequences are eligible
      const eligible: number[] = [];
      if (ageHours >= 1 && !alreadySent.has(1)) eligible.push(1);
      if (ageHours >= 24 && !alreadySent.has(2)) eligible.push(2);
      if (ageHours >= 72 && !alreadySent.has(3)) eligible.push(3);

      if (eligible.length === 0) continue;

      // Build cart items snapshot
      const items: CartItem[] = rows.map((r) => ({
        product_name: r.product_id, // Will show product ID; product name not in orders table
        quantity: r.quantity || 1,
        total_price: r.total_price || 0,
        delivery_address:
          r.delivery_street && r.delivery_city
            ? { street: r.delivery_street, city: r.delivery_city, state: r.delivery_state || "", zip: r.delivery_zip || "" }
            : null,
        delivery_date: r.delivery_date,
      }));
      const total = items.reduce((s, i) => s + i.total_price, 0);

      // Try to resolve product names
      const productIds = rows.map((r) => r.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        if (products) {
          const nameMap = new Map(products.map((p: any) => [p.id.toString(), p.name]));
          for (const item of items) {
            const resolved = nameMap.get(item.product_name);
            if (resolved) item.product_name = resolved;
          }
        }
      }

      for (const seq of eligible) {
        const unsubUrl = buildUnsubscribeUrl(email, unsubscribeSecret);
        const { subject, html } = buildEmail(seq, name, items, total, unsubUrl);

        // Send via Resend API
        if (resendApiKey) {
          try {
            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "MyGravelGuy <team@mygravelguy.com>",
                to: email,
                subject,
                html,
                reply_to: "operations@mygravelguy.com",
              }),
            });
            const resendData = await resendRes.json();
            console.log(`Sent seq ${seq} to ${email} for ${orderId}:`, resendData);
          } catch (sendErr) {
            console.error(`Failed to send seq ${seq} to ${email}:`, sendErr);
            continue;
          }
        }

        // Record in tracking table
        const { error: insertErr } = await supabase.from("abandoned_cart_emails").upsert(
          {
            cart_order_id: orderId,
            customer_email: email,
            customer_name: name,
            sequence_number: seq,
            cart_created_at: rows[0].created_at,
            cart_items_json: items,
          },
          { onConflict: "cart_order_id,sequence_number" }
        );
        if (insertErr) {
          console.error(`Failed to record seq ${seq} for ${orderId}:`, insertErr);
        }

        emailsSent++;
      }
    }

    console.log(`Abandoned cart processing complete: ${emailsSent} emails sent`);
    return new Response(
      JSON.stringify({ message: "Processing complete", emailsSent, cartsChecked: cartMap.size }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Abandoned cart processing error:", error);
    return new Response(JSON.stringify({ error: "Processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
