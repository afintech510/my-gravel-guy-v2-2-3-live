import React from 'react';
import { Layers, Recycle, Mountain, Droplet, CircleDot, Waves, Container } from 'lucide-react';
import { trackSpecMaterialSelect } from '@/utils/analytics';

interface SpecMaterialsGridProps {
  onSelectMaterial: (material: string) => void;
}

const SpecMaterialsGrid: React.FC<SpecMaterialsGridProps> = ({ onSelectMaterial }) => {
  const materials = [
    {
      id: '#57-stone',
      name: '#57 Stone (ASTM/DOT-grade)',
      useCase: 'Drainage, base layers, French drains',
      specNote: 'ASTM C33 / DOT-grade where applicable',
      icon: Layers,
    },
    {
      id: 'rca',
      name: 'RCA - Recycled Concrete Aggregate',
      useCase: 'Sub-base, fills, sustainable builds',
      specNote: 'Acceptance varies by jurisdiction—send your spec',
      icon: Recycle,
    },
    {
      id: 'road-base',
      name: 'Dense Graded Base / Road Base',
      useCase: 'Roads, parking pads, foundations',
      specNote: 'Item 4/304/ABC—confirm regional spec',
      icon: Mountain,
    },
    {
      id: 'stone-dust',
      name: 'Stone Dust / Crusher Fines',
      useCase: 'Paver base, joint fill, compaction',
      specNote: 'Also called "screenings" or "crusher fines"',
      icon: Droplet,
    },
    {
      id: '#8-stone',
      name: '#8 Stone (Pipe Bedding)',
      useCase: 'Pipe bedding, utility trenches',
      specNote: 'Per ASTM C33 gradation',
      icon: CircleDot,
    },
    {
      id: '#89-stone',
      name: '#89 Stone (Utility/Drainage)',
      useCase: 'Drainage, utilities, backfill',
      specNote: 'Utility/drainage spec applications',
      icon: Waves,
    },
    {
      id: 'utility-sand',
      name: 'Utility Sand (Spec-Only)',
      useCase: 'Bedding, backfill',
      specNote: 'Requires spec confirmation',
      icon: Container,
    },
  ];

  const handleSelect = (materialName: string) => {
    trackSpecMaterialSelect(materialName);
    onSelectMaterial(materialName);
  };

  return (
    <section id="materials" className="bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Spec-Forward <span className="text-[#BADF24]">Materials</span>
          </h2>
          <p className="text-lg text-[#B7C0CC]">
            Construction-grade aggregate sourced to match your project requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((material) => {
            const Icon = material.icon;
            return (
              <div
                key={material.id}
                className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-xl p-6 hover:border-[#BADF24]/30 transition-all group flex flex-col"
              >
                <div className="w-14 h-14 bg-[#BADF24]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#BADF24]/20 transition-colors">
                  <Icon className="w-7 h-7 text-[#BADF24]" />
                </div>
                
                <h3 className="text-lg font-semibold text-[#F5F7FA] mb-2">
                  {material.name}
                </h3>
                
                <p className="text-[#B7C0CC] text-sm mb-2 flex-grow">
                  {material.useCase}
                </p>
                
                <p className="text-[#BADF24]/70 text-xs italic mb-4">
                  {material.specNote}
                </p>
                
                <button
                  onClick={() => handleSelect(material.name)}
                  className="w-full mt-auto bg-[#BADF24]/10 text-[#BADF24] py-2.5 rounded-lg font-medium text-sm hover:bg-[#BADF24]/20 transition-colors"
                >
                  Select in Checkout
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpecMaterialsGrid;
