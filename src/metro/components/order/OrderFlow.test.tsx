import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrderFlow, type OrderFlowProps } from './OrderFlow';
import { quote } from '../../lib/pricing';
import { formatMoney } from '../shared/priceHelpers';
import type { Metro } from '../../types';

// jsdom has no ResizeObserver; the shadcn/Radix Checkbox used in DetailsStep needs one.
// Stubbed locally (rather than in the shared setupTests.ts) to keep this test file
// self-contained.
if (typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// The metro order pipeline reuses the site's existing quote-request email service
// (see metroQuoteService.ts). We mock it at the module boundary so these tests can
// drive the full OrderFlow — including the final submit — without ever touching the
// network or the (production) Supabase-backed email/SMS pipeline behind it.
vi.mock('../../services/metroQuoteService', () => ({
  submitMetroOrderRequest: vi.fn(),
  submitMetroWaitlist: vi.fn(),
}));

import { submitMetroOrderRequest, submitMetroWaitlist } from '../../services/metroQuoteService';

const mockSubmitOrder = submitMetroOrderRequest as unknown as ReturnType<typeof vi.fn>;
const mockSubmitWaitlist = submitMetroWaitlist as unknown as ReturnType<typeof vi.fn>;

// A small, self-contained metro fixture — deliberately independent of the real DFW/Long
// Island config data (which other agents are actively editing) so these tests stay
// deterministic regardless of in-flight price-book changes.
const testMetro: Metro = {
  slug: 'test-metro',
  name: 'Test Metro',
  shortName: 'Test',
  state: 'TX',
  timeZone: 'America/Chicago',
  status: 'live',
  headline: 'Gravel, delivered',
  subhead: 'Test subhead',
  priceBookConfirmed: true,
  nodes: [{ id: 'node-1', name: 'Test Yard', publicLabel: 'Test Yard', cutoffHour: 23, deliversSaturday: true }],
  zones: [{ slug: 'core', name: 'Core Zone', loadCost: 100, minUnits: 3, zips: ['20001'] }],
  towns: [],
  categories: [
    {
      slug: 'gravel',
      name: 'Gravel',
      tagline: 'Test gravel category',
      unit: 'ton',
      tonsPerYard: 1.4,
      defaultDepthIn: 3,
      variants: [
        {
          slug: 'pea-gravel',
          name: 'Pea Gravel',
          shortDescription: 'Small rounded stone',
          bestFor: ['Walkways'],
          nodePricePerUnit: 50,
          swatch: '#999999',
          popular: true,
        },
      ],
    },
  ],
  trucks: [{ id: 'small', name: 'Small dump', capacityTons: 20, capacityYards: 20, deliveryCostFactor: 1 }],
  pricing: {
    premiumRate: 0.2,
    additionalLoadDiscount: 0.25,
    saturdayFeeRate: 0.1,
    rushFeeRate: 0.15,
    roundTo: 1,
  },
  phone: '(555) 555-5555',
  phoneHref: 'tel:+15555555555',
};

/** Renders OrderFlow inside a MemoryRouter — required by useSearchParams (query-param
 * prefill), which OrderFlow calls unconditionally, same as it's always wrapped in the
 * real app (App.tsx's BrowserRouter). `route` sets the URL (and its query string). */
function renderFlow(props: Partial<OrderFlowProps> = {}, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <OrderFlow metro={testMetro} {...props} />
    </MemoryRouter>,
  );
}

/** Drives ZIP -> category -> variant, landing on the quantity step (default qty = 10). */
async function goToQuantityStep(zip = '20001') {
  renderFlow();
  fireEvent.change(screen.getByLabelText('Your ZIP code'), { target: { value: zip } });
  fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));
  fireEvent.click(await screen.findByRole('radio')); // the only category: Gravel
  fireEvent.click(await screen.findByRole('radio')); // the only variant: Pea Gravel
  await screen.findByRole('heading', { name: 'How much do you need?' });
}

async function goToDateStep() {
  await goToQuantityStep();
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'When works for you?' });
}

function pickSaturday() {
  const radios = screen.getAllByRole('radio');
  const saturday = radios.find(r => r.textContent?.includes('Saturday'));
  if (!saturday) throw new Error('No Saturday delivery option found in the next 14 days');
  fireEvent.click(saturday);
}

beforeEach(() => {
  mockSubmitOrder.mockReset().mockResolvedValue({ success: true });
  mockSubmitWaitlist.mockReset().mockResolvedValue({ success: true });
});

