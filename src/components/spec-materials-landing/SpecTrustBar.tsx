import React from 'react';
import { FileText, Receipt, Scale, Truck, Shield } from 'lucide-react';

const SpecTrustBar: React.FC = () => {
  const trustItems = [
    { icon: FileText, label: 'Delivery Tickets' },
    { icon: Scale, label: 'Scale Slips' },
    { icon: Receipt, label: 'COA When Available' },
    { icon: Shield, label: 'PO/Net Terms' },
    { icon: Truck, label: 'Chain of Custody' },
  ];

  return (
    <section className="bg-[#151A22] border-y border-[rgba(255,255,255,0.10)] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 text-[#B7C0CC]"
              >
                <Icon className="w-5 h-5 text-[#BADF24]" />
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpecTrustBar;
