import React from 'react';
import { FileText, Search, Calendar, ClipboardCheck, Truck } from 'lucide-react';

const SpecHowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Tell us material + tons + site',
      description: 'Submit your order details with delivery address and preferred schedule',
      icon: FileText,
    },
    {
      number: '02',
      title: 'We source + confirm spec match',
      description: 'Regional supplier validation to match your project requirements',
      icon: Search,
    },
    {
      number: '03',
      title: 'Delivery scheduling + dispatch',
      description: 'Coordinated logistics with clear communication on timing',
      icon: Calendar,
    },
    {
      number: '04',
      title: 'Tickets/docs + invoice/PO handling',
      description: 'Full documentation provided with every delivery',
      icon: ClipboardCheck,
    },
    {
      number: '05',
      title: 'Material arrives on-site',
      description: 'Reliable, on-time delivery to your job site',
      icon: Truck,
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            How It <span className="text-[#BADF24]">Works</span>
          </h2>
          <p className="text-lg text-[#B7C0CC]">
            Procurement simplified—from request to delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-xl p-6 hover:border-[#BADF24]/30 transition-colors group"
              >
                {/* Connector Line (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 w-6 h-0.5 bg-[#BADF24]/30" />
                )}

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-[#BADF24]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#BADF24]/20 transition-colors">
                    <Icon className="w-7 h-7 text-[#BADF24]" />
                  </div>
                  
                  <span className="text-[#BADF24] font-bold text-sm mb-2">
                    {step.number}
                  </span>
                  
                  <h3 className="text-lg font-semibold text-[#F5F7FA] mb-2">
                    {step.title}
                  </h3>
                  
                  <p className="text-[#B7C0CC] text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpecHowItWorks;
