// /metro-order-confirmed — the ONLY finalization page for a metro Stripe order.
// Deliberately fully isolated from the live /cart -> /checkout -> /payment-success ->
// verify-payment pipeline (orchestrator decision — that live path has a latent bug and its
// own client-side fallback-insert behavior; touching it risks regressions to real orders).
// create-metro-checkout's success_url points here with ?session_id=&order_id=, and this
// page calls the dedicated verify-metro-payment edge function (METRO_VERIFY_FUNCTION)
// directly — never verify-payment.
//
// NOTE (2026-09-28 hardening pass): `order_id` here is always the final ORDER-METRO- id
// (create-metro-checkout generates it once, up front — there's no more CART-METRO- staging id).
// No `orders` row exists until verify-metro-payment's call below succeeds; a page load for an
// unpaid session has zero DB side effects.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Loader2, AlertCircle, Package, MapPin, Calendar, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { METRO_VERIFY_FUNCTION, type MetroVerifyRequest, type MetroVerifyResponse, type MetroConfirmedOrder } from '@/metro/checkout/contract';
import { getMetroPendingCheckout, clearMetroPendingCheckout } from '@/metro/services/metroCheckoutService';
import { trackMetroPurchaseConversion } from '@/metro/services/metroPurchaseTracking';
import { METROS } from '@/metro/config';
import { MetroLayout } from '@/metro/components/layout/MetroLayout';
import { formatMoney } from '@/metro/components/shared/priceHelpers';

// Same support number every metro page shows (both DFW and Long Island configs use it) —
// used as the fallback contact when we can't resolve a full Metro object (e.g. an error
// before we know which metro the order belongs to).
const SUPPORT_PHONE = '(844) 624-0400';
const SUPPORT_PHONE_HREF = 'tel:+18446240400';
const SUPPORT_EMAIL = 'support@mygravelguy.com';
const SUPPORT_HOURS = 'Mon-Fri 8am-5pm, Sat 8am-1pm EST';

type PageState =
  | { status: 'verifying' }
  | { status: 'success'; order: MetroConfirmedOrder; alreadyProcessed: boolean }
  | { status: 'unpaid' }
  | { status: 'missing_params' }
  | { status: 'error' };

function formatDeliveryDate(dateStr: string): string {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatQuantity(order: MetroConfirmedOrder): string {
  if (order.unit === 'yd') return `${order.quantity} yd³`;
  return `${order.quantity} ${order.quantity === 1 ? 'ton' : 'tons'}`;
}

function NextStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-[#0F1115]">
          {n}
        </span>
        <h3 className="font-semibold text-[#0F1115]">{title}</h3>
      </div>
      <p className="text-sm text-[#0F1115]/70">{body}</p>
    </div>
  );
}

function ContactBlock({ phone, phoneHref }: { phone: string; phoneHref: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-black/10 bg-[#F2F1EA] p-6 text-center">
      <h2 className="text-sm font-semibold text-[#0F1115]">Questions about your delivery?</h2>
      <a href={phoneHref} className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-[#0F1115] hover:text-[#0F1115]/70">
        <Phone className="h-4 w-4" aria-hidden="true" />
        {phone}
      </a>
      <p className="mt-1 text-xs text-[#0F1115]/60">Call or text — {SUPPORT_HOURS}</p>
      <p className="mt-1 text-xs text-[#0F1115]/60">{SUPPORT_EMAIL}</p>
    </div>
  );
}

function VerifyingView() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0F1115]/40" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-extrabold text-[#0F1115]">Confirming your order…</h1>
      <p className="mt-2 text-sm text-[#0F1115]/70">This only takes a moment. Please don't close this page.</p>
    </div>
  );
}

function SuccessView({ order, phone, phoneHref }: { order: MetroConfirmedOrder; phone: string; phoneHref: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-black/10 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <CheckCircle2 className="h-7 w-7 text-[#0F1115]" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0F1115]">Order confirmed!</h1>
        <p className="mt-2 text-sm text-[#0F1115]/70">Order #{order.orderId}</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-[#0F1115]/70">
          Your card is authorized for {formatMoney(order.total)}. You will NOT be charged until your delivery is
          confirmed — the final charge only happens after that.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#0F1115]">
          <Package className="h-5 w-5" aria-hidden="true" />
          Order details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[#0F1115]/60">Material</h3>
            <p className="text-sm text-[#0F1115]">
              {order.variantName} — {formatQuantity(order)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0F1115]/60">Delivered total</h3>
            <p className="text-sm text-[#0F1115]">{formatMoney(order.total)}</p>
          </div>
          <div>
            <h3 className="flex items-center gap-1 text-sm font-semibold text-[#0F1115]/60">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Delivery date
            </h3>
            <p className="text-sm text-[#0F1115]">{formatDeliveryDate(order.deliveryDate)}</p>
          </div>
          <div>
            <h3 className="flex items-center gap-1 text-sm font-semibold text-[#0F1115]/60">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Delivery address
            </h3>
            <p className="text-sm text-[#0F1115]">
              {order.deliveryStreet}
              <br />
              {[order.deliveryCity, order.deliveryState, order.deliveryZip].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0F1115]">What happens next</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NextStep n={1} title="Order received" body="We've received your order and it's in our system." />
          <NextStep n={2} title="Delivery preparation" body="Our team prepares your materials for your selected date." />
          <NextStep n={3} title="Delivery confirmed & charged" body="Once your delivery is confirmed, your card is charged and your driver delivers your materials." />
        </div>
      </div>

      <ContactBlock phone={phone} phoneHref={phoneHref} />
    </div>
  );
}

