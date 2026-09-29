import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { dallasFortWorth, CATEGORY_ROUTE_SUFFIX } from '@/metro/config';
import { fromPricePerUnit, formatUnit } from '@/metro/lib/pricing';
import { formatMoney } from '@/metro/components/shared/priceHelpers';
import { breadcrumbJsonLd, type BreadcrumbEntry } from '@/metro/components/shared/jsonLd';
import { FaqSection, faqJsonLd } from '@/metro/components/marketing/FaqSection';
import { DirectAnswerBlock } from '@/metro/components/marketing/DirectAnswerBlock';
import { SITE_URL, guideCanonicalUrl } from '@/content/guides/schema';
import { GUIDE_SPOKES } from '@/content/guides';
import { GuidesLayout } from '@/components/guides/GuidesLayout';
import { Breadcrumbs } from '@/components/guides/Breadcrumbs';
import { costIndexRows, costIndexMeta, type CostIndexRow } from '@/content/guides/costIndex/costIndexData';
import {
  PATH,
  LAST_UPDATED,
  title,
  description,
  h1,
  directAnswer,
  howWeKnow,
  methodology,
  faqs,
  citation,
  referenceExample,
  REFERENCE_SQFT,
  REFERENCE_DEPTH_IN,
  longIslandReferenceRows,
} from '@/content/guides/costIndex/content';
import { costIndexDatasetJsonLd, costIndexArticleJsonLd } from '@/content/guides/costIndex/schema';

const CATEGORY_LABELS: Record<CostIndexRow['category'], string> = {
  gravel: 'Gravel',
  sand: 'Sand',
  mulch: 'Mulch',
  soil: 'Soil',
};

const CATEGORY_ORDER: CostIndexRow['category'][] = ['gravel', 'sand', 'mulch', 'soil'];

function money(value: number): string {
  return formatMoney(value);
}

function StatCell({ stat, unit }: { stat: CostIndexRow['yard']; unit: CostIndexRow['unit'] }) {
  if (!stat) return <span className="text-[#0F1115]/40">—</span>;
  return (
    <span>
      {money(stat.median)}/{unit}
      <span className="ml-1 text-xs text-[#0F1115]/50">
        (n={stat.n}, {money(stat.min)}–{money(stat.max)})
      </span>
    </span>
  );
}