describe('OrderFlow', () => {
  it('shows the waitlist step for a ZIP outside the metro', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    renderFlow();

    fireEvent.change(screen.getByLabelText('Your ZIP code'), { target: { value: '99999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));

    await screen.findByRole('heading', { name: "We're not there yet" });
    expect(screen.getByText(/We don't deliver to 99999 yet/)).toBeInTheDocument();
    // The waitlist form (not the order form) should be showing.
    expect(screen.getByLabelText('Name (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('warns and blocks Continue when quantity drops below the zone minimum', async () => {
    await goToQuantityStep();

    const decrease = screen.getByRole('button', { name: 'Decrease quantity' });
    // Zone minUnits is 3; default quantity is 10 → 15 half-unit decrements gets to 2.5.
    for (let i = 0; i < 15; i++) {
      fireEvent.click(decrease);
    }

    expect(await screen.findByRole('alert')).toHaveTextContent("This zone's minimum order is 3 tons.");
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('accumulates two quantity decreases fired in the same React batch, not just the last one', async () => {
    // Regression test: the decrease/increase handlers used to read the `quantity`
    // closure value directly instead of a functional setState updater. That's invisible
    // to fireEvent's default one-click-at-a-time flow (each call flushes a render before
    // the next), but real React 18 automatic batching can coalesce multiple clicks fired
    // within one synchronous task — e.g. a fast double-tap — into a single re-render, in
    // which case a closure-based handler would compute both clicks from the same stale
    // starting value instead of accumulating. act() wrapping two fireEvents together
    // reproduces that batching.
    await goToQuantityStep();
    const decrease = screen.getByRole('button', { name: 'Decrease quantity' });

    await act(async () => {
      fireEvent.click(decrease);
      fireEvent.click(decrease);
    });

    // Default quantity is 10; two half-unit decreases should land on 9, not 9.5.
    expect(screen.getByTestId('metro-quantity-value')).toHaveTextContent('9 tons');
  });

  it('shows a price summary total that includes the Saturday fee', async () => {
    await goToDateStep();
    pickSaturday();

    const expected = quote({
      metro: testMetro,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'core',
      saturday: true,
      speed: 'standard',
    });
    expect(expected).not.toBeNull();
    expect(expected!.saturdayFee).toBeGreaterThan(0);
    expect(expected!.total).toBe(expected!.basePrice + expected!.saturdayFee);

    // Both the desktop card and the mobile sticky bar render the same total.
    const totalNodes = screen.getAllByText(formatMoney(expected!.total));
    expect(totalNodes.length).toBeGreaterThan(0);
  });

  it('submits with a mocked service call containing variant, quantity and date — never hitting the network', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await goToDateStep();
    pickSaturday();

    await screen.findByRole('heading', { name: 'Delivery details' });
    fireEvent.change(screen.getByLabelText('Delivery address'), { target: { value: '123 Test Ln' } });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'QA Tester' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa-test@example.com' } });
    fireEvent.click(screen.getByLabelText(/I agree to receive SMS and email updates/));

    fireEvent.click(screen.getByRole('button', { name: /Request my delivery/ }));

    await waitFor(() => expect(mockSubmitOrder).toHaveBeenCalledTimes(1));
    // useMetroOrder.submit() calls submitMetroOrderRequest with the structured order —
    // not a pre-built message string (the real, mocked-away service builds that message
    // itself, from these same fields, in metroQuoteService.ts's buildOrderSummary). So
    // "contains variant/quantity/date" is verified against the structured fields.
    const submission = mockSubmitOrder.mock.calls[0][0];
    expect(submission.variant.name).toBe('Pea Gravel'); // variant
    expect(submission.quantity).toBe(10); // quantity
    expect(submission.day.isSaturday).toBe(true); // date

    await screen.findByRole('heading', { name: "You're all set" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('blocks submit with an error (no service call) when SMS/email consent is unchecked', async () => {
    await goToDateStep();
    pickSaturday();

    await screen.findByRole('heading', { name: 'Delivery details' });
    fireEvent.change(screen.getByLabelText('Delivery address'), { target: { value: '123 Test Ln' } });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'QA Tester' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'qa-test@example.com' } });
    // Consent checkbox deliberately left unchecked.

    fireEvent.click(screen.getByRole('button', { name: /Request my delivery/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/agree to receive SMS/);
    expect(mockSubmitOrder).not.toHaveBeenCalled();
  });

  it('prefills ZIP, category, variant and quantity from ?zip=&category=&variant=&qty=&unit= query params', async () => {
    // Same-unit case (qty is already in the category's own unit: 'ton'). ZIP 20001 is
    // in the fixture's only zone, so this should walk straight to a pre-populated
    // quantity step with no manual ZIP/category/variant interaction at all.
    renderFlow({}, '/?zip=20001&category=gravel&variant=pea-gravel&qty=7&unit=ton');

    await screen.findByRole('heading', { name: 'How much do you need?' });
    expect(screen.getByTestId('metro-quantity-value')).toHaveTextContent('7 tons');
  });

  it('converts a query-param quantity given in a different unit than the category sells in', async () => {
    // The fixture category sells by the ton (tonsPerYard: 1.4); asking for 5 yd should
    // convert to 5 * 1.4 = 7 tons, not be applied as a raw "5".
    renderFlow({}, '/?zip=20001&category=gravel&variant=pea-gravel&qty=5&unit=yd');

    await screen.findByRole('heading', { name: 'How much do you need?' });
    expect(screen.getByTestId('metro-quantity-value')).toHaveTextContent('7 tons');
  });

  it('lets a page-supplied initialCategory prop stand when the URL has no ?category=', async () => {
    // Mirrors MetroCategoryPage, which passes initialCategory as a prop (the category
    // lives in the route path, not the query string) alongside the calculator's ?qty=&unit=.
    renderFlow({ initialCategory: 'gravel' }, '/?qty=5&unit=ton');

    fireEvent.change(screen.getByLabelText('Your ZIP code'), { target: { value: '20001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check delivery' }));
    // Category is preselected, so this lands straight on the variant step.
    fireEvent.click(await screen.findByRole('radio')); // the only variant: Pea Gravel

    await screen.findByRole('heading', { name: 'How much do you need?' });
    expect(screen.getByTestId('metro-quantity-value')).toHaveTextContent('5 tons');
  });
});