function UnpaidView({ backHref, phone, phoneHref }: { backHref: string; phone: string; phoneHref: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-extrabold text-[#0F1115]">Payment not completed</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#0F1115]/70">
        It looks like your payment wasn't completed, so no charge or authorization was placed on your card. You can
        go back and try again.
      </p>
      <Button asChild className="mt-6 min-h-[44px] font-bold">
        <Link to={backHref}>Back to your order</Link>
      </Button>
      <div className="mt-6 text-sm text-[#0F1115]/60">
        Need help? Call or text <a href={phoneHref} className="font-semibold text-[#0F1115]">{phone}</a>
      </div>
    </div>
  );
}

function ErrorView({ orderId, phone, phoneHref }: { orderId: string | null; phone: string; phoneHref: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-extrabold text-[#0F1115]">We couldn't confirm your order automatically</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#0F1115]/70">
        Don't worry — if your payment went through, we've received it and our team is confirming your order now.
        We'll text or email you shortly with your delivery details. If you don't hear from us soon, or you'd like to
        check in sooner, contact us below.
      </p>
      {orderId && <p className="mt-2 text-xs text-[#0F1115]/50">Order reference: {orderId}</p>}
      <ContactBlock phone={phone} phoneHref={phoneHref} />
    </div>
  );
}

export default function MetroOrderConfirmedPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  // Read once (lazy init) — a display fallback + metro-slug source until/unless the
  // verify-metro-payment response arrives with authoritative data.
  const [pending] = useState(() => getMetroPendingCheckout());

  const [state, setState] = useState<PageState>(() => (sessionId && orderId ? { status: 'verifying' } : { status: 'missing_params' }));

  // Guards against React StrictMode's dev-mode double-invoke of effects — the ref persists
  // across the mount/cleanup/remount cycle (same component instance), so the second pass
  // sees invokedRef.current === true and returns before ever calling invoke() again.
  const invokedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !orderId) return;
    if (invokedRef.current) return;
    invokedRef.current = true;

    function applyResponse(response: MetroVerifyResponse) {
      if (response.success) {
        trackMetroPurchaseConversion(response.orderId, [
          {
            product_name: response.order.variantName,
            quantity: response.order.quantity,
            total_price: response.order.total,
            contact_name: response.order.customerName,
            contact_email: response.order.customerEmail,
            contact_phone: response.order.customerPhone,
            delivery_address_street: response.order.deliveryStreet,
            delivery_address_city: response.order.deliveryCity,
            delivery_address_state: response.order.deliveryState,
            delivery_address_zip: response.order.deliveryZip,
          },
        ]);
        clearMetroPendingCheckout();
        setState({ status: 'success', order: response.order, alreadyProcessed: response.alreadyProcessed });
      } else if (response.status === 'unpaid') {
        setState({ status: 'unpaid' });
      } else {
        // invalid / mismatch / not_found / error — never surface the raw error to the customer.
        setState({ status: 'error' });
      }
    }

    async function verify() {
      const body: MetroVerifyRequest = { sessionId, orderId };
      let data: MetroVerifyResponse | null;
      let error: unknown;
      try {
        ({ data, error } = await supabase.functions.invoke<MetroVerifyResponse>(METRO_VERIFY_FUNCTION, { body }));
      } catch {
        setState({ status: 'error' });
        return;
      }

      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const parsed = (await error.context.json()) as MetroVerifyResponse;
            applyResponse(parsed);
          } catch {
            setState({ status: 'error' });
          }
          return;
        }
        setState({ status: 'error' });
        return;
      }

      if (!data) {
        setState({ status: 'error' });
        return;
      }

      applyResponse(data);
    }

    verify();
  }, [sessionId, orderId]);

  const resolvedMetroSlug = state.status === 'success' ? state.order.metroSlug : pending?.serverQuote.metroSlug;
  const metro = resolvedMetroSlug ? METROS.find(m => m.slug === resolvedMetroSlug) : undefined;
  const phone = metro?.phone ?? SUPPORT_PHONE;
  const phoneHref = metro?.phoneHref ?? SUPPORT_PHONE_HREF;
  const backHref = pending ? `/${pending.serverQuote.metroSlug}` : '/';

  let content: JSX.Element;
  switch (state.status) {
    case 'verifying':
      content = <VerifyingView />;
      break;
    case 'success':
      content = <SuccessView order={state.order} phone={phone} phoneHref={phoneHref} />;
      break;
    case 'unpaid':
      content = <UnpaidView backHref={backHref} phone={phone} phoneHref={phoneHref} />;
      break;
    case 'missing_params':
    case 'error':
    default:
      content = <ErrorView orderId={orderId} phone={phone} phoneHref={phoneHref} />;
      break;
  }

  const helmet = (
    <Helmet>
      <title>Order Confirmation | MyGravelGuy</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  if (metro) {
    return (
      <MetroLayout metro={metro}>
        {helmet}
        {content}
      </MetroLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#0F1115]">
      {helmet}
      {content}
    </div>
  );
}
