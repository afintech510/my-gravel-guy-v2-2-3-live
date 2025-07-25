import React from 'react';
import { Helmet } from 'react-helmet-async';
const RefundPolicy = () => {
  return <div className="min-h-screen bg-background">
      <Helmet>
        <title>Refund Policy - My Gravel Guy</title>
        <meta name="description" content="Refund policy for My Gravel Guy - learn about our refund eligibility criteria and processes." />
      </Helmet>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Last updated: April 2025</p>
          
          <p className="mb-6">We want you to be satisfied with your purchase. Here's how refunds work at My Gravel Guy:</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Refund Eligibility</h2>
            <p className="mb-4">Refunds may be requested if:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">You cancel your order within 24 hours of purchase and before dispatch.</li>
              <li className="mb-2">There was a clear error in the product delivered (wrong material type, significant quality issue).</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Non-Refundable Situations</h2>
            <p className="mb-4">Once material is delivered to your site, it is non-returnable and non-refundable.</p>
            <p className="mb-4">We are not responsible for site accessibility issues, unloading challenges, or improper measurements by the customer.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How to Request a Refund</h2>
            <p className="mb-4">Email <a href="mailto:support@mygravelguy.com" className="text-primary hover:underline">support@mygravelguy.com</a> with your order number and reason for the request.</p>
            <p className="mb-4">Refunds (if approved) will be processed to your original payment method within 5–7 business days, minus a 10% fee to cover processing costs.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Partial Refunds</h2>
            <p className="mb-4">If partial delivery occurs due to vendor limitations, we will refund the undelivered portion.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Delivery Fees</h2>
            <p className="mb-4">Delivery fees are non-refundable once a truck has been dispatched.</p>
          </section>
        </div>
      </div>
    </div>;
};
export default RefundPolicy;