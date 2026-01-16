import React from 'react';
import { Search, Calculator, Truck } from 'lucide-react';

const CredibilitySection: React.FC = () => {
  const features = [
    {
      title: 'Sourcing Specialists',
      description: 'We already know the yards, quarries, and carriers.',
      icon: Search,
    },
    {
      title: 'Transparent Pricing',
      description: 'Clear line items and fast confirmations.',
      icon: Calculator,
    },
    {
      title: 'Reliable Coordination',
      description: 'We manage the logistics so your crew stays on schedule.',
      icon: Truck,
    },
  ];

  return (
    <section className="bg-[#151A22] py-16 md:py-24 relative overflow-hidden">
      {/* Accent Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#BADF24] to-transparent" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23BADF24' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Why construction teams{' '}
            <span className="text-[#BADF24]">trust us</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-xl p-8 text-center hover:border-[#BADF24]/30 transition-colors group"
              >
                <div className="w-16 h-16 bg-[#BADF24]/10 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#BADF24]/20 transition-colors">
                  <Icon className="w-10 h-10 text-[#BADF24]" />
                </div>
                <h3 className="text-xl font-semibold text-[#F5F7FA] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#B7C0CC]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CredibilitySection;
