
import React from 'react';
import { Helmet } from 'react-helmet-async';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Refund Policy - Gravel Delivery</title>
      </Helmet>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Refund Policy</h2>
            <p>We want you to be completely satisfied with your purchase. If you are not satisfied, please contact us to discuss your concerns.</p>
          </section>
          {/* Add more sections as needed */}
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
