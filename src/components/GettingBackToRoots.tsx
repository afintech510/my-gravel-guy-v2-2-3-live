
import React from 'react';
import { Sprout, Mountain, Hammer } from 'lucide-react';

const GettingBackToRoots = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-green-50 via-gray-50 to-stone-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/20"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-stone-400/20"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-green-400/20"></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative">
        {/* Header with icon */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Sprout className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-stone-800 to-gray-700 bg-clip-text text-transparent">
            🌱 Getting Back to Our Roots
          </h2>
          <div className="text-2xl md:text-3xl font-semibold text-stone-600 mb-8">
            Rock, Dirt & Doing the Work
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 border border-stone-200/50">
          <div className="prose prose-lg max-w-none text-center">
            <p className="text-xl leading-relaxed text-gray-700 mb-8">
              At My Gravel Guy, we believe there's something timeless and grounding about working with your hands. Whether you're reshaping a driveway, building a garden bed, or laying a fresh path through your property, there's power in connecting to the Earth — to the rock and dirt beneath our feet.
            </p>
            
            <p className="text-xl leading-relaxed text-gray-700 mb-10">
              Our mission is to make it easier for everyone — from first-time homeowners to seasoned pros — to source the materials they need to shape the land and build something lasting. It's not just about gravel. It's about reclaiming the joy of outdoor work, one load at a time.
            </p>
          </div>

          {/* Feature icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-100 rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                <Mountain className="h-6 w-6 text-stone-600 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quality Materials</h3>
              <p className="text-gray-600 text-sm">Rock and dirt that stands the test of time</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-100 rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                <Hammer className="h-6 w-6 text-stone-600 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Honest Work</h3>
              <p className="text-gray-600 text-sm">Supporting the joy of building with your hands</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-100 rounded-full mb-4 group-hover:bg-primary/10 transition-colors">
                <Sprout className="h-6 w-6 text-stone-600 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Growing Together</h3>
              <p className="text-gray-600 text-sm">From first-timers to seasoned professionals</p>
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="text-center mt-8">
          <div className="inline-block px-6 py-3 bg-primary/5 rounded-full border border-primary/20">
            <span className="text-primary font-medium">One load at a time</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GettingBackToRoots;
