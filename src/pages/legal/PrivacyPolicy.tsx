
import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - Gravel Delivery</title>
      </Helmet>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Contact information (name, email, phone number)</li>
              <li>Delivery address and preferences</li>
              <li>Order history and preferences</li>
            </ul>
          </section>
          {/* Add more sections as needed */}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
