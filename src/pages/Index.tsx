
import React from 'react';
import { Link } from 'react-router-dom';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';
import LocationProductHero from '../components/LocationProductHero';
import ProductGrid from '../components/ProductGrid';
import MaterialCalculator from '../components/MaterialCalculator';
import HowItWorks from '../components/HowItWorks';
import TestQueryButton from '../components/TestQueryButton';
import { Button } from '@/components/ui/button';
import { useZipCode } from '../contexts/ZipCodeContext';
import TrustBanner from '../components/products/trust/TrustBanner';

const Index = () => {
  const { zipCode } = useZipCode();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      
      {/* ZIP Code Search Section */}
      <section className="py-4 px-4 bg-blue-50 border-b">
        <div className="max-w-4xl mx-auto">
          <ZipCodeSearch />
        </div>
      </section>
    
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Local Rock & Dirt Delivery
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get gravel, sand, and dirt delivered right to your location. Fast, reliable, and competitively priced.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link to="/quiz">
              <Button variant="outline" size="lg">Build a Project Plan</Button>
            </Link>
            <Link to="/calculator">
              <Button variant="secondary" size="lg">Gravel Guy Calculator</Button>
            </Link>
          </div>
        </div>
      </section>

     {/* Location Product Hero - Shows always below ZIP search */}
      <section className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <LocationProductHero />
        </div>
      </section>
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Trust Banner - Scrolling format above calculator */}
      <section className="py-6 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <TrustBanner 
            title="Why Customers Trust Us" 
            forceScrolling={true} 
            badgeSize="compact"
            className="bg-white rounded-lg shadow-sm"
          />
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Calculate Material Needs</h2>
          <MaterialCalculator />
        </div>
      </section>

      {/* Quiz Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure What Material You Need?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Step through our project planner and get FREE personalized recommendations for your project.
          </p>
          <Link to="/quiz">
            <Button size="lg">Build a Project Plan</Button>
          </Link>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Local Service</h3>
              <p className="text-gray-600">Connected with trusted suppliers in your area</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Most orders delivered within 24-48 hours</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive pricing from local suppliers</p>
            </div>
          </div>
        </div>
      </section>

     {/* Test Query Button - Temporary addition for testing */}
      <section className="py-6 px-4 bg-blue-50 border-b">
        <div className="max-w-4xl mx-auto">
          <TestQueryButton />
        </div>
      </section>
      
    </div>
  );
};

export default Index;
