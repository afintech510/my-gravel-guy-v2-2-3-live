import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/utils/analytics';
import type { CategorySlug, DeliveryZone, MaterialCategory, MaterialVariant, Metro, QuoteResult, SellUnit } from '../types';
import { findZoneByZip, getCategory, getVariant, quote as computeQuote } from '../lib/pricing';
import { getDeliveryDayOptions, type DeliveryDayOption } from '../lib/dates';
import { submitMetroOrderRequest, submitMetroWaitlist, type MetroOrderSubmission } from '../services/metroQuoteService';
import { isMetroCheckoutEnabled, startMetroCheckout, type MetroCheckoutResult, type StartMetroCheckoutDeps } from '../services/metroCheckoutService';
import type { MetroServerQuote } from '../checkout/contract';

export type OrderStep =
  | 'zip'
  | 'out-of-area'
  | 'category'
  | 'variant'
  | 'quantity'
  | 'date'
  | 'contact'
  | 'confirmed';

const STEP_ORDER: OrderStep[] = ['zip', 'category', 'variant', 'quantity', 'date', 'contact'];

export interface ContactInfo {
  street: string;
  dropNotes: string;
  name: string;
  mobile: string;
  email: string;
  smsConsent: boolean;
}

const EMPTY_CONTACT: ContactInfo = {
  street: '',
  dropNotes: '',
  name: '',
  mobile: '',
  email: '',
  smsConsent: false,
};

export interface UseMetroOrderOptions {
  /** Prefills the ZIP step and auto-checks it (town pages) */
  initialZip?: string;
  /** Preselects a category, skipping the category tile step (category pages) */
  initialCategory?: CategorySlug;
  /** Preselects a variant, skipping straight to quantity (rare — deep links) */
  initialVariantSlug?: string;
  /**
   * Prefills the quantity step once a category is known (e.g. from the guides
   * calculator's "Order in DFW" CTA, which passes ?qty=&unit=). `initialQuantityUnit`
   * may differ from the resolved category's own sell unit (a calculator computed in
   * tons while the category sells by the yard, or vice versa) — it is converted via
   * the category's tonsPerYard before being applied.
   */
  initialQuantity?: number;
  initialQuantityUnit?: SellUnit;
  /**
   * Redirect target for a successful checkout — defaults to `window.location.href =`.
   * Overridable so tests can assert on the URL without touching jsdom navigation.
   */
  navigate?: (url: string) => void;
  /** Test-only override for the checkout service's own dependencies (invoke, backup, UTM). */
  checkoutDeps?: StartMetroCheckoutDeps;
}

/** Round to the nearest half unit — matches quantityForArea's rounding in lib/pricing.ts. */
const roundToHalf = (value: number): number => Math.max(0.5, Math.round(value * 2) / 2);

/** Convert a quantity expressed in `fromUnit` into the category's own sell unit. */
const toCategoryUnit = (quantity: number, fromUnit: SellUnit, category: MaterialCategory): number => {
  if (fromUnit === category.unit) return roundToHalf(quantity);
  return category.unit === 'ton'
    ? roundToHalf(quantity * category.tonsPerYard) // fromUnit is yd -> ton
    : roundToHalf(quantity / category.tonsPerYard); // fromUnit is ton -> yd
};

