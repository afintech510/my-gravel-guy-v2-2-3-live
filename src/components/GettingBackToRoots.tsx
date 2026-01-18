
import React from 'react';
import { Sprout, Mountain, Hammer } from 'lucide-react';

const GettingBackToRoots = () => {
  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/20"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-muted/20"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-primary/20"></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative">
        {/* Header with icon */}
        <div className="text-center mb-12"> 
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground leading-normal py-2">
            🌱 Getting Back to Our Roots
          </h2>
          <div className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-8 leading-relaxed">
            Rock, Dirt & Doing the Work
          </div>
        </div>

        {/* Main content */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 border border-border">
          <div className="prose prose-lg max-w-none text-center">
            <p className="text-xl leading-relaxed text-muted-foreground mb-8">
              At My Gravel Guy, we believe there's something timeless and grounding about working with your hands. Whether you're reshaping a driveway, building a garden bed, or laying a fresh path through your property, there's power in connecting to the Earth — to the rock and dirt beneath our feet.
            </p>
            
            <p className="text-xl leading-relaxed text-muted-foreground mb-10">
              Our mission is to make it easier for everyone — from first-time homeowners to seasoned pros — to source the materials they need to shape the land and build something lasting. It's not just about gravel. It's about reclaiming the joy of outdoor work, one load at a time.
            </p>
          </div>

          {/* Feature icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                <Mountain className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quality Materials</h3>
              <p className="text-muted-foreground text-sm">Rock and dirt that stands the test of time</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                <Hammer className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Honest Work</h3>
              <p className="text-muted-foreground text-sm">Supporting the joy of building with your hands</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                <Sprout className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Growing Together</h3>
              <p className="text-muted-foreground text-sm">From first-timers to seasoned professionals</p>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="text-center mt-8">
          <div className="inline-block px-6 py-3 rounded-full border border-primary/20 bg-card">
            <span className="text-primary font-bold">One delivery at a time</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GettingBackToRoots;
