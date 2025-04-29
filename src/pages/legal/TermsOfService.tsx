
import React from 'react';
import { Helmet } from 'react-helmet-async';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service - My Gravel Guy</title>
        <meta name="description" content="Terms of service for My Gravel Guy - our terms and conditions for using our services." />
      </Helmet>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Last updated: April 2025</p>
          
          <p className="mb-6">Welcome to My Gravel Guy! These Terms of Service govern your use of our website and services.</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Use of Our Services</h2>
            <p className="mb-4">By accessing our website or placing an order, you agree to these Terms.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Orders and Fulfillment</h2>
            <p className="mb-4">Orders placed through our website are subject to acceptance and availability.</p>
            <p className="mb-4">We partner with local vendors to fulfill deliveries. Delivery timelines are estimated and not guaranteed.</p>
            <p className="mb-4">You are responsible for providing accurate delivery information.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Pricing and Payment</h2>
            <p className="mb-4">Prices are shown during checkout and may vary based on your ZIP code.</p>
            <p className="mb-4">Payment must be made in full at the time of order via approved methods (e.g., Stripe).</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Cancellations</h2>
            <p className="mb-4">Orders canceled within 24 hours may be eligible for a full refund.</p>
            <p className="mb-4">Orders canceled after dispatch may incur a restocking fee.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Disclaimers</h2>
            <p className="mb-4">We are not responsible for delays due to weather, vendor issues, or delivery conditions.</p>
            <p className="mb-4">Materials (gravel, sand, dirt) are natural products; slight variations in color and texture may occur.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="mb-4">To the maximum extent permitted by law, My Gravel Guy shall not be liable for any indirect, incidental, or consequential damages.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="mb-4">We reserve the right to update these Terms at any time. Updates will be posted on our website.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="mb-4">If you have questions about these Terms, email us at <a href="mailto:support@mygravelguy.com" className="text-primary hover:underline">support@mygravelguy.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