function CostIndexTable({ category }: { category: CostIndexRow['category'] }) {
  const rows = costIndexRows.filter(row => row.category === category);
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="border-b border-black/10 bg-[#F2F1EA] px-4 py-3">
        <p className="text-sm font-bold text-[#0F1115]">{CATEGORY_LABELS[category]}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0F1115]/50">
              <th className="px-4 py-2 font-medium" scope="col">
                Material
              </th>
              <th className="px-4 py-2 font-medium" scope="col">
                DFW yard-class median
              </th>
              <th className="px-4 py-2 font-medium" scope="col">
                DFW broker-delivered median
              </th>
              <th className="px-4 py-2 font-medium" scope="col">
                MyGravelGuy delivered (estimated)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const mggPerUnit = fromPricePerUnit(dallasFortWorth, row.category, row.slug, 10);
              return (
                <tr key={row.slug} className="border-t border-black/5 align-top">
                  <th className="px-4 py-3 text-left font-semibold text-[#0F1115]" scope="row">
                    {row.name}
                    {row.note && (
                      <span
                        className="ml-1 cursor-help text-[#0F1115]/40"
                        title={row.note}
                        aria-label={row.note}
                      >
                        *
                      </span>
                    )}
                  </th>
                  <td className="px-4 py-3 text-[#0F1115]/70">
                    <StatCell stat={row.yard} unit={row.unit} />
                  </td>
                  <td className="px-4 py-3 text-[#0F1115]/70">
                    <StatCell stat={row.brokerDelivered} unit={row.unit} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0F1115]">
                    {mggPerUnit != null ? (
                      <>
                        {money(mggPerUnit)}/{row.unit}
                        <span className="ml-1 font-normal text-[#0F1115]/50">(estimated)</span>
                      </>
                    ) : (
                      <span className="text-[#0F1115]/40">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LongIslandReferenceTable() {
  const rows = longIslandReferenceRows();
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="border-b border-black/10 bg-[#F2F1EA] px-4 py-3">
        <p className="text-sm font-bold text-[#0F1115]">Long Island (Eastern LM yard reference — single seller)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0F1115]/50">
              <th className="px-4 py-2 font-medium" scope="col">
                Material
              </th>
              <th className="px-4 py-2 font-medium" scope="col">
                Eastern LM yard price
              </th>
              <th className="px-4 py-2 font-medium" scope="col">
                MyGravelGuy delivered (estimated)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.slug} className="border-t border-black/5">
                <th className="px-4 py-3 text-left font-semibold text-[#0F1115]" scope="row">
                  {row.name}
                </th>
                <td className="px-4 py-3 text-[#0F1115]/70">
                  {money(row.elmYardPrice)}/{row.unit}
                </td>
                <td className="px-4 py-3 font-semibold text-[#0F1115]">
                  {money(row.mggPricePerUnit)}/{row.unit}
                  <span className="ml-1 font-normal text-[#0F1115]/50">(estimated)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-black/5 px-4 py-3 text-xs text-[#0F1115]/50">
        Source: real 2025–26 material prices observed at Eastern Landscape & Mason Supply (Center Moriches, NY),
        MyGravelGuy's Long Island fulfillment partner — a single yard, not a multi-seller survey like the DFW table above.
      </p>
    </div>
  );
}

