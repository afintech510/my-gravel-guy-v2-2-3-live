import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle } from 'lucide-react';
import ContactQuoteForm from '@/components/contact/ContactQuoteForm';
import HowItWorksSection from '@/components/contact/HowItWorksSection';
import WhyContractorsSection from '@/components/contact/WhyContractorsSection';
import TrustSection from '@/components/contact/TrustSection';
import ContactFAQ from '@/components/contact/ContactFAQ';
import ContactInfoBar from '@/components/contact/ContactInfoBar';

const trustBadges = [
  'Nationwide Supplier Network',
  'Contractor-Friendly',
  'Transparent Delivered Pricing',
  'Real Humans, Not Call Centers',
];

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Get a Quote | Aggregate Sourcing & Delivery | MyGravelGuy</title>
        <meta
          name="description"
          content="Get delivered pricing on gravel, stone, sand, and base materials from vetted local suppliers. One request, fast response, no hassle."
        />
        <meta
          name="keywords"
          content="gravel quote, aggregate delivery, stone pricing, bulk material delivery, contractor materials"
        />
        <link rel="canonical" href="https://mygravelguy.com/contact" />
        <meta property="og:title" content="Get a Quote | Aggregate Sourcing & Delivery | MyGravelGuy" />
        <meta property="og:description" content="Get delivered pricing on gravel, stone, sand, and base materials from vetted local suppliers. One request, fast response, no hassle." />
        <meta property="og:url" content="https://mygravelguy.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mygravelguy.com/og-image.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Get a Quote - My Gravel Guy",
            "url": "https://mygravelguy.com/contact",
            "mainEntity": {
              "@type": "Organization",
              "name": "My Gravel Guy",
              "url": "https://mygravelguy.com",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "sales",
                "availableLanguage": "English",
                "url": "https://mygravelguy.com/contact"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA]">
        {/* Hero Section with Form */}
        <section className="pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">
              {/* Left: Hero Content */}
              <div className="lg:sticky lg:top-24">
                <h1 className="font-montserrat font-extrabold text-4xl lg:text-[52px] leading-[1.1] uppercase tracking-tight mb-6">
                  Nationwide Aggregate Sourcing & Delivery — Made Simple
                </h1>
                <p className="text-xl text-[#B7C0CC] mb-8 max-w-[520px]">
                  We source, price, and deliver gravel, stone, sand, and base materials from trusted local suppliers — saving you time, calls, and guesswork.
                </p>

                {/* Trust Signals */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                  {trustBadges.map((badge, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#BADF24] flex-shrink-0" />
                      <span className="text-sm text-[#F5F7FA]">{badge}</span>
                    </div>
                  ))}
                </div>

                {/* Contact Info - Desktop Only */}
                <div className="hidden lg:block">
                  <div className="bg-[#151A22] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
                    <h3 className="font-semibold text-[#F5F7FA] mb-4">Prefer to talk?</h3>
                    <div className="space-y-3">
                      <p className="text-[#B7C0CC]">
                        <span className="text-[#BADF24]">Phone:</span>{' '}
                        <a href="tel:+18446240400" className="hover:text-[#BADF24]">(844) 624-0400</a>
                      </p>
                      <p className="text-[#B7C0CC]">
                        <span className="text-[#BADF24]">Email:</span>{' '}
                        <a href="mailto:support@mygravelguy.com" className="hover:text-[#BADF24]">support@mygravelguy.com</a>
                      </p>
                      <p className="text-[#B7C0CC] text-sm">
                        Mon-Fri 8am-5pm ET • Sat 8am-1pm ET
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div>
                <ContactQuoteForm />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <HowItWorksSection />

        {/* Why Contractors Section */}
        <WhyContractorsSection />

        {/* Trust Section */}
        <TrustSection />

        {/* FAQ Section */}
        <ContactFAQ />

        {/* Contact Info Bar */}
        <ContactInfoBar />

        {/* Sticky Mobile CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0F1115] border-t border-[rgba(255,255,255,0.1)] p-4 z-50">
          <a
            href="#quote-form"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="block w-full bg-[#BADF24] text-[#0F1115] py-4 rounded-lg font-bold text-center"
          >
            Get My Quote
          </a>
        </div>
      </div>
    </>
  );
};

export default Contact;
