import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatMoney } from '../shared/priceHelpers';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

export function DetailsStep({ order }: { order: UseMetroOrderReturn }) {
  const { contact, updateContact, quoteResult, submit, submitting, submitError } = order;

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
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="metro-name">Full name</Label>
          <Input id="metro-name" value={contact.name} onChange={e => updateContact({ name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="metro-mobile">Mobile number</Label>
          <Input
            id="metro-mobile"
            type="tel"
            value={contact.mobile}
            onChange={e => updateContact({ mobile: e.target.value })}
            placeholder="(555) 123-4567"
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

      {submitError && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full font-bold" disabled={submitting}>
        {submitting ? 'Sending…' : quoteResult ? `Request my delivery — ${formatMoney(quoteResult.total)}` : 'Request my delivery'}
      </Button>
    </form>
  );
}
