import React from 'react';

interface CompareSectionProps {
  onGetQuote: () => void;
  onOrderInstantly: () => void;
}

const CompareSection: React.FC<CompareSectionProps> = ({ onGetQuote, onOrderInstantly }) => {
  return (
    <section id="compare" className="bg-[#151A22] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Two ways to <span className="text-[#BADF24]">get started</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Instant Order Card */}
          <div className="bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8">
            <h3 className="text-xl font-bold text-[#F5F7FA] mb-4">Instant Order</h3>
            <p className="text-[#B7C0CC] mb-6">Quick orders under 25 tons with standard pricing.</p>
            <ul className="space-y-3 mb-8">
              {['Standard pricing', 'Fast checkout', 'Self-serve scheduling'].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-[#F5F7FA] text-sm">
                  <span className="w-4 h-4 bg-[#BADF24]/20 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-[#BADF24] rounded-full" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button onClick={onOrderInstantly} className="w-full border-2 border-[#BADF24] text-[#BADF24] py-4 rounded-lg font-bold text-lg hover:bg-[#BADF24] hover:text-[#0F1115] transition-all">
              Order Instantly
            </button>
          </div>
          {/* Managed Quote Card */}
          <div className="bg-[#0F1115] border-2 border-[#BADF24] rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-[#BADF24] text-[#0F1115] px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
            </div>
            <h3 className="text-xl font-bold text-[#F5F7FA] mb-4">Managed Quote</h3>
            <p className="text-[#B7C0CC] mb-6">For larger projects with volume pricing.</p>
            <ul className="space-y-3 mb-8">
              {['Dedicated sourcing specialist', 'Project-based pricing', 'Coordinated scheduling for multiple trucks'].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-[#F5F7FA] text-sm">
                  <span className="w-4 h-4 bg-[#BADF24]/20 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-[#BADF24] rounded-full" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button onClick={onGetQuote} className="w-full bg-[#BADF24] text-[#0F1115] py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all">
              Get a Quote
            </button>
          </div>
        </div>
        <p className="text-center text-[#B7C0CC] mt-8">
          Most construction PMs use <span className="text-[#BADF24] font-medium">Managed Quote</span> for better pricing on volume.
        </p>
      </div>
    </section>
  );
};

export default CompareSection;