export function useMetroOrder(metro: Metro, options: UseMetroOrderOptions = {}) {
  const [step, setStep] = useState<OrderStep>('zip');
  const [zip, setZip] = useState(options.initialZip ?? '');
  const [zipChecked, setZipChecked] = useState(false);
  const [zone, setZone] = useState<DeliveryZone | undefined>(undefined);
  const [categorySlug, setCategorySlug] = useState<CategorySlug | undefined>(options.initialCategory);
  const [variantSlug, setVariantSlug] = useState<string | undefined>(options.initialVariantSlug);
  const [quantity, setQuantity] = useState<number>(10);
  const [day, setDay] = useState<DeliveryDayOption | undefined>(undefined);
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  /** Set when create-metro-checkout rejects the client's price with a fresher server
   * quote (PRICE_CHANGED). Non-null means "show the new price and ask the customer to
   * confirm again" — submit() never auto-redirects in this state. */
  const [priceChangeQuote, setPriceChangeQuote] = useState<MetroServerQuote | null>(null);

  /** Stripe checkout is only attempted once this metro's price book is confirmed AND the
   * env flag is on — both are false for every metro today, so this stays false and submit()
   * behaves exactly as before. See metroCheckoutService.isMetroCheckoutEnabled. */
  const checkoutEnabled = useMemo(() => isMetroCheckoutEnabled(metro), [metro]);
  const navigateToCheckout = options.navigate ?? ((url: string) => { window.location.href = url; });

  const category: MaterialCategory | undefined = categorySlug ? getCategory(metro, categorySlug) : undefined;
  const variant: MaterialVariant | undefined = category && variantSlug ? getVariant(category, variantSlug) : undefined;

  const dayOptions = useMemo(() => getDeliveryDayOptions(metro, new Date()), [metro]);

  const quoteResult: QuoteResult | null = useMemo(() => {
    if (!category || !variant || !zone || quantity <= 0) return null;
    return computeQuote({
      metro,
      categorySlug: category.slug,
      variantSlug: variant.slug,
      quantity,
      zoneSlug: zone.slug,
      saturday: day?.isSaturday,
      speed: day?.isRush ? 'rush' : 'standard',
    });
  }, [metro, category, variant, zone, quantity, day]);

  const didAutoCheck = useRef(false);
  useEffect(() => {
    if (didAutoCheck.current) return;
    if (options.initialZip) {
      didAutoCheck.current = true;
      checkZip(options.initialZip);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialZip]);

  // Applies a query-param quantity hint (?qty=&unit=) once the category it needs for
  // unit conversion is known — either immediately (initialCategory) or after the ZIP/
  // category steps resolve one. Runs once; a ref (not state) tracks "applied" so it
  // doesn't re-fire and clobber a quantity the visitor has since changed by hand.
  const didApplyInitialQuantity = useRef(false);
  useEffect(() => {
    if (didApplyInitialQuantity.current) return;
    if (options.initialQuantity == null || !category) return;
    didApplyInitialQuantity.current = true;
    const converted = toCategoryUnit(options.initialQuantity, options.initialQuantityUnit ?? category.unit, category);
    setQuantity(converted);
  }, [category, options.initialQuantity, options.initialQuantityUnit]);

  function checkZip(rawZip: string) {
    const clean = rawZip.trim();
    const found = findZoneByZip(metro, clean);
    setZip(clean);
    setZipChecked(true);
    if (found) {
      setZone(found);
      if (variantSlug) setStep('quantity');
      else if (categorySlug) setStep('variant');
      else setStep('category');
    } else {
      setZone(undefined);
      setStep('out-of-area');
    }
  }

  function selectCategory(slug: CategorySlug) {
    setCategorySlug(slug);
    setVariantSlug(undefined);
    setStep('variant');
  }

  function selectVariant(slug: string) {
    setVariantSlug(slug);
    setQuantity(prev => {
      // A ?qty=&unit= prefill that arrived before a category (but no variant) was known
      // — e.g. MetroCategoryPage's initialCategory prop plus a calculator CTA's query
      // params — applies as soon as `category` resolves, which can be before the visitor
      // has picked a variant here. Once applied, respect it instead of stomping it back
      // to the "first variant pick" floor default below.
      if (didApplyInitialQuantity.current) return prev;
      if (options.initialQuantity != null && category) {
        didApplyInitialQuantity.current = true;
        return toCategoryUnit(options.initialQuantity, options.initialQuantityUnit ?? category.unit, category);
      }
      return Math.max(prev, zone?.minUnits ?? 10, 10);
    });
    setStep('quantity');
  }

  function selectDay(selected: DeliveryDayOption) {
    setDay(selected);
    setStep('contact');
  }

  function updateContact(patch: Partial<ContactInfo>) {
    setContact(prev => ({ ...prev, ...patch }));
  }

  function goBack() {
    if (step === 'out-of-area' || step === 'confirmed') {
      setStep('zip');
      return;
    }
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  function reset() {
    setStep('zip');
    setZip('');
    setZipChecked(false);
    setZone(undefined);
    setCategorySlug(undefined);
    setVariantSlug(undefined);
    setQuantity(10);
    setDay(undefined);
    setContact(EMPTY_CONTACT);
    setSubmitted(false);
    setSubmitError(null);
    setPriceChangeQuote(null);
  }

  /** Existing quote-request pipeline (DB row + SMS/Slack alert + emails) — unchanged
   * behavior, also used as the transparent fallback when checkout is enabled but the
   * server declines it for a non-customer-facing reason (fallback_quote). */
  async function submitQuoteRequest(input: MetroOrderSubmission) {
    try {
      const result = await submitMetroOrderRequest(input);

      if (result.success) {
        setSubmitted(true);
        setStep('confirmed');
        trackEvent('form_submit', 'Quote', `metro:${metro.slug}`, 1);
        trackEvent('generate_lead', 'metro_order', `${metro.slug}:${input.category.slug}:${input.variant.slug}`);
      } else {
        setSubmitError(result.error || 'Something went wrong submitting your request. Please try again.');
      }
    } catch (err) {
      setSubmitError((err as Error).message || 'Something went wrong submitting your request.');
    }
  }

  async function handleCheckoutResult(result: MetroCheckoutResult, input: MetroOrderSubmission) {
    switch (result.kind) {
      case 'redirect':
        setPriceChangeQuote(null);
        trackEvent('begin_checkout', 'metro_order', `${metro.slug}:${input.category.slug}:${input.variant.slug}`, Math.round(input.quote.total));
        navigateToCheckout(result.url);
        return;
      case 'price_changed':
        setPriceChangeQuote(result.serverQuote);
        return;
      case 'fallback_quote':
        setPriceChangeQuote(null);
        await submitQuoteRequest(input);
        return;
      case 'error':
        setPriceChangeQuote(null);
        setSubmitError(result.message);
        return;
    }
  }

  async function submit() {
    if (!zone || !category || !variant || !day || quantity <= 0) {
      setSubmitError('Please complete every step before requesting delivery.');
      return;
    }
    if (!contact.smsConsent) {
      setSubmitError('Please agree to receive SMS/email updates about your delivery.');
      return;
    }
    const q = computeQuote({
      metro,
      categorySlug: category.slug,
      variantSlug: variant.slug,
      quantity,
      zoneSlug: zone.slug,
      saturday: day.isSaturday,
      speed: day.isRush ? 'rush' : 'standard',
    });
    if (!q) {
      setSubmitError('Unable to calculate a price for this selection.');
      return;
    }

    const input: MetroOrderSubmission = {
      metro,
      zip,
      zone,
      category,
      variant,
      quantity,
      day,
      street: contact.street,
      dropNotes: contact.dropNotes,
      name: contact.name,
      email: contact.email,
      mobile: contact.mobile,
      quote: q,
    };

    setSubmitting(true);
    setSubmitError(null);
    setPriceChangeQuote(null);
    try {
      if (checkoutEnabled) {
        const result = await startMetroCheckout(input, options.checkoutDeps);
        await handleCheckoutResult(result, input);
      } else {
        await submitQuoteRequest(input);
      }
    } finally {
      setSubmitting(false);
    }
  }

  /** Re-attempts checkout after a PRICE_CHANGED response, this time quoting the server's
   * own total so it clears the tolerance check. Only meaningful while priceChangeQuote is
   * set; a no-op otherwise. Never auto-called — the customer must explicitly confirm. */
  async function confirmPriceChangeAndContinue() {
    if (!priceChangeQuote || !zone || !category || !variant || !day) return;
    const input: MetroOrderSubmission = {
      metro,
      zip,
      zone,
      category,
      variant,
      quantity,
      day,
      street: contact.street,
      dropNotes: contact.dropNotes,
      name: contact.name,
      email: contact.email,
      mobile: contact.mobile,
      quote: { ...(quoteResult as QuoteResult), total: priceChangeQuote.total, basePrice: priceChangeQuote.basePrice, saturdayFee: priceChangeQuote.saturdayFee, rushFee: priceChangeQuote.rushFee, pricePerUnit: priceChangeQuote.pricePerUnit },
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await startMetroCheckout(input, options.checkoutDeps);
      await handleCheckoutResult(result, input);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWaitlist(waitlistContact: { name?: string; email?: string; mobile?: string }) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitMetroWaitlist({ metro, zip, ...waitlistContact });
      if (result.success) {
        setWaitlistSubmitted(true);
        trackEvent('generate_lead', 'metro_waitlist', metro.slug);
      } else {
        setSubmitError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setSubmitError((err as Error).message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    metro,
    step,
    setStep,
    goBack,
    reset,
    zip,
    zipChecked,
    zone,
    checkZip,
    category,
    categorySlug,
    selectCategory,
    variant,
    variantSlug,
    selectVariant,
    quantity,
    setQuantity,
    dayOptions,
    day,
    selectDay,
    contact,
    updateContact,
    quoteResult,
    submitting,
    submitted,
    submitError,
    submit,
    waitlistSubmitted,
    submitWaitlist,
    checkoutEnabled,
    priceChangeQuote,
    confirmPriceChangeAndContinue,
  };
}

export type UseMetroOrderReturn = ReturnType<typeof useMetroOrder>;
