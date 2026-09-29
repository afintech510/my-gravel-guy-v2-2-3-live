// JSON-LD builders for the Gravel Driveway Cost Index page. Kept local to costIndex/
// (rather than extending the shared src/content/guides/schema.ts, which this agent does
// not own) because this page needs a `Dataset` block the other guide spokes don't use.
// Reuses the same react-helmet-async + inline <script type="application/ld+json">
// pattern as the rest of the guide pages (see ../schema.ts, src/pages/MarketMaterialPage.tsx).
import { SITE_URL, guideCanonicalUrl } from '@/content/guides/schema';
import type { CostIndexRow } from './costIndexData';
import { costIndexMeta } from './costIndexData';
import { PATH, LAST_UPDATED, citation, h1, description } from './content';

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'MyGravelGuy',
  url: SITE_URL,
};

/** Real, verifiable operational attribution — same author convention as the rest of the
 * Gravel Driveway Hub (see src/content/guides/schema.ts's GUIDE_AUTHOR). */
const AUTHOR = {
  '@type': 'Organization',
  name: 'Eastern Landscape & Mason Supply yard team',
};

const canonical = guideCanonicalUrl(PATH);
const csvUrl = `${SITE_URL}${costIndexMeta.csvUrl}`;

/**
 * `Dataset` schema per Google's dataset structured-data guidelines
 * (https://developers.google.com/search/docs/appearance/structured-data/dataset).
 * Required: name, description (50-5000 chars). Recommended fields populated below:
 * url, creator, license, distribution, temporalCoverage, spatialCoverage,
 * variableMeasured, keywords. NOT populated: `identifier` (no DOI/compact identifier
 * exists for this dataset) and `citation` (Google's own guidance is that this property
 * is for citing *related academic publications*, not for how to cite this dataset
 * itself — the on-page "How to cite this index" block covers that instead; see
 * docs/metro/research/cost-index.md for this call).
 */
export const costIndexDatasetJsonLd = (rows: CostIndexRow[]) => ({
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Gravel Driveway Cost Index: Dallas–Fort Worth, TX',
  description,
  url: canonical,
  creator: ORGANIZATION,
  publisher: ORGANIZATION,
  license: citation.licenseUrl,
  temporalCoverage: `${costIndexMeta.sampleStartDate}/${costIndexMeta.sampleEndDate}`,
  spatialCoverage: {
    '@type': 'Place',
    name: 'Dallas–Fort Worth, TX',
  },
  keywords: [
    'gravel driveway cost',
    'DFW gravel prices',
    'Dallas Fort Worth landscaping materials',
    'crushed limestone price',
    'mulch price DFW',
    'delivered gravel price',
  ],
  variableMeasured: rows.map(row => ({
    '@type': 'PropertyValue',
    name: `${row.name} price per ${row.unit}`,
    unitText: `USD per ${row.unit}`,
  })),
  distribution: {
    '@type': 'DataDownload',
    contentUrl: csvUrl,
    encodingFormat: 'text/csv',
  },
  dateModified: LAST_UPDATED,
});

/** `Article` narrative wrapper around the Dataset, matching the other guide spokes'
 * Article convention (see ../schema.ts's guideArticleJsonLd) for E-E-A-T consistency. */
export const costIndexArticleJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: h1,
  description,
  author: AUTHOR,
  publisher: ORGANIZATION,
  datePublished: '2026-09-28',
  dateModified: LAST_UPDATED,
  mainEntityOfPage: canonical,
  url: canonical,
});
