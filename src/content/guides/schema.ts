// JSON-LD builders for guide pages. Reuses the existing react-helmet-async +
// inline <script type="application/ld+json"> pattern already used elsewhere in the
// repo (see src/pages/MarketMaterialPage.tsx, src/metro/components/shared/jsonLd.ts).
import type { GuideContent } from './types';

export const SITE_URL = 'https://mygravelguy.com';

export const guideCanonicalUrl = (path: string): string => `${SITE_URL}${path}`;

/** Author/organization block shared by every guide's Article schema — real, not invented. */
const GUIDE_AUTHOR = {
  '@type': 'Organization',
  name: 'Eastern Landscape & Mason Supply yard team',
};

const PUBLISHER = {
  '@type': 'Organization',
  name: 'MyGravelGuy',
  url: SITE_URL,
};

/** Article schema for every guide spoke (not the hub, which uses CollectionPage instead). */
export const guideArticleJsonLd = (content: GuideContent) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: content.h1,
  description: content.description,
  author: GUIDE_AUTHOR,
  publisher: PUBLISHER,
  datePublished: '2026-09-28',
  dateModified: content.lastUpdated,
  mainEntityOfPage: guideCanonicalUrl(content.path),
  url: guideCanonicalUrl(content.path),
});

/** HowTo schema — only for genuinely step-based guides (maintenance). */
export const guideHowToJsonLd = (content: GuideContent) => {
  if (!content.howToSteps?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: content.h1,
    description: content.description,
    step: content.howToSteps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
};

/** CollectionPage schema for the hub, linking out to every spoke. */
export const guideCollectionPageJsonLd = (content: GuideContent, spokes: GuideContent[]) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: content.h1,
  description: content.description,
  url: guideCanonicalUrl(content.path),
  hasPart: spokes.map(spoke => ({
    '@type': 'Article',
    name: spoke.h1,
    url: guideCanonicalUrl(spoke.path),
  })),
});
