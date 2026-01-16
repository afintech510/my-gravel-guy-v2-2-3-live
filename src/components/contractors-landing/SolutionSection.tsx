import React from 'react';
import { FileText, Search, CheckCircle } from 'lucide-react';

interface SolutionSectionProps {
  onGetQuote: () => void;
}

const SolutionSection: React.FC<SolutionSectionProps> = ({ onGetQuote }) => {
  const steps = [
    {
      number: '01',
      title: 'Send details',
      description: 'Material + quantity + delivery ZIP + date/time window',
      icon: FileText,
    },
    {
      number: '02',
      title: 'We source + schedule',
      description: 'We handle yards, quarries, and trucking coordination',
      icon: Search,
    },
    {
      number: '03',
      title: 'Material arrives on site',
      description: 'On-time delivery with clear communication',
      icon: CheckCircle,
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Copy */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA]">
              Tell us the spec.{' '}
              <span className="text-[#BADF24]">We deliver the material.</span>
            </h2>
            <p className="text-lg text-[#B7C0CC] leading-relaxed">
              We source construction-grade aggregate from regional distribution
              hubs and coordinate the haul—so your crew stays building.
            </p>
            <button
              onClick={onGetQuote}
              className="bg-[#BADF24] text-[#0F1115] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all hover:shadow-lg hover:shadow-[#BADF24]/20"
            >
              Get a Quote
            </button>
          </div>

          {/* Right Column - Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-xl p-6 hover:border-[#BADF24]/30 transition-colors group"
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[2.75rem] top-full w-0.5 h-6 bg-[#BADF24]/30" />
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-[#BADF24]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#BADF24]/20 transition-colors">
                      <Icon className="w-8 h-8 text-[#BADF24]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[#BADF24] font-bold text-sm">
                          {step.number}
                        </span>
                        <h3 className="text-xl font-semibold text-[#F5F7FA]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-[#B7C0CC]">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
