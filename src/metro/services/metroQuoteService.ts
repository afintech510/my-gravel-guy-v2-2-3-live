// Wraps the existing quote-request pipeline (DB row + SMS/Slack alert + emails) for metro
// order submissions. No new backend — reuses sendQuoteRequestEmail exactly like the rest of
// the site's quote forms until Stripe checkout is wired for metro price books.
import { sendQuoteRequestEmail } from '@/services/quoteEmailService';
import type { DeliveryZone, MaterialCategory, MaterialVariant, Metro, QuoteResult } from '../types';
import { formatUnit } from '../lib/pricing';
import type { DeliveryDayOption } from '../lib/dates';

export interface MetroOrderSubmission {
  metro: Metro;
  zip: string;
  zone: DeliveryZone;
  category: MaterialCategory;
  variant: MaterialVariant;
  quantity: number;
  day: DeliveryDayOption;
  street: string;
  dropNotes: string;
  name: string;
  email: string;
  mobile: string;
  quote: QuoteResult;
}

export interface MetroWaitlistSubmission {
  metro: Metro;
  zip: string;
  name?: string;
  email?: string;
  mobile?: string;
}

const timeframeLabel = (day: DeliveryDayOption): string => {
  const tags = [day.isSaturday ? 'Saturday' : null, day.isRush ? 'Rush' : null].filter(Boolean).join(' + ');
  return tags ? `${day.label} (${tags})` : day.label;
};

const money = (value: number): string => `$${value.toFixed(2)}`;

const buildOrderSummary = (input: MetroOrderSubmission): string => {
  const { metro, zone, category, variant, quantity, quote, day, dropNotes, street, zip } = input;
  const unitLabel = formatUnit(category.unit, quantity);
  const truckPlan = quote.loads
    .map(load => `${load.truck.name} (${load.quantity} ${formatUnit(category.unit, load.quantity)})`)
    .join(', ');
  const extraFees = quote.saturdayFee + quote.rushFee;

  return [
    `Metro: ${metro.name} (${metro.slug})`,
    `Zone: ${zone.name}`,
    `ZIP: ${zip}`,
    `Category: ${category.name}`,
    `Variant: ${variant.name}`,
    `Quantity: ${quantity} ${unitLabel}`,
    `Truck plan: ${truckPlan}`,
    `Requested delivery day: ${timeframeLabel(day)}`,
    `Drop address: ${street}`,
    dropNotes ? `Drop-spot notes: ${dropNotes}` : null,
    `Price per unit: ${money(quote.pricePerUnit)}/${category.unit}`,
    extraFees > 0
      ? `Total: ${money(quote.total)} (includes ${money(extraFees)} Saturday/rush fee)`
      : `Total: ${money(quote.total)}`,
    metro.priceBookConfirmed
      ? 'Price status: confirmed price book'
      : 'Price status: ESTIMATED — confirm exact price by text before charging anything',
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
};

export async function submitMetroOrderRequest(input: MetroOrderSubmission) {
  return sendQuoteRequestEmail({
    name: input.name,
    email: input.email,
    phone: input.mobile,
    zipCode: input.zip,
    street: input.street,
    state: input.metro.state,
    material: input.variant.name,
    estimatedTons: input.category.unit === 'ton' ? input.quantity : undefined,
    timeframe: timeframeLabel(input.day),
    sourcePage: `metro:${input.metro.slug}`,
    message: buildOrderSummary(input),
  });
}

export async function submitMetroWaitlist(input: MetroWaitlistSubmission) {
  return sendQuoteRequestEmail({
    name: input.name || 'Metro waitlist request',
    email: input.email || '',
    phone: input.mobile || '',
    zipCode: input.zip,
    state: input.metro.state,
    sourcePage: `metro-waitlist:${input.metro.slug}`,
    message: `ZIP ${input.zip} is outside the current ${input.metro.name} delivery area today. Please notify this customer when ${input.metro.name} launches nearby.`,
  });
}
