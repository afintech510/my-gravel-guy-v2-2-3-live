import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { UseMetroOrderReturn } from '../../hooks/useMetroOrder';

/**
 * Handles both the ZIP entry step and the out-of-area waitlist step — they share the
 * same "tell us where you are" moment, so keeping them in one component avoids a
 * jarring step change when a ZIP misses the metro's delivery zones.
 */
export function ZipStep({ order }: { order: UseMetroOrderReturn }) {
  const [value, setValue] = useState(order.zip);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  // Metro-specific example ZIP for the input placeholder — a hardcoded "75201" (Dallas)
  // was showing on every metro, including Long Island. Derive it from the metro's own
  // config instead (first zone's first ZIP) so each metro shows a locally-plausible
  // example without touching config/types.
  const zipPlaceholder = order.metro.zones[0]?.zips[0] ?? '00000';

  if (order.step === 'out-of-area') {
    if (order.waitlistSubmitted) {
      return (
        <div role="status" className="rounded-xl bg-primary/10 p-5 text-sm font-medium text-[#0F1115]">
          Thanks — we'll text or email you as soon as we deliver near {order.zip}.
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <p className="font-semibold text-[#0F1115]">
            We don't deliver to {order.zip} yet.
          </p>
          <p className="mt-1 text-sm text-[#0F1115]/65">
            Leave your info and we'll let you know the moment {order.metro.name} delivery reaches your area.
          </p>
        </div>

        <form
          className="space-y-3"
          onSubmit={e => {
            e.preventDefault();
            order.submitWaitlist({ name, email, mobile });
          }}
        >
          <div>
            <Label htmlFor="waitlist-name">Name (optional)</Label>
            <Input id="waitlist-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="waitlist-email">Email</Label>
              <Input id="waitlist-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="waitlist-mobile">Mobile</Label>
              <Input id="waitlist-mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>
          </div>
          {order.submitError && (
            <p role="alert" className="text-sm font-medium text-red-600">{order.submitError}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={order.submitting} className="min-h-[44px] font-bold">
              {order.submitting ? 'Sending…' : 'Notify me'}
            </Button>
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={order.goBack}>
              Try another ZIP
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={e => {
        e.preventDefault();
        order.checkZip(value);
      }}
    >
      <Label htmlFor="metro-zip">Your ZIP code</Label>
      <div className="flex gap-2">
        <Input
          id="metro-zip"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={zipPlaceholder}
          required
          className="max-w-[10rem]"
        />
        <Button type="submit" className="min-h-[44px] font-bold">Check delivery</Button>
      </div>
    </form>
  );
}
