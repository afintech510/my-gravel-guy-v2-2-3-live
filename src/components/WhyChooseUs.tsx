import React from 'react';
import { Check } from 'lucide-react';

const WhyChooseUs = () => {
  const benefits = [
    {
      title: "Premium Quality Materials",
      description: "We source only the highest quality gravel materials that are durable and long-lasting."
    },
    {
      title: "Expert Advice", 
      description: "Our team provides professional guidance to help you choose the right gravel for your specific needs."
    },
    {
      title: "Competitive Pricing",
      description: "We offer transparent, fair pricing with no hidden fees or surprises."
    },
    {
      title: "Reliable Service",
      description: "Count on us for on-time delivery and professional installation services."
    }
  ];

  return (
    <section className="py-16 px-4 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-8">
              Why Choose MyGravelGuy?
            </h2>
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Image */}
          <div className="lg:order-last">
            <div className="relative">
              <img
                src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//gravel-in-hand.jpg"
                alt="Gravel in hand showing quality materials"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;