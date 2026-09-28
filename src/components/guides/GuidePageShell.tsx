import { Helmet } from 'react-helmet-async';
import type { ReactNode } from 'react';
import type { GuideContent } from '@/content/guides/types';
import { GUIDE_SPOKES } from '@/content/guides';
import {
  guideArticleJsonLd,
  guideCollectionPageJsonLd,
  guideHowToJsonLd,
  guideCanonicalUrl,
  SITE_URL,
} from '@/content/guides/schema';
import { breadcrumbJsonLd, type BreadcrumbEntry } from '@/metro/components/shared/jsonLd';
import { FaqSection, faqJsonLd } from '@/metro/components/marketing/FaqSection';
import { DirectAnswerBlock } from '@/metro/components/marketing/DirectAnswerBlock';
import { GuidesLayout } from './GuidesLayout';
import { Breadcrumbs } from './Breadcrumbs';
import { SpokeNav } from './SpokeNav';

export interface GuidePageShellProps {
  content: GuideContent;
  /** 'collection' is used only by the hub page (CollectionPage schema instead of Article). */
  schemaType?: 'article' | 'collection';
  children?: ReactNode;
}

/** Shared shell for every Gravel Driveway Hub page: Helmet SEO tags, BreadcrumbList +
 * Article/CollectionPage/HowTo/FAQPage JSON-LD, the H1 + DirectAnswerBlock + "Last
 * updated"/"How we know" header, page-specific body (children), FAQs, and sibling nav. */
export function GuidePageShell({ content, schemaType = 'article', children }: GuidePageShellProps) {
  const canonical = guideCanonicalUrl(content.path);
  const breadcrumbItems: BreadcrumbEntry[] = [
    { name: 'Home', url: SITE_URL },
    { name: 'Gravel Driveways', url: guideCanonicalUrl('/gravel-driveways') },
    ...(content.slug ? [{ name: content.navLabel, url: canonical }] : []),
  ];

  const breadcrumb = breadcrumbJsonLd(breadcrumbItems);
  const article = schemaType === 'article' ? guideArticleJsonLd(content) : null;
  const collection = schemaType === 'collection' ? guideCollectionPageJsonLd(content, GUIDE_SPOKES) : null;
  const howTo = guideHowToJsonLd(content);

  const lastUpdatedDisplay = new Date(`${content.lastUpdated}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <GuidesLayout>
      <Helmet>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        {article && <script type="application/ld+json">{JSON.stringify(article)}</script>}
        {collection && <script type="application/ld+json">{JSON.stringify(collection)}</script>}
        {howTo && <script type="application/ld+json">{JSON.stringify(howTo)}</script>}
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(content.faqs))}</script>
      </Helmet>

      <Breadcrumbs items={breadcrumbItems} />

      <article className="space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-extrabold leading-tight text-[#0F1115] md:text-4xl">{content.h1}</h1>
          <DirectAnswerBlock>{content.directAnswer}</DirectAnswerBlock>
          <p className="text-xs text-[#0F1115]/50">
            Last updated {lastUpdatedDisplay}. <span className="italic">{content.howWeKnow}</span>
          </p>
        </header>

        {children}

        <FaqSection faqs={content.faqs} />

        <SpokeNav currentPath={content.path} />
      </article>
    </GuidesLayout>
  );
}
