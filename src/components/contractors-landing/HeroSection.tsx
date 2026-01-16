import React from 'react';
import QuoteForm from './QuoteForm';

interface HeroSectionProps {
  onOrderInstantly: () => void;
  onGetQuote: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onOrderInstantly, onGetQuote }) => {
  const trustBadges = [
    'Nationwide Coverage',
    'Construction-Grade Materials',
    'Fast Turnarounds',
    'PM-Friendly Coordination',
  ];

  return (
    <section
      id="quote"
      className="relative min-h-screen bg-[#0F1115] pt-[72px] overflow-hidden"
    >
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#BADF24]/10 border border-[#BADF24]/30 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-[#BADF24] rounded-full animate-pulse" />
              <span className="text-[#BADF24] text-sm font-medium">
                Serving Construction Teams Nationwide
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F5F7FA] leading-tight">
              Aggregate delivery for{' '}
              <span className="text-[#BADF24]">construction pros</span>
            </h1>

            <p className="text-xl text-[#B7C0CC] leading-relaxed max-w-xl">
              One vendor for gravel, sand, base, and fill—sourced and delivered
              anywhere in the U.S.
            </p>

            {/* Feature List */}
            <ul className="space-y-4">
              {[
                'Sourced from regional distribution hubs',
                'Hauling + logistics handled for you',
                'Fast turnarounds—even for large volume',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#BADF24] flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[#F5F7FA] text-lg">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetQuote}
                className="bg-[#BADF24] text-[#0F1115] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all hover:shadow-lg hover:shadow-[#BADF24]/20"
              >
                Get a Quote
              </button>
              <button
                onClick={onOrderInstantly}
                className="border-2 border-[#F5F7FA] text-[#F5F7FA] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#F5F7FA] hover:text-[#0F1115] transition-all"
              >
                Order Instantly
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
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

          {/* Right Column - Form */}
          <div className="lg:sticky lg:top-24">
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
