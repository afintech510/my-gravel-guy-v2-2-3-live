
import React from 'react';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Text content - left side */}
            <div className="text-left md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About Our Service</h1>
              <p className="text-xl text-gray-600">
                Connecting you with the best local gravel, sand, and dirt suppliers nationwide.
              </p>
            </div>
            
            {/* Logo - right side */}
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="/lovable-uploads/4ed875b4-fd42-46f3-8b63-d65844a33ff0.png" 
                alt="My Gravel Guy Logo" 
                className="h-64 w-auto"
              />
            </div>
          </div>
        </div>
      </div>
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
          <p className="text-lg text-gray-600 mb-8">
            We're on a mission to make ordering bulk materials simple and affordable. By connecting customers directly with local suppliers, we cut out the middleman and pass the savings on to you.
          </p>
          
          <h2 className="text-3xl font-bold mb-8 mt-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enter Your ZIP</h3>
              <p className="text-gray-600">Check if we service your area by entering your ZIP code</p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Select Products</h3>
              <p className="text-gray-600">Browse our selection of gravel, sand, and dirt products</p>
            </div>
            
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Receive your delivery within 24-48 hours in most areas</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">Check if we deliver to your area.</p>
          <div className="max-w-md mx-auto">
            <ZipCodeSearch />
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
