
import React from 'react';
import { Link } from 'react-router-dom';
import ZipCodeSearch from '../components/ZipCodeSearch';
import ProductGrid from '../components/ProductGrid';
import MaterialCalculator from '../components/MaterialCalculator';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Local Gravel & Material Delivery
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get gravel, sand, and dirt delivered right to your location. Fast, reliable, and competitively priced.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <ZipCodeSearch />
            <Link to="/quiz">
              <Button variant="outline" size="lg">Take Our Material Quiz</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Products</h2>
          <ProductGrid />
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
            Take our quick material quiz and get personalized recommendations for your project.
          </p>
          <Link to="/quiz">
            <Button size="lg">Take the Material Quiz</Button>
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
    </div>
  );
};

export default Index;
