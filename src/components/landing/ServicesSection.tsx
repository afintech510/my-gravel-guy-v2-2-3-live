import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shovel, 
  RotateCcw, 
  Droplets, 
  Wrench,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const ServicesSection = () => {
  const services = [
    {
      icon: Shovel,
      title: 'Spreading & Grading',
      description: 'Professional spreading and grading of gravel, topsoil, and dirt for a smooth, even finish.',
      features: ['Laser-level grading', 'Proper compaction', 'Drainage optimization']
    },
    {
      icon: Droplets,
      title: 'Hole Filling & Site Prep',
      description: 'Fill holes, level uneven ground, and prepare your site for construction or landscaping.',
      features: ['Pothole repair', 'Foundation prep', 'Landscaping base']
    },
    {
      icon: RotateCcw,
      title: 'Driveway Installation',
      description: 'Complete driveway installation from excavation to final grading and compaction.',
      features: ['Excavation included', 'Base preparation', 'Professional finish']
    },
    {
      icon: Wrench,
      title: 'Equipment Rental',
      description: 'Rent professional-grade equipment with your material delivery for DIY projects.',
      features: ['Bobcat rental', 'Compactors available', 'Operator included']
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Additional Services
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Need Installation Too?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We can spread and grade gravel, topsoil, and dirt, fill holes, 
              and prep your site for a professional finish.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {service.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Bundle Services & Save
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">15%</div>
                  <div className="text-sm text-muted-foreground">Discount on installation when bundled with materials</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">1-Day</div>
                  <div className="text-sm text-muted-foreground">Most projects completed in a single day</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">Licensed</div>
                  <div className="text-sm text-muted-foreground">Fully licensed and insured contractors</div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Add installation services to your material order and save time, money, and hassle. 
                  Our professional crews handle everything from delivery to final cleanup.
                </p>
                
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add Installation to My Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Installation quotes provided after material selection
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};