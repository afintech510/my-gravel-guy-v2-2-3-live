
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import ZipCodeSearch from '../components/ZipCodeSearch';

// In a real app, this would be fetched from a CMS or API based on the slug
const getLocationBySlug = (slug: string) => {
  const locations = [
    {
      name: "Gravel Delivery in Texas",
      description: "Fast and reliable gravel delivery throughout Texas. We offer competitive rates and prompt service for residential and commercial customers.",
      image: "/placeholder.svg"
    },
    {
      name: "Sand Delivery in California",
      description: "Premium sand delivery across California. Ideal for construction, landscaping, and playgrounds.",
      image: "/placeholder.svg"
    }
  ];
  
  return locations.find(location => {
    const locationSlug = location.name.toLowerCase().replace(/\s+/g, '-');
    return locationSlug.includes(slug);
  });
};

const LocationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = slug ? getLocationBySlug(slug) : undefined;

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Location Not Found</h1>
          <p className="text-gray-600 mb-4">The location you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="relative py-20 px-4 bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{location.name}</h1>
          <p className="text-lg max-w-2xl">{location.description}</p>
        </div>
      </div>
      
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Check Availability in Your Area</h2>
          <div className="max-w-md mx-auto mb-16">
            <ZipCodeSearch />
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-12">Available Products</h2>
          <ProductGrid />
        </div>
      </section>
      
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">How soon can you deliver?</h3>
              <p className="text-gray-600">Most deliveries arrive within 24-48 hours of order confirmation.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">What's your minimum order?</h3>
              <p className="text-gray-600">Our minimum order is typically 1 cubic yard for most materials.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Do you offer delivery on weekends?</h3>
              <p className="text-gray-600">Yes, we offer weekend delivery in most service areas for a small additional fee.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocationPage;
