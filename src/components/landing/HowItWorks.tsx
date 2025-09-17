import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Shield, Truck } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: 'Pick Your Gravel & Amount',
      description: 'Choose from gravel, topsoil, dirt, crushed stone, and more. Select the perfect amount for your project.',
      color: 'text-blue-500'
    },
    {
      number: 2,
      icon: Shield,
      title: 'Reserve with a $199 Refundable Deposit',
      description: 'Lock in risk-free while we negotiate the best wholesale price with our verified supplier network.',
      color: 'text-primary'
    },
    {
      number: 3,
      icon: Truck,
      title: 'We Handle the Rest',
      description: 'We secure the lowest wholesale price, send material photos for approval, and schedule delivery (with or without installation).',
      color: 'text-green-500'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get wholesale gravel prices in three simple steps. No hassle, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card key={step.number} className="relative border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                {/* Step Number */}
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="mb-6">
                  <step.icon className={`h-12 w-12 mx-auto ${step.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector Arrow (except last step) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-0.5 bg-primary/30 relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-primary/30 border-t-2 border-b-2 border-t-transparent border-b-transparent" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="mt-16 text-center">
          <Card className="bg-primary/5 border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Why Choose Our Process?
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-semibold text-foreground mb-2">No Risk</div>
                  <p className="text-muted-foreground">
                    $199 deposit is fully refundable if you're not satisfied
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-2">Best Prices</div>
                  <p className="text-muted-foreground">
                    We negotiate with our supplier network to get you wholesale rates
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-2">Total Convenience</div>
                  <p className="text-muted-foreground">
                    We handle sourcing, quality checks, and delivery coordination
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};