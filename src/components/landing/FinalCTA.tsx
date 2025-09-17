import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';

export const FinalCTA = () => {
  const scrollToPricingForm = () => {
    const formElement = document.getElementById('pricing-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Lock In Wholesale Gravel Pricing Today
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Reserve your materials with a fully refundable $199 deposit. 
            We'll negotiate the best wholesale price and send photos for approval.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              onClick={scrollToPricingForm}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Shield className="mr-2 h-5 w-5" />
              Reserve Now – $199 Refundable Deposit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-sm text-muted-foreground">
              or <button 
                onClick={scrollToPricingForm}
                className="text-primary hover:underline font-medium"
              >
                buy it now at discounted price
              </button>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>100% Refundable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Photo Confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Wholesale Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Nationwide Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};