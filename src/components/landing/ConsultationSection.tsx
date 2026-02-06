import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhoneCall, MessageCircle, Calendar, Users } from 'lucide-react';

export const ConsultationSection = () => {
  const handleBookConsultation = () => {
    // This would typically open a calendar booking widget or redirect to scheduling
    window.open('tel:+1-555-GRAVEL', '_blank');
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left Column - Content */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Talk to a Gravel & Dirt Expert – <span className="font-bold text-foreground">Free</span>
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Get professional advice on driveways, landscaping, hole filling, or site prep. 
                      We'll help you choose the right materials, calculate amounts, and plan scheduling — 
                      <strong className="text-foreground"> free with your reservation</strong>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="h-5 w-5 text-primary" />
                      <span>Experienced contractors and material specialists</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>Available 7 days a week for consultations</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span>Call, text, or video chat - whatever works for you</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookConsultation}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <PhoneCall className="mr-2 h-5 w-5" />
                    Book My Free Consultation
                  </Button>
                </div>

                {/* Right Column - Benefits */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    What We'll Help You With:
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Material Selection</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose the perfect gravel size, topsoil blend, or fill dirt for your specific project needs.
                      </p>
                    </div>
                    
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Quantity Calculation</h4>
                      <p className="text-sm text-muted-foreground">
                        Get exact measurements to avoid over-ordering or running short on materials.
                      </p>
                    </div>
                    
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Project Planning</h4>
                      <p className="text-sm text-muted-foreground">
                        Timeline advice, delivery scheduling, and coordination with your other contractors.
                      </p>
                    </div>
                    
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Installation Tips</h4>
                      <p className="text-sm text-muted-foreground">
                        Professional techniques for spreading, grading, and finishing your materials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom testimonial */}
              <div className="mt-8 pt-8 border-t border-primary/20 text-center">
                <blockquote className="text-muted-foreground italic">
                  "The consultation saved me from ordering the wrong type of gravel. 
                  The expert knew exactly what I needed for my driveway project."
                </blockquote>
                <cite className="text-sm text-muted-foreground mt-2 block">
                  — Sarah M., Austin TX
                </cite>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};