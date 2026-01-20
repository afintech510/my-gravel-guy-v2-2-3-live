import React from 'react';
import { Link } from 'react-router-dom';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';
import ShoppingModule from '../components/ShoppingModule';
import MaterialCalculator from '../components/MaterialCalculator';
import HowItWorks from '../components/HowItWorks';
import TestQueryButton from '../components/TestQueryButton';
import TopProducts from '../components/TopProducts';
import { Button } from '@/components/ui/button';
import { useZipCode } from '../contexts/ZipCodeContext';
import TrustBanner from '../components/products/trust/TrustBanner';
import GettingBackToRoots from '../components/GettingBackToRoots';
import FAQModule from '../components/home/FAQModule';
import WhyChooseUs from '../components/WhyChooseUs';
import CustomerReviews from '../components/CustomerReviews';
import TransformDrivewayCTA from '../components/TransformDrivewayCTA';
import HomeCalculator from '../components/home/HomeCalculator';
import ContactModule from '../components/home/ContactModule';
import { Store, Calculator, DollarSign, Mails } from 'lucide-react';
const Index = () => {
  const {
    zipCode
  } = useZipCode();
  return <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
     <section 
        className="py-16 px-4 bg-cover bg-center bg-no-repeat min-h-screen flex items-center relative"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.0)), url('https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//loader-with-driveway-gravel.png')"
        }}
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Premium Gravel Delivered to Your Door</h1>
            <p className="text-xl text-white mb-8">Transform your home with high-quality gravel from My Gravel Guy. Fast delivery, competitive pricing, and professional service.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Link to="/shop">
              <Button variant="outline" size="lg" className="bg-white text-foreground hover:bg-primary hover:text-primary-foreground">
                <Store className="mr-2 h-4 w-4" />
                Shop
              </Button>
            </Link>
            <Link to="/product-calculator">
              <Button variant="outline" size="lg" className="bg-white text-foreground hover:bg-primary hover:text-primary-foreground">
                <Calculator className="mr-2 h-4 w-4" />
                Calculator
              </Button>
            </Link>
              <Link to="/contact">
              <Button variant="outline" size="lg" className="bg-white text-foreground hover:bg-primary hover:text-primary-foreground">
                <Mails className="mr-2 h-4 w-4" />
                Contact
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top Products Module */}
      <TopProducts />


      {/* Why Choose Us Section */}
      <WhyChooseUs />
      
      {/* How It Works Section */}
      <HowItWorks />

      {/* Customer Reviews */}
      <CustomerReviews />

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

      {/* Home Calculator */}
      <HomeCalculator />

        {/* Shopping Module   */}
      <ShoppingModule />
      
      {/* Transform Driveway CTA */}
      <TransformDrivewayCTA />
      
      {/* Contact Module */}
      <ContactModule />
    
    </div>;
};
export default Index;