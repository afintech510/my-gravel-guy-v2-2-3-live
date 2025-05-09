
import React from 'react';
import { Check } from 'lucide-react';

interface TrustFactorProps {
  title: string;
  description: string;
}

const TrustFactor: React.FC<TrustFactorProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-full bg-primary/10 p-1">
          <Check className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-base">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

const TrustBuildingSection: React.FC = () => {
  const trustFactors = [
    {
      title: 'Dedicated Service',
      description: 'Personalized support throughout your entire project journey.'
    },
    {
      title: 'Accurate Quantities',
      description: 'Our calculator ensures you order exactly what you need.'
    },
    {
      title: 'Streamlined Shopping',
      description: 'Simple ordering process from selection to checkout.'
    },
    {
      title: 'Free, Direct Delivery',
      description: 'Materials delivered straight to your project site.'
    },
    {
      title: 'Exceptional Quality',
      description: 'Premium materials sourced from trusted suppliers.'
    },
    {
      title: 'Choice of Materials',
      description: 'Wide variety of products for any landscaping need.'
    }
  ];

  return (
    <div className="mt-16 mb-12 bg-gray-50 rounded-lg p-6 border border-gray-100">
      <h2 className="text-2xl font-semibold text-center mb-8">Why Choose My Gravel Guy</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {trustFactors.map((factor, index) => (
          <TrustFactor
            key={index}
            title={factor.title}
            description={factor.description}
          />
        ))}
      </div>
    </div>
  );
};

export default TrustBuildingSection;
