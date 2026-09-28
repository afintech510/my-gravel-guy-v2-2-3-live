import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import { quote } from '@/metro/lib/pricing';
import type { Metro } from '@/metro/types';
import { MetroLayout } from '@/metro/components/layout/MetroLayout';
import { MetroHero } from '@/metro/components/marketing/MetroHero';
import { ZonePriceTable, type ZonePriceRow } from '@/metro/components/marketing/ZonePriceTable';
import { OrderFlow } from '@/metro/components/order/OrderFlow';
import { breadcrumbJsonLd } from '@/metro/components/shared/jsonLd';

const SITE_URL = 'https://mygravelguy.com';
const REFERENCE_QTY = 10;

export default function MetroTownPage({ metro }: { metro: Metro }) {
  const { townSlug } = useParams<{ townSlug: string }>();
  const town = townSlug ? metro.towns.find(t => t.slug === townSlug) : undefined;

  if (!town) return <NotFound />;

  const zone = metro.zones.find(z => z.slug === town.zoneSlug);

  const priceRows: ZonePriceRow[] = zone
    ? metro.categories.flatMap(category =>
        category.variants
          .map(variant => {
            const q = quote({
              metro,
              categorySlug: category.slug,
              variantSlug: variant.slug,
              quantity: REFERENCE_QTY,
              zoneSlug: zone.slug,
            });
            return q
              ? ({
                  label: variant.name,
                  unit: category.unit,
                  pricePerUnit: q.pricePerUnit,
                  total: q.total,
                  zoneName: zone.name,
                } satisfies ZonePriceRow)
              : null;
          })
          .filter((row): row is ZonePriceRow => row !== null),
      )
    : [];

  const canonical = `${SITE_URL}/${metro.slug}/towns/${town.slug}`;
  const title = `Gravel, Mulch, Sand & Soil Delivery in ${town.name} | MyGravelGuy`;
  const description = `Order gravel, mulch, sand or soil delivered in ${town.name}, ${metro.state}. One delivered price, pick your day, confirmed by text before you're charged.`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: SITE_URL },
    { name: metro.name, url: `${SITE_URL}/${metro.slug}` },
    { name: town.name, url: canonical },
  ]);

  return (
    <MetroLayout metro={metro}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <MetroHero
        metro={metro}
        eyebrow={metro.name}
        headline={`Gravel, mulch, sand & soil delivery in ${town.name}`}
        subhead={town.note}
      />

      {priceRows.length > 0 && (
        <section className="py-10 md:py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <ZonePriceTable title={`${town.name} delivered pricing`} rows={priceRows} quantity={REFERENCE_QTY} />
          </div>
        </section>
      )}

      <OrderFlow metro={metro} initialZip={town.zip} />
    </MetroLayout>
  );
}
