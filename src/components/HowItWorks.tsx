
import React from 'react';
import { Calculator, Package, Truck, Handshake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Package className="h-10 w-10 text-primary" />,
      title: "Choose Your Product",
      description: "Browse our selection of gravel, sand, and dirt. Select the perfect material for your project from our extensive catalog.",
      link: "/shop"
    },
    {
      icon: <Calculator className="h-10 w-10 text-primary" />,
      title: "Calculate How Many Tons",
      description: "Use our calculator to determine exactly how much material you need based on your project dimensions and depth requirements.",
      link: "/product-calculator"
    },
    {
      icon: <Truck className="h-10 w-10 text-primary" />,
      title: "Place Your Order",
      description: "Complete your order online and allow our team to coordinate with local suppliers for fast delivery — usually within 1–2 business days.",
      link: null
    }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works — Fast, Local Gravel Delivery in 3 Simple Steps</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="border border-gray-200 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="pb-2 flex flex-col items-center">
                <div className="mb-4 p-3 rounded-full bg-primary/10 flex items-center justify-center">
                  {step.link ? (
                    <Link to={step.link} className="hover:scale-110 transition-transform">
                      {step.icon}
                    </Link>
                  ) : (
                    step.icon
                  )}
                </div>
                <CardTitle className="text-xl font-bold">Step {index + 1}: {step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* New White Glove Service Section */}
        <div className="mt-12 p-8 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                White Glove Service — We Communicate Every Step of the Way
              </h3>
              <p className="text-gray-600 leading-relaxed">
                MGG Team will confirm all details before delivery to make sure you get exactly what you expect. We have material application experts available to review your project requirements & tonnage — FREE. Many times our experts can save you money by recommending lower-cost materials available in your region.
              </p>
            </div>
          </div>
        </div>
        
        
      </div>
    </section>
  );
};

export default HowItWorks;
