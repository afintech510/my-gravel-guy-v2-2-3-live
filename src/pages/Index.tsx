
import React from 'react';
import { Link } from 'react-router-dom';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';
import ShoppingModule from '../components/ShoppingModule';
import MaterialCalculator from '../components/MaterialCalculator';
import HowItWorks from '../components/HowItWorks';
import TestQueryButton from '../components/TestQueryButton';
import { Button } from '@/components/ui/button';
import { useZipCode } from '../contexts/ZipCodeContext';
import TrustBanner from '../components/products/trust/TrustBanner';
import GettingBackToRoots from '../components/GettingBackToRoots';
import FAQModule from '../components/home/FAQModule';
import { Store, Calculator, DollarSign } from 'lucide-react';

const Index = () => {
  const { zipCode } = useZipCode();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            America's First AI-Powered Gravel Network
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connecting customers with trusted local suppliers in seconds—not days.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link to="/shop">
              <Button variant="outline" size="lg" className="bg-white hover:bg-primary hover:text-primary-foreground">
                <Store className="mr-2 h-4 w-4" />
                Shop Now
              </Button>
            </Link>
            <Link to="/product-calculator">
              <Button variant="outline" size="lg" className="bg-white hover:bg-primary hover:text-primary-foreground">
                <Calculator className="mr-2 h-4 w-4" />
                Gravel Guy Calculator
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="bg-white hover:bg-primary hover:text-primary-foreground">
                <DollarSign className="mr-2 h-4 w-4" />
                Custom Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Shopping Module - New addition replacing LocationProductHero */}
      <ShoppingModule />
      
      {/* How It Works Section */}
      <HowItWorks />

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

      {/* Getting Back to Our Roots - New content section */}
      <GettingBackToRoots />

      {/* FAQ Module */}
      <FAQModule />
    </div>
  );
};

export default Index;
