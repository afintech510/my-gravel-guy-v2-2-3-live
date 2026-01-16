import React from 'react';
import { Layers, Mountain, Package, Building2 } from 'lucide-react';

const MaterialsSection: React.FC = () => {
  const materials = [
    { name: '#57 Stone / Drainage Rock', description: 'Ideal for drainage and base layers.', icon: Layers },
    { name: 'Road Base / ABC Stone', description: 'Compactible base for roads and pads.', icon: Mountain },
    { name: 'Mason Sand / Concrete Sand', description: 'Fine aggregate for masonry and concrete.', icon: Package },
    { name: 'Fill / Structural Aggregate', description: 'Bulk material for site prep.', icon: Building2 },
  ];

  return (
    <section id="materials" className="bg-[#151A22] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Materials we <span className="text-[#BADF24]">source + deliver</span>
          </h2>
          <p className="text-lg text-[#B7C0CC]">Construction-grade aggregate for any project size.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {materials.map((material, index) => {
            const Icon = material.icon;
            return (
              <div key={index} className="bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-xl p-6 hover:border-[#BADF24]/30 transition-colors group text-center">
                <div className="w-16 h-16 bg-[#BADF24]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#BADF24]/20 transition-colors">
                  <Icon className="w-8 h-8 text-[#BADF24]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F5F7FA] mb-2">{material.name}</h3>
                <p className="text-[#B7C0CC] text-sm">{material.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MaterialsSection;
