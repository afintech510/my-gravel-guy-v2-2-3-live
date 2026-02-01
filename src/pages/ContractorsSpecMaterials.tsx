import React, { useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import SpecHeroSection from '@/components/spec-materials-landing/SpecHeroSection';
import SpecTrustBar from '@/components/spec-materials-landing/SpecTrustBar';
import SpecReservationForm, { type SpecReservationFormHandle } from '@/components/spec-materials-landing/SpecReservationForm';
import SpecDocumentationSection from '@/components/spec-materials-landing/SpecDocumentationSection';
import SpecMaterialsGrid from '@/components/spec-materials-landing/SpecMaterialsGrid';
import SpecHowItWorks from '@/components/spec-materials-landing/SpecHowItWorks';
import SpecFAQSection from '@/components/spec-materials-landing/SpecFAQSection';
import SpecFinalCTA from '@/components/spec-materials-landing/SpecFinalCTA';
import SpecStickyCTA from '@/components/spec-materials-landing/SpecStickyCTA';

const ContractorsSpecMaterials: React.FC = () => {
  const formRef = useRef<SpecReservationFormHandle>(null);

  const scrollToForm = () => {
    formRef.current?.scrollToForm();
  };

  const handleMaterialSelect = (material: string) => {
    formRef.current?.setMaterial(material);
  };

  return (
    <>
      <Helmet>
        <title>Spec Materials Delivery | #57 Stone, Road Base, RCA | MyGravelGuy</title>
        <meta 
          name="description" 
          content="DOT-grade aggregate delivery for contractors. #57 stone, road base, RCA, stone dust. Tickets, PO support, multi-site coordination. 20-1000+ tons." 
        />
        <link rel="canonical" href="https://mygravelguy.com/contractors-spec-materials" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Spec Materials Delivery for Contractors | MyGravelGuy" />
        <meta property="og:description" content="DOT-grade aggregate delivery with documentation, PO support, and multi-site coordination." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mygravelguy.com/contractors-spec-materials" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spec Materials Delivery | MyGravelGuy" />
        <meta name="twitter:description" content="DOT-grade aggregate delivery for contractors." />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Spec Materials Delivery",
            "provider": {
              "@type": "LocalBusiness",
              "name": "MyGravelGuy",
              "url": "https://mygravelguy.com"
            },
            "description": "DOT-grade aggregate delivery for construction contractors. #57 stone, road base, RCA, stone dust with tickets, PO support, and multi-site coordination.",
            "areaServed": {
              "@type": "Country",
              "name": "United States"
            },
            "serviceType": "Aggregate Delivery"
          }
        `}</script>
      </Helmet>

      <div className="min-h-screen bg-[#0F1115]">
        <SpecHeroSection onScrollToForm={scrollToForm} />
        <SpecTrustBar />
        <SpecReservationForm ref={formRef} />
        <SpecDocumentationSection />
        <SpecMaterialsGrid onSelectMaterial={handleMaterialSelect} />
        <SpecHowItWorks />
        <SpecFAQSection />
        <SpecFinalCTA onScrollToForm={scrollToForm} />
      </div>

      <SpecStickyCTA onScrollToForm={scrollToForm} />
    </>
  );
};

export default ContractorsSpecMaterials;
