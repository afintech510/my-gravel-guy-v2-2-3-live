
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ShopContentBlockProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  className?: string;
}

const ShopContentBlock = ({ icon, title, subtitle, description, className = "" }: ShopContentBlockProps) => {
  return (
    <div className={`bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-lg font-semibold text-primary mb-4">{subtitle}</p>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default ShopContentBlock;
