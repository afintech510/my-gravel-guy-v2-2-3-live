import React from 'react';
import { MapPin, Building, TrendingUp } from 'lucide-react';

const trustPoints = [
  {
    icon: MapPin,
    text: 'Used by contractors across 30+ states',
  },
  {
    icon: Building,
    text: 'Experience with residential, commercial & municipal projects',
  },
  {
    icon: TrendingUp,
    text: 'From 5-ton driveways to 10,000-ton road jobs',
  },
];

const TrustSection: React.FC = () => {
  return (
    <section className="py-16 bg-[#0a0c0f] border-y border-[rgba(255,255,255,0.1)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-montserrat font-extrabold text-2xl lg:text-3xl uppercase text-[#F5F7FA]">
            Trusted by Contractors, Property Managers & Builders Nationwide
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {trustPoints.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <item.icon className="w-6 h-6 text-[#BADF24]" />
              <span className="text-[#B7C0CC]">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[#B7C0CC]/60 text-xs mt-8">
          Availability and pricing vary by location and market conditions.
        </p>
      </div>
    </section>
  );
};

export default TrustSection;
