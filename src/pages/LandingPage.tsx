import React from 'react';
import { Helmet } from 'react-helmet-async';
import { LandingPageProvider } from '@/contexts/LandingPageContext';
import { HeroSection } from '@/components/landing/HeroSection';
import { ReactivePricingForm } from '@/components/landing/ReactivePricingForm';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { ConsultationSection } from '@/components/landing/ConsultationSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTA } from '@/components/landing/FinalCTA';

const LandingPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.mygravelguy.com/#organization",
        "name": "MyGravelGuy",
        "url": "https://www.mygravelguy.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.mygravelguy.com/logo.png"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+1-844-624-0400",
          "contactType": "customer service",
          "areaServed": "US"
        },
        "areaServed": {
          "@type": "Country",
          "name": "United States"
        },
        "serviceType": "Bulk gravel delivery"
      },
      {
        "@type": "Service",
        "name": "Bulk Gravel Delivery",
        "provider": {
          "@id": "https://www.mygravelguy.com/#organization"
        },
        "areaServed": {
          "@type": "Country",
          "name": "United States"
        },
        "serviceType": "Material delivery",
        "offers": {
          "@type": "Offer",
          "price": "199.00",
          "priceCurrency": "USD",
          "description": "Refundable deposit for gravel delivery reservation",
          "availability": "https://schema.org/InStock"
        }
      }
    ]
  };

  return (
    <LandingPageProvider>
      <Helmet>
        <title>Buy Gravel Online | Bulk Gravel, Topsoil & Dirt Delivery – MyGravelGuy.com</title>
        <meta 
          name="description" 
          content="Reserve bulk gravel, topsoil, and dirt online with a $199 refundable deposit. MyGravelGuy negotiates wholesale prices, confirms materials with photos, and arranges nationwide delivery." 
        />
        <meta name="keywords" content="buy gravel online, bulk gravel delivery, topsoil delivery, dirt delivery, wholesale gravel prices, crushed stone delivery" />
        <meta property="og:title" content="Buy Gravel Online | Bulk Gravel, Topsoil & Dirt Delivery" />
        <meta property="og:description" content="Reserve bulk gravel, topsoil, and dirt online with a $199 refundable deposit. Wholesale prices, photo confirmation, nationwide delivery." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mygravelguy.com/landing" />
        <link rel="canonical" href="https://www.mygravelguy.com/landing" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Reactive Pricing Form */}
        <section id="pricing-form" className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <ReactivePricingForm />
          </div>
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Free Consultation */}
        <ConsultationSection />

        {/* Services Add-On */}
        <ServicesSection />

        {/* Trust Section */}
        <TrustSection />

        {/* FAQ */}
        <FAQSection />

        {/* Final CTA */}
        <FinalCTA />
      </div>
    </LandingPageProvider>
  );
};

export default LandingPage;