export default function GravelDrivewayCostIndexPage() {
  const canonical = guideCanonicalUrl(PATH);
  const breadcrumbItems: BreadcrumbEntry[] = [
    { name: 'Home', url: SITE_URL },
    { name: 'Gravel Driveways', url: guideCanonicalUrl('/gravel-driveways') },
    { name: 'Cost Index', url: canonical },
  ];
  const breadcrumb = breadcrumbJsonLd(breadcrumbItems);
  const dataset = costIndexDatasetJsonLd(costIndexRows);
  const article = costIndexArticleJsonLd();
  const faq = faqJsonLd(faqs);

  const lastUpdatedDisplay = new Date(`${LAST_UPDATED}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <GuidesLayout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(dataset)}</script>
        <script type="application/ld+json">{JSON.stringify(article)}</script>
        <script type="application/ld+json">{JSON.stringify(faq)}</script>
      </Helmet>

      <Breadcrumbs items={breadcrumbItems} />

      <article className="space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-extrabold leading-tight text-[#0F1115] md:text-4xl">{h1}</h1>
          <DirectAnswerBlock>{directAnswer}</DirectAnswerBlock>
          <p className="text-xs text-[#0F1115]/50">
            Last updated {lastUpdatedDisplay}. <span className="italic">{howWeKnow}</span>
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#0F1115]">DFW market price index, by material</h2>
          <p className="text-sm text-[#0F1115]/70">
            Median price per unit from a {costIndexMeta.totalSellers}-seller DFW survey ({costIndexMeta.sampleStartDate} to{' '}
            {costIndexMeta.sampleEndDate}), split by seller class. &quot;n&quot; is the number of distinct sellers behind
            each figure — thin samples (n=1 or 2) are real but should be read as a single data point, not a stable market
            median.{' '}
            <a href={costIndexMeta.csvUrl} className="font-semibold underline" download>
              Download the full dataset (CSV)
            </a>
            .
          </p>
          <div className="space-y-6">
            {CATEGORY_ORDER.map(category => (
              <CostIndexTable key={category} category={category} />
            ))}
          </div>
          <p className="text-xs text-[#0F1115]/50">
            * Materials marked with an asterisk have a documented caveat — hover the marker, or see the methodology
            section below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#0F1115]">Worked example: 12×50 ft driveway</h2>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-5">
            <p className="text-sm text-[#0F1115]/70">
              A {REFERENCE_SQFT} sq ft driveway (12×50 ft) at {REFERENCE_DEPTH_IN}&quot; deep needs about{' '}
              <strong>{referenceExample.quantity} {formatUnit(referenceExample.unit, referenceExample.quantity)}</strong>{' '}
              of {referenceExample.variantName}, the DFW driveway-base standard used in this worked example.
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#0F1115]/50">DFW yard-class</dt>
                <dd className="text-lg font-extrabold text-[#0F1115]">{money(referenceExample.yardTotal)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#0F1115]/50">DFW broker-delivered</dt>
                <dd className="text-lg font-extrabold text-[#0F1115]">{money(referenceExample.brokerTotal)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-[#0F1115]/50">MyGravelGuy (estimated)</dt>
                <dd className="text-lg font-extrabold text-[#0F1115]">{money(referenceExample.mggTotal)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#0F1115]">Methodology</h2>
          <p className="text-sm text-[#0F1115]/70">{methodology.intro}</p>
          <div className="space-y-4">
            {methodology.sections.map(section => (
              <div key={section.heading}>
                <h3 className="font-bold text-[#0F1115]">{section.heading}</h3>
                <p className="mt-1 text-sm text-[#0F1115]/70">{section.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#0F1115]">Long Island reference pricing</h2>
          <p className="text-sm text-[#0F1115]/70">
            MyGravelGuy's Long Island pilot is fulfilled by a single signed partner yard, not a multi-seller market, so this
            table is shown separately from the DFW index above.
          </p>
          <LongIslandReferenceTable />
        </section>

        <section className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-extrabold text-[#0F1115]">How to cite this index</h2>
          <p className="text-sm text-[#0F1115]/70">
            This index is published under a {citation.license} license — reuse the figures with attribution and a link back
            to this page. Suggested citation:
          </p>
          <p className="rounded-md bg-[#F2F1EA] p-3 font-mono text-xs text-[#0F1115]">{citation.text}</p>
          <p className="text-xs text-[#0F1115]/50">
            License: <a href={citation.licenseUrl} className="underline">{citation.license}</a>. Full dataset:{' '}
            <a href={costIndexMeta.csvUrl} className="underline" download>
              {costIndexMeta.csvUrl}
            </a>
          </p>
        </section>

        <FaqSection faqs={faqs} />

        <nav aria-label="More gravel driveway guides" className="space-y-6 border-t border-black/10 pt-8">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0F1115]/50">
              More gravel driveway guides
            </p>
            <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <li>
                <Link to="/gravel-driveways" className="text-[#0F1115] hover:underline">
                  Gravel Driveway Hub
                </Link>
              </li>
              <li>
                <Link to="/gravel-driveways/cost" className="text-[#0F1115] hover:underline">
                  Gravel Driveway Cost Guide
                </Link>
              </li>
              {GUIDE_SPOKES.filter(spoke => spoke.path !== '/gravel-driveways/cost').map(spoke => (
                <li key={spoke.path}>
                  <Link to={spoke.path} className="text-[#0F1115] hover:underline">
                    {spoke.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <p className="mb-3 text-sm font-bold text-[#0F1115]">Order gravel in your metro</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/dallas-fort-worth/gravel${CATEGORY_ROUTE_SUFFIX}`}
                className="rounded-md bg-[#0F1115] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F1115]/85"
              >
                Order in Dallas-Fort Worth
              </Link>
              <Link
                to={`/long-island/gravel${CATEGORY_ROUTE_SUFFIX}`}
                className="rounded-md border border-[#0F1115]/20 px-4 py-2 text-sm font-bold text-[#0F1115] hover:bg-[#F2F1EA]"
              >
                Order on Long Island
              </Link>
            </div>
          </div>
        </nav>
      </article>
    </GuidesLayout>
  );
}
