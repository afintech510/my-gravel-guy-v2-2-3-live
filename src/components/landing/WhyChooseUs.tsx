import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Shield, 
  Banknote, 
  Camera, 
  MapPin,
  CheckCircle
} from 'lucide-react';

export const WhyChooseUs = () => {
  const benefits = [
    {
      icon: Building,
      title: 'Wholesale Access',
      description: 'We use our extensive supplier network to get you the best wholesale rates available.',
      highlight: 'Save 20-40% vs retail'
    },
    {
      icon: Shield,
      title: 'Refundable Deposit',
      description: "Don't like the negotiated price or material quality? Get your $199 back, no questions asked.",
      highlight: '100% Risk-Free'
    },
    {
      icon: Banknote,
      title: 'Cash is King',
      description: 'Two payment options: Cash Price (lowest wholesale rate) or Card Price (convenience).',
      highlight: 'Extra 5% off with cash'
    },
    {
      icon: Camera,
      title: 'Photo Confirmation',
      description: 'We send photos of your exact materials before delivery so you know exactly what you\'re getting.',
      highlight: 'See before you receive'
    },
    {
      icon: MapPin,
      title: 'Nationwide Delivery',
      description: 'Verified local gravel suppliers across the entire United States for fast, reliable delivery.',
      highlight: 'All 50 states covered'
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose MyGravelGuy?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've revolutionized bulk material delivery with wholesale pricing, quality guarantees, and nationwide coverage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {benefit.highlight}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-background rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Trusted by Professionals & Homeowners
            </h3>
            <p className="text-muted-foreground">
              Join thousands of satisfied customers nationwide
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground">Refundable Deposit</div>
            </div>
            
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground">Wholesale Supplier Access</div>
            </div>
            
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground">Verified Gravel Suppliers</div>
            </div>
            
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Banknote className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground">Best Price Guarantee</div>
            </div>
            
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-semibold text-foreground">Nationwide Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};