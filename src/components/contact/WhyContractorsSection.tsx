import React from 'react';
import { Clock, Globe, Headphones } from 'lucide-react';

const valueProps = [
  {
    icon: Clock,
    title: 'Save Time',
    description: 'One request replaces 5–10 phone calls to yards and truckers.',
  },
  {
    icon: Globe,
    title: 'Better Coverage',
    description: "Access suppliers and trucks you don't normally call.",
  },
  {
    icon: Headphones,
    title: 'Less Headaches',
    description: 'We coordinate material + delivery so you stay focused on the job.',
  },
];

const WhyContractorsSection: React.FC = () => {
  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-extrabold text-3xl lg:text-[40px] uppercase text-[#F5F7FA] mb-4">
            Why Contractors Use MyGravelGuy
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[#BADF24]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-8 h-8 text-[#BADF24]" />
              </div>
              <h3 className="font-montserrat font-semibold text-xl text-[#F5F7FA] mb-3">
                {item.title}
              </h3>
              <p className="text-[#B7C0CC]">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[#B7C0CC] text-sm mt-10 italic">
          Especially useful for out-of-area projects, tight schedules, or specialty materials.
        </p>
      </div>
    </section>
  );
};

export default WhyContractorsSection;
