import React from 'react';

interface FinalCTASectionProps {
  onGetQuote: () => void;
  onOrderInstantly: () => void;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onGetQuote, onOrderInstantly }) => {
  return (
    <section className="bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#F5F7FA] mb-6">
          Ready to simplify your{' '}
          <span className="text-[#BADF24]">aggregate sourcing?</span>
        </h2>
        <p className="text-xl text-[#B7C0CC] mb-10 max-w-2xl mx-auto">
          Get a fast quote or order instantly. We'll handle the rest.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGetQuote}
            className="bg-[#BADF24] text-[#0F1115] px-10 py-5 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all hover:shadow-lg hover:shadow-[#BADF24]/20"
          >
            Get a Quote
          </button>
          <button
            onClick={onOrderInstantly}
            className="border-2 border-[#F5F7FA] text-[#F5F7FA] px-10 py-5 rounded-lg font-bold text-lg hover:bg-[#F5F7FA] hover:text-[#0F1115] transition-all"
          >
            Order Instantly
          </button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {['Nationwide Coverage', 'Fast Turnarounds', 'Volume Pricing'].map((badge, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 text-[#B7C0CC]"
            >
              <svg
                className="w-5 h-5 text-[#BADF24]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
