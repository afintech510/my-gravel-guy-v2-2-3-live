
import React from 'react';
import { Truck, Award, Star, Clock } from 'lucide-react';

export default function TrustBanner() {
  const trustItems = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: 'Free Delivery',
      description: 'To all eligible locations'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Premium Quality',
      description: 'Sourced from trusted quarries'
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: '20+ Years Experience',
      description: 'Trusted by thousands'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Fast Service',
      description: 'Quick delivery times'
    }
  ];
  
  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Why Choose Us</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trustItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center p-3">
            <div className="mb-3 text-primary">
              {item.icon}
            </div>
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
