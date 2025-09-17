import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, Truck, DollarSign, Shield } from 'lucide-react';

export const HeroSection = () => {
  const scrollToPricingForm = () => {
    const formElement = document.getElementById('pricing-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-background via-background to-muted py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headlines */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Buy Gravel Online – <span className="text-primary">Wholesale Prices</span>, Fast Delivery
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Reserve today with a <strong className="text-primary">$199 refundable deposit</strong> and let Gravel Guy negotiate the lowest wholesale price for you.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>100% Refundable Deposit</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Wholesale Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span>Nationwide Delivery</span>
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            onClick={scrollToPricingForm}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-4"
          >
            Select Gravel & Lock In My Price
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-sm text-muted-foreground">
            No commitment • Photo confirmation • Cash discount available
          </p>
        </div>

        {/* Hero Image/Visual */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-r from-muted to-muted/50 rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Select Material</h3>
                <p className="text-sm text-muted-foreground">Choose from gravel, topsoil, dirt, and more</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Reserve with $199</h3>
                <p className="text-sm text-muted-foreground">Fully refundable deposit to lock in pricing</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">We Handle the Rest</h3>
                <p className="text-sm text-muted-foreground">Negotiate pricing, confirm photos, schedule delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};