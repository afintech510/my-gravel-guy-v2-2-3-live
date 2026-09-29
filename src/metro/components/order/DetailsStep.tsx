import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatMoney } from '../shared/priceHelpers';
import { METRO_INPUT_CAPS } from '../../checkout/contract';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

export function DetailsStep({ order }: { order: UseMetroOrderReturn }) {
  const { contact, updateContact, quoteResult, submit, submitting, submitError, checkoutEnabled, priceChangeQuote, confirmPriceChangeAndContinue } = order;

  // A PRICE_CHANGED response from create-metro-checkout — never auto-redirects; the
  // customer sees the fresher price and must explicitly confirm before we try again.
  if (checkoutEnabled && priceChangeQuote) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Our price just updated</p>
          <p className="mt-1 text-sm text-amber-800">
            The delivered price for this order is now {formatMoney(priceChangeQuote.total)} (was {quoteResult ? formatMoney(quoteResult.total) : '—'}).
            Please confirm to continue to payment.
          </p>
        </div>
        {submitError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {submitError}
          </p>
        )}
        <Button
          type="button"
          size="lg"
          className="w-full font-bold"
          disabled={submitting}
          onClick={() => confirmPriceChangeAndContinue()}
        >
          {submitting ? 'Sending…' : `Confirm ${formatMoney(priceChangeQuote.total)} & continue to payment`}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
    >
      <div>
        <Label htmlFor="metro-street">Delivery address</Label>
        <Input
          id="metro-street"
          value={contact.street}
          onChange={e => updateContact({ street: e.target.value })}
          placeholder="123 Main St"
          maxLength={METRO_INPUT_CAPS.street}
          required
        />
      </div>
      <div>
        <Label htmlFor="metro-drop-notes">Drop-spot notes (optional)</Label>
        <Textarea
          id="metro-drop-notes"
          value={contact.dropNotes}
          onChange={e => updateContact({ dropNotes: e.target.value })}
          placeholder="Gate code, where to drop it, etc."
          className="min-h-[80px]"
          maxLength={METRO_INPUT_CAPS.dropNotes}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="metro-name">Full name</Label>
          <Input
            id="metro-name"
            value={contact.name}
            onChange={e => updateContact({ name: e.target.value })}
            maxLength={METRO_INPUT_CAPS.name}
            required
          />
        </div>
        <div>
          <Label htmlFor="metro-mobile">Mobile number</Label>
          <Input
            id="metro-mobile"
            type="tel"
            value={contact.mobile}
            onChange={e => updateContact({ mobile: e.target.value })}
            placeholder="(555) 123-4567"
            maxLength={METRO_INPUT_CAPS.mobile}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="metro-email">Email</Label>
        <Input
          id="metro-email"
          type="email"
          value={contact.email}
          onChange={e => updateContact({ email: e.target.value })}
          placeholder="you@example.com"
          maxLength={METRO_INPUT_CAPS.email}
          required
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-[#F2F1EA] p-3">
        <Checkbox
          id="metro-sms-consent"
          checked={contact.smsConsent}
          onCheckedChange={checked => updateContact({ smsConsent: checked === true })}
        />
        <Label htmlFor="metro-sms-consent" className="text-xs font-normal leading-snug text-[#0F1115]/70">
          I agree to receive SMS and email updates about my delivery (order confirmation, delivery window, driver
          coordination). Message & data rates may apply. Reply STOP to opt out.
        </Label>
      </div>

      {checkoutEnabled && (
        <p className="text-xs text-[#0F1115]/60">
          We'll place an authorization hold on your card for the order amount. You will NOT be charged until your
          delivery is confirmed — the final charge only happens after that.
        </p>
      )}

      {submitError && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full font-bold" disabled={submitting}>
        {submitting
          ? 'Sending…'
          : quoteResult
            ? checkoutEnabled
              ? `Continue to secure payment — ${formatMoney(quoteResult.total)}`
              : `Request my delivery — ${formatMoney(quoteResult.total)}`
            : checkoutEnabled
              ? 'Continue to secure payment'
              : 'Request my delivery'}
      </Button>
    </form>
  );
}
