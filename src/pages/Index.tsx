import React from 'react';
import ContractorHero from '../components/home/ContractorHero';
import MaterialsStrip from '../components/home/MaterialsStrip';
import TopProducts from '../components/TopProducts';
import HowItWorks from '../components/HowItWorks';
import WhyChooseUs from '../components/WhyChooseUs';
import CustomerReviews from '../components/CustomerReviews';
import GettingBackToRoots from '../components/GettingBackToRoots';
import FAQModule from '../components/home/FAQModule';
import HomeCalculator from '../components/home/HomeCalculator';
import ShoppingModule from '../components/ShoppingModule';
import TransformDrivewayCTA from '../components/TransformDrivewayCTA';
import ContactModule from '../components/home/ContactModule';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Contractor-First Hero Section */}
      <ContractorHero />

      {/* Materials Strip */}
      <MaterialsStrip />

      {/* Top Products Module */}
      <TopProducts />

      {/* Why Choose Us Section */}
      <WhyChooseUs />
      
      {/* How It Works Section */}
      <HowItWorks />

      {/* Customer Reviews */}
      <CustomerReviews />

      {/* Trust Signals */}
      <section className="py-16 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 font-montserrat text-foreground">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2 font-montserrat text-foreground">Local Service</h3>
              <p className="text-muted-foreground font-montserrat">Connected with trusted suppliers in your area</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 font-montserrat text-foreground">Fast Delivery</h3>
              <p className="text-muted-foreground font-montserrat">Most orders delivered within 24-48 hours</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 font-montserrat text-foreground">Best Prices</h3>
              <p className="text-muted-foreground font-montserrat">Competitive pricing from local suppliers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Back to Our Roots */}
      <GettingBackToRoots />

      {/* FAQ Module */}
      <FAQModule />

      {/* Home Calculator */}
      <HomeCalculator />

      {/* Shopping Module */}
      <ShoppingModule />
      
      {/* Transform Driveway CTA */}
      <TransformDrivewayCTA />
      
      {/* Contact Module */}
      <ContactModule />
    </div>
  );
};

export default Index;
