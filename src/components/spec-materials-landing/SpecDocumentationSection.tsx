import React from 'react';
import { FileCheck, ClipboardList, Link2, Receipt, FileText } from 'lucide-react';

const SpecDocumentationSection: React.FC = () => {
  const docItems = [
    {
      icon: FileCheck,
      title: 'Delivery tickets / scale slips with every load',
    },
    {
      icon: ClipboardList,
      title: 'COA / gradation reports when available',
    },
    {
      icon: Link2,
      title: 'Chain of custody documentation where applicable',
    },
    {
      icon: Receipt,
      title: 'PO / net terms coordination',
    },
    {
      icon: FileText,
      title: 'Invoice handling',
    },
  ];

  return (
    <section className="bg-[#151A22] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Documentation & <span className="text-[#BADF24]">Compliance</span>
          </h2>
          <p className="text-lg text-[#B7C0CC] max-w-2xl mx-auto">
            We handle the paperwork so you can focus on the build.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {docItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-xl p-5 hover:border-[#BADF24]/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#BADF24]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#BADF24]/20 transition-colors">
                    <Icon className="w-5 h-5 text-[#BADF24]" />
                  </div>
                  <p className="text-[#F5F7FA] text-sm leading-tight">{item.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SpecDocumentationSection;
