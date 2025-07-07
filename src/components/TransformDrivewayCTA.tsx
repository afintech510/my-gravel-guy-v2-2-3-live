import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TransformDrivewayCTA = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-green-400 to-green-500">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Ready to Transform Your Driveway?
        </h2>
        <p className="text-lg text-gray-800 mb-8 max-w-2xl mx-auto">
          Order now or request a free quote. We'll help you choose the right gravel solution for your needs.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg" className="bg-transparent border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white">
            <Link to="/contact">
              Request a Free Quote
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
            <Link to="/shop">
              Shop Now
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TransformDrivewayCTA;