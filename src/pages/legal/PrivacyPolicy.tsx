
import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - My Gravel Guy</title>
        <meta name="description" content="Privacy policy for My Gravel Guy - learn how we collect, use, and protect your information." />
      </Helmet>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-4">Last updated: April 2025</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-blue-800 font-medium">
              <strong>Business Entity:</strong> MyGravelGuy.com is a service provided by Eastern Building Supply Inc.
            </p>
          </div>
          
          <p className="mb-6">Welcome to My Gravel Guy ("we," "our," or "us").
          We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information about you when you visit or make a purchase from our website.</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4"><strong>Personal Information:</strong> Name, email, phone number, address, ZIP code, payment information.</p>
            <p className="mb-4"><strong>Device Information:</strong> IP address, browser type, device type.</p>
            <p className="mb-4"><strong>Usage Information:</strong> Pages visited, time spent on site, clicks.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">To provide and deliver the products and services you request.</li>
              <li className="mb-2">To process payments and send transaction confirmations.</li>
              <li className="mb-2">To communicate with you, including updates and customer service.</li>
              <li className="mb-2">To personalize your experience and offer location-specific services.</li>
              <li className="mb-2">For advertising and marketing purposes (only with your consent where required).</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Sharing Your Information</h2>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Local vendors or delivery partners to fulfill your order.</li>
              <li className="mb-2">Payment processors like Stripe to complete transactions.</li>
              <li className="mb-2">Service providers that help us operate our website.</li>
              <li className="mb-2">Legal authorities if required by law.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Your Rights</h2>
            <p className="mb-4">You may:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Access or update your personal information.</li>
              <li className="mb-2">Request deletion of your personal information.</li>
              <li className="mb-2">Opt out of marketing emails at any time.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking</h2>
            <p className="mb-4">We use cookies to improve your browsing experience. You can disable cookies in your browser settings.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Changes to This Policy</h2>
            <p className="mb-4">We may update this Privacy Policy occasionally. The latest version will always be posted here.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="mb-4">Questions? Contact us at <a href="mailto:support@mygravelguy.com" className="text-primary hover:underline">support@mygravelguy.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
