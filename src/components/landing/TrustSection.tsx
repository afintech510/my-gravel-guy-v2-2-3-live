import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

export const TrustSection = () => {
  const testimonials = [
    {
      name: "Mike Johnson",
      location: "Austin, TX",
      rating: 5,
      text: "Got exactly what I needed for my driveway. The deposit was fully refunded when I decided to go with a different material. Great service!"
    },
    {
      name: "Sarah Chen", 
      location: "Dallas, TX",
      rating: 5,
      text: "The wholesale pricing saved me over $800 compared to local suppliers. The photo confirmation gave me peace of mind."
    },
    {
      name: "Robert Williams",
      location: "Houston, TX", 
      rating: 5,
      text: "Professional delivery and installation. The cash discount made this the best deal I could find anywhere."
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-muted-foreground">
            Join satisfied customers nationwide who chose MyGravelGuy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <blockquote className="text-muted-foreground mb-4 italic">
                  "{testimonial.text}"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                  <Badge variant="secondary">Verified Customer</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};