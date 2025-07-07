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
  const {
    zipCode
  } = useZipCode();
  return <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section 
        className="py-16 px-4 bg-cover bg-center bg-no-repeat min-h-[500px] flex items-center"
        style={{
          backgroundImage: "url('https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//loader-with-driveway-gravel.png')"
        }}
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Premium Gravel Delivered to Your Door</h1>
            <p className="text-xl text-white mb-8">Transform your home with high-quality gravel from My Gravel Guy. Fast delivery, competitive pricing, and professional service.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Link to="/contact">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white border-0">
                  Get a Free Quote
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white hover:bg-white hover:text-gray-900">
                  Order Now
                </Button>
              </Link>
            </div>
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
    </div>;
};
export default Index;