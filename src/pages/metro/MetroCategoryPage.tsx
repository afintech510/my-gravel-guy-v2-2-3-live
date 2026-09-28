import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import { categoryFromRouteSegment, CATEGORY_ROUTE_SUFFIX } from '@/metro/config';
import { getCategory } from '@/metro/lib/pricing';
import type { Metro } from '@/metro/types';
import { MetroLayout } from '@/metro/components/layout/MetroLayout';
import { MetroHero } from '@/metro/components/marketing/MetroHero';
import { DirectAnswerBlock } from '@/metro/components/marketing/DirectAnswerBlock';
import { ZonePriceTable, type ZonePriceRow } from '@/metro/components/marketing/ZonePriceTable';
import { OrderFlow } from '@/metro/components/order/OrderFlow';
import { FaqSection, faqJsonLd, type FaqItem } from '@/metro/components/marketing/FaqSection';
import { categoryFromPrice, cheapestZoneForVariant, formatMoney } from '@/metro/components/shared/priceHelpers';
import { breadcrumbJsonLd } from '@/metro/components/shared/jsonLd';

const SITE_URL = 'https://mygravelguy.com';
const REFERENCE_QTY = 10;

export default function MetroCategoryPage({ metro }: { metro: Metro }) {
  const { categorySegment } = useParams<{ categorySegment: string }>();
  const categorySlug = categorySegment ? categoryFromRouteSegment(categorySegment) : undefined;
  const category = categorySlug ? getCategory(metro, categorySlug) : undefined;

  if (!category) return <NotFound />;

  const fromPrice = categoryFromPrice(metro, category, REFERENCE_QTY);

  const priceRows: ZonePriceRow[] = category.variants
    .map(variant => {
      const best = cheapestZoneForVariant(metro, category, variant, REFERENCE_QTY);
      return best
        ? ({
            label: variant.name,
            unit: category.unit,
            pricePerUnit: best.pricePerUnit,
            total: best.total,
            zoneName: best.zone.name,
          } satisfies ZonePriceRow)
        : null;
    })
    .filter((row): row is ZonePriceRow => row !== null);

  const directAnswer = [
    `MyGravelGuy delivers ${category.name.toLowerCase()} in ${metro.name}${
      fromPrice != null ? `, starting from ${formatMoney(fromPrice)} per ${category.unit} delivered` : ''
    }.`,
    `${category.tagline}.`,
    'Enter your ZIP code below to see the exact delivered price for your zone, pick a delivery day, and request delivery — you are only charged after we confirm your order by text.',
  ].join(' ');

  const faqs: FaqItem[] = [
    {
      question: `How much does ${category.name.toLowerCase()} delivery cost in ${metro.name}?`,
      answer:
        fromPrice != null
          ? `${category.name} delivery in ${metro.name} starts from ${formatMoney(fromPrice)} per ${category.unit} delivered, depending on your zone and quantity.`
          : `Enter your ZIP to see ${category.name.toLowerCase()} delivery pricing for your zone.`,
    },
    {
      question: `What ${category.name.toLowerCase()} options are available?`,
      answer: `We offer ${category.variants.map(v => v.name).join(', ')} in ${metro.name}.`,
    },
    {
      question: 'How is the price calculated?',
      answer:
        'Your delivered price includes the material and delivery to your address for your selected zone and quantity — no hidden fees, and nothing is charged until we confirm your order by text.',
    },
    {
      question: 'When can I get it delivered?',
      answer: `Standard delivery is typically the next available business day, with Saturday and rush options available in some ${metro.shortName} zones for an added fee.`,
    },
  ];

  const canonical = `${SITE_URL}/${metro.slug}/${category.slug}${CATEGORY_ROUTE_SUFFIX}`;
  const title = `${category.name} Delivery in ${metro.name} | MyGravelGuy`;
  const description = `${category.name} delivered in ${metro.name}${
    fromPrice != null ? ` from ${formatMoney(fromPrice)}/${category.unit}` : ''
  }. One delivered price, pick your day, confirmed by text before you're charged.`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: metro.name, url: `${SITE_URL}/${metro.slug}` },
    { name: `${category.name} delivery`, url: canonical },
  ]);

  return (
    <MetroLayout metro={metro}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(faqs))}</script>
      </Helmet>

      <MetroHero
        metro={metro}
        eyebrow={metro.name}
        headline={`${category.name} delivery in ${metro.name}`}
        subhead={category.tagline}
      />

      <section className="py-10 md:py-12">
        <div className="container mx-auto max-w-3xl space-y-6 px-4">
          <DirectAnswerBlock>{directAnswer}</DirectAnswerBlock>

          {priceRows.length > 0 && (
            <ZonePriceTable title={`${category.name} pricing by product`} rows={priceRows} quantity={REFERENCE_QTY} />
          )}

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <p className="mb-2 text-sm font-bold text-[#0F1115]">Delivery zones in {metro.name}</p>
            <ul className="grid gap-1.5 text-sm text-[#0F1115]/70 sm:grid-cols-2">
              {metro.zones.map(zone => (
                <li key={zone.slug}>{zone.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <OrderFlow metro={metro} initialCategory={category.slug} />

      <FaqSection faqs={faqs} />
    </MetroLayout>
  );
}
