import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/utils/analytics';
import type { CategorySlug, DeliveryZone, MaterialCategory, MaterialVariant, Metro, QuoteResult, SellUnit } from '../types';
import { findZoneByZip, getCategory, getVariant, quote as computeQuote } from '../lib/pricing';
import { getDeliveryDayOptions, type DeliveryDayOption } from '../lib/dates';
import { submitMetroOrderRequest, submitMetroWaitlist } from '../services/metroQuoteService';

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

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitMetroOrderRequest({
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
      });

      if (result.success) {
        setSubmitted(true);
        setStep('confirmed');
        trackEvent('form_submit', 'Quote', `metro:${metro.slug}`, 1);
        trackEvent('generate_lead', 'metro_order', `${metro.slug}:${category.slug}:${variant.slug}`);
      } else {
        setSubmitError(result.error || 'Something went wrong submitting your request. Please try again.');
      }
    } catch (err) {
      setSubmitError((err as Error).message || 'Something went wrong submitting your request.');
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
  };
}

export type UseMetroOrderReturn = ReturnType<typeof useMetroOrder>;
