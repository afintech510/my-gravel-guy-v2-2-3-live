
import React from 'react';
import { MapPin, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: "Enter Your ZIP Code",
      description: "Check if we deliver to your area and get instant access to local pricing and available materials."
    },
    {
      icon: <Package className="h-10 w-10 text-primary" />,
      title: "Choose Your Product",
      description: "Browse our selection of gravel, sand, and dirt. Select your quantity and review delivery details."
    },
    {
      icon: <Truck className="h-10 w-10 text-primary" />,
      title: "Place Your Order",
      description: "Complete your order online in minutes. We'll coordinate with a local supplier and get your material delivered fast — usually within 1–2 business days."
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
                  {step.icon}
                </div>
                <CardTitle className="text-xl font-bold">Step {index + 1}: {step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-lg mb-6">Still have questions?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/faq">
              <Button variant="outline" size="lg">See FAQ</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg">Contact Us</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
