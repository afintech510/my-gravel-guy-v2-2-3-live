import React from 'react';
import { HardHat, Building, BarChart3, Globe } from 'lucide-react';

const BuiltForSection: React.FC = () => {
  const audiences = [
    {
      title: 'General Contractors',
      description: 'Multi-trade teams managing large-scale builds.',
      icon: HardHat,
    },
    {
      title: 'Site Work & Excavation Contractors',
      description: 'Crews handling grading, drainage, and foundations.',
      icon: Building,
    },
    {
      title: 'Sports Courts & Athletic Facilities',
      description: 'Quality aggregate for courts, tracks, and facilities.',
      icon: BarChart3,
    },
    {
      title: 'Regional & National Construction Teams',
      description: 'One vendor for multi-site projects across the country.',
      icon: Globe,
    },
  ];

  return (
    <section className="bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Built for <span className="text-[#BADF24]">construction pros</span>
          </h2>
          <p className="text-lg text-[#B7C0CC]">
            We serve teams who need reliable aggregate on tight timelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <div
                key={index}
                className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-xl p-6 hover:border-[#BADF24]/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#BADF24]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#BADF24]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#BADF24]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#F5F7FA] mb-1">
                      {audience.title}
                    </h3>
                    <p className="text-[#B7C0CC]">{audience.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-2xl font-bold text-[#F5F7FA]">
            One vendor. <span className="text-[#BADF24]">Every market.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default BuiltForSection;
