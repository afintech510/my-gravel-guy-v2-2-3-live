import { Helmet } from 'react-helmet-async';
import type { Metro } from '@/metro/types';
import { MetroLayout } from '@/metro/components/layout/MetroLayout';
import { MetroHero } from '@/metro/components/marketing/MetroHero';
import { OrderFlow } from '@/metro/components/order/OrderFlow';
import { HowItWorks } from '@/metro/components/marketing/HowItWorks';
import { CategoryCards } from '@/metro/components/marketing/CategoryCards';
import { FaqSection, faqJsonLd, type FaqItem } from '@/metro/components/marketing/FaqSection';
import { TrustStrip } from '@/metro/components/marketing/TrustStrip';
import { breadcrumbJsonLd } from '@/metro/components/shared/jsonLd';

const SITE_URL = 'https://mygravelguy.com';

function buildFaqs(metro: Metro): FaqItem[] {
  const materials = metro.categories.map(c => c.name.toLowerCase()).join(', ');
  return [
    {
      question: `Does MyGravelGuy deliver gravel, mulch, sand and soil in ${metro.name}?`,
      answer: `Yes. MyGravelGuy delivers ${materials} across ${metro.name}, with your delivered price based on your ZIP code's delivery zone.`,
    },
    {
      question: 'How is the delivered price calculated?',
      answer:
        "Your delivered price includes the material and delivery to your address. Enter your ZIP and pick a material to see your exact price before you request delivery — there's no itemized markup shown, just one price.",
    },
    {
      question: 'How fast can I get a delivery?',
      answer: `Standard delivery is typically the next available business day in ${metro.shortName}. Rush and Saturday delivery are available in some zones for an added fee.`,
    },
    {
      question: 'Do I have to pay before delivery is confirmed?',
      answer:
        "No. You submit a delivery request online, and we text you to confirm your exact price and delivery window before anything is charged.",
    },
    {
      question: 'What materials can I order?',
      answer: `${metro.name} deliveries currently cover ${materials}.`,
    },
    {
      question: 'Do you deliver on Saturdays?',
      answer: metro.nodes.some(n => n.deliversSaturday)
        ? `Yes, Saturday delivery is available in parts of ${metro.name} for an added fee.`
        : `Saturday delivery is not currently available in ${metro.name}.`,
    },
  ];
}

export default function MetroHomePage({ metro }: { metro: Metro }) {
  const faqs = buildFaqs(metro);
  const canonical = `${SITE_URL}/${metro.slug}`;
  const title = `Gravel, Mulch, Sand & Soil Delivery in ${metro.name} | MyGravelGuy`;
  const description = `Order gravel, mulch, sand or soil delivered in ${metro.name}. One delivered price, pick your day, confirmed by text before you're charged.`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: metro.name, url: canonical },
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

      <MetroHero metro={metro} />
      <OrderFlow metro={metro} />
      <HowItWorks metro={metro} />
      <CategoryCards metro={metro} />
      <FaqSection faqs={faqs} />
      <TrustStrip metro={metro} />
    </MetroLayout>
  );
}
