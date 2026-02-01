import React from 'react';
import { trackSpecLPView } from '../../utils/analytics';

interface SpecHeroSectionProps {
  onScrollToForm: () => void;
}

const SpecHeroSection: React.FC<SpecHeroSectionProps> = ({ onScrollToForm }) => {
  React.useEffect(() => {
    trackSpecLPView();
  }, []);

  const trustBadges = [
    'Tickets + Documentation',
    'PO / Invoicing Support',
    '20-1,000+ Tons',
    'Multi-Site Coordination',
    'Vetted Supplier Network',
  ];

  return (
    <section className="relative bg-[#0F1115] pt-[72px] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23BADF24' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#BADF24]/10 border border-[#BADF24]/30 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 bg-[#BADF24] rounded-full animate-pulse" />
            <span className="text-[#BADF24] text-sm font-medium">
              Serving DOT, Civil & Utility Projects Nationwide
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F5F7FA] leading-tight">
            Spec Materials. On-Time Delivery.{' '}
            <span className="text-[#BADF24]">One Point of Contact.</span>
          </h1>

          <p className="text-xl text-[#B7C0CC] leading-relaxed max-w-2xl mx-auto">
            Nationwide sourcing + dispatch coordination for DOT, civil, and utility projects. 
            Documentation included.
          </p>

          {/* Feature List */}
          <ul className="flex flex-wrap justify-center gap-6 pt-2">
            {[
              'Regional DOT-grade sourcing',
              'Delivery tickets + scale slips',
              'Same-day response on expedite',
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#BADF24] flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[#F5F7FA]">{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={onScrollToForm}
              className="bg-[#BADF24] text-[#0F1115] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all hover:shadow-lg hover:shadow-[#BADF24]/20"
            >
              Price & Reserve Delivery
            </button>
            <button
              onClick={onScrollToForm}
              className="border-2 border-[#F5F7FA] text-[#F5F7FA] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#F5F7FA] hover:text-[#0F1115] transition-all"
            >
              Request a Quote / Send Specs
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            {trustBadges.map((badge, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 bg-[#151A22] border border-[rgba(255,255,255,0.10)] px-4 py-2 rounded-full text-sm text-[#B7C0CC]"
              >
                <span className="w-2 h-2 bg-[#BADF24] rounded-full" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecHeroSection;
