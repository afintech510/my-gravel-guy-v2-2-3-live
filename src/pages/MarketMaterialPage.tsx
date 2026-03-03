import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import NotFound from './NotFound';
import MarketHero from '@/components/market-landing/MarketHero';
import OrderModule from '@/components/market-landing/OrderModule';
import ManagedQuoteModule from '@/components/market-landing/ManagedQuoteModule';
import ContentSections from '@/components/market-landing/ContentSections';
import StickyCTAMobile from '@/components/market-landing/StickyCTAMobile';
import { resolveMarketMaterialPage, getMaterialDisplayName } from '@/services/marketMaterialService';
import { trackMarketLandingView, captureAndStoreUTMParams } from '@/utils/analytics';
import type { MarketMaterialResolution, OrderModuleState } from '@/components/market-landing/types';
import { Loader2 } from 'lucide-react';

export default function MarketMaterialPage() {
  const { marketSlug, materialSlug } = useParams<{ marketSlug: string; materialSlug: string }>();
  const [resolution, setResolution] = useState<MarketMaterialResolution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const hasDispatchedPrerenderEvent = useRef(false);
  const orderModuleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureAndStoreUTMParams();
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      if (!marketSlug || !materialSlug) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const result = await resolveMarketMaterialPage(marketSlug, materialSlug);

      if (!result) {
        setNotFound(true);
      } else {
        setResolution(result);
        
        // Track page view
        trackMarketLandingView(
          result.canonicalMarketSlug,
          result.canonicalMaterialSlug,
          getMaterialDisplayName(result.pageData, result.product),
          result.pageData.market_display_name
        );
      }

      setIsLoading(false);
    };

    loadPage();
  }, [marketSlug, materialSlug]);

  // Dispatch prerender-ready event once
  useEffect(() => {
    if (!isLoading && !hasDispatchedPrerenderEvent.current) {
      hasDispatchedPrerenderEvent.current = true;
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new Event('prerender-ready'));
      }
    }
  }, [isLoading]);

  const scrollToOrderModule = () => {
    orderModuleRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !resolution) {
    return <NotFound />;
  }

  const { market, product, pageData, canonicalMarketSlug, canonicalMaterialSlug, isMarketAlias } = resolution;
  const materialName = getMaterialDisplayName(pageData, product);
  const canonicalUrl = `https://mygravelguy.com/markets/${canonicalMarketSlug}/materials/${canonicalMaterialSlug}`;

  return (
    <>
      <Helmet>
        <title>{pageData.seo_title || `${materialName} Delivery in ${pageData.market_display_name} | MyGravelGuy`}</title>
        <meta name="description" content={pageData.seo_description || `Order ${materialName} for delivery in ${pageData.market_display_name}. 20-500 tons available with expedited delivery options.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageData.seo_title || `${materialName} Delivery in ${pageData.market_display_name} | MyGravelGuy`} />
        <meta property="og:description" content={pageData.seo_description || `Order ${materialName} for delivery in ${pageData.market_display_name}. 20-500 tons available with expedited delivery options.`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:image" content={product?.image_url || 'https://mygravelguy.com/og-image.png'} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": `${materialName} - ${pageData.market_display_name}`,
            "description": pageData.seo_description || `Order ${materialName} for delivery in ${pageData.market_display_name}.`,
            "url": canonicalUrl,
            "image": product?.image_url || undefined,
            "brand": {
              "@type": "Brand",
              "name": "My Gravel Guy"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "36",
              "bestRating": "5",
              "worstRating": "1"
            },
            "review": {
              "@type": "Review",
              "author": { "@type": "Person", "name": "Jake" },
              "datePublished": "2025-12-15",
              "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
              "name": "Great experience!",
              "reviewBody": "The delivery was fast and the material was clean. Worked perfectly for my yard project."
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "priceValidUntil": `${new Date().getFullYear()}-12-31`,
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "My Gravel Guy"
              },
              "areaServed": {
                "@type": "City",
                "name": pageData.market_display_name
              },
              "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": "0",
                  "currency": "USD"
                },
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "US"
                },
                "deliveryTime": {
                  "@type": "ShippingDeliveryTime",
                  "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
                  "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" }
                }
              },
              "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "US",
                "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
                "merchantReturnDays": 0
              }
            }
          })}
        </script>
      </Helmet>

      <main className="pb-24 md:pb-0">
        <MarketHero pageData={pageData} product={product} market={market} />

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <ContentSections pageData={pageData} product={product} market={market} />
            </div>

            {/* Sidebar - Order Modules */}
            <div className="space-y-6" ref={orderModuleRef}>
              <OrderModule 
                pageData={pageData} 
                product={product} 
                canonicalMarketSlug={canonicalMarketSlug}
              />
              <ManagedQuoteModule 
                pageData={pageData} 
                product={product}
                canonicalMarketSlug={canonicalMarketSlug}
              />
            </div>
          </div>
        </div>
      </main>

      <StickyCTAMobile 
        product={product} 
        minTons={pageData.min_tons} 
        onOrderClick={scrollToOrderModule}
      />
    </>
  );
}
