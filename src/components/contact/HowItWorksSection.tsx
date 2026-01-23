import React from 'react';
import { FileText, MapPin, DollarSign, Truck } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    step: '01',
    title: 'Tell Us the Details',
    description: 'Submit your project info once — no chasing yards or truckers.',
  },
  {
    icon: MapPin,
    step: '02',
    title: 'We Source Locally',
    description: 'We match your job with vetted suppliers and trucks near your site.',
  },
  {
    icon: DollarSign,
    step: '03',
    title: 'Delivered Pricing',
    description: 'You get a clear delivered price based on distance, material, and timing.',
  },
  {
    icon: Truck,
    step: '04',
    title: 'Schedule & Deliver',
    description: 'We coordinate delivery so material shows up when you need it.',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 bg-[#0a0c0f] border-y border-[rgba(255,255,255,0.1)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-extrabold text-3xl lg:text-[40px] uppercase text-[#F5F7FA] mb-4">
            How MyGravelGuy Works
          </h2>
          <p className="text-[#B7C0CC] max-w-[600px] mx-auto">
            We're not a quarry — we're your sourcing & logistics partner for aggregate materials nationwide.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="bg-[#151A22] p-6 rounded-xl border border-[rgba(255,255,255,0.1)] relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#BADF24]/10 rounded-lg flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-[#BADF24]" />
                </div>
                <span className="text-[#BADF24] font-bold text-sm">{item.step}</span>
              </div>
              <h3 className="font-montserrat font-semibold text-lg text-[#F5F7FA] mb-2">
                {item.title}
              </h3>
              <p className="text-[#B7C0CC] text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
