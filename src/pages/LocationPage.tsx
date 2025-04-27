
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductGrid from '../components/ProductGrid';
import ZipCodeSearch from '../components/ZipCodeSearch';
import { fetchSheetData } from '../utils/googleSheets';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, TruckIcon, Clock, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type LocationData = {
  state: string;
  city: string;
  region: string;
  slug: string;
  title: string;
  description: string;
  meta_description: string;
  service_area: string;
  local_info: string;
  delivery_info: string;
  image_url: string;
  nearby_locations?: string;
  faqs?: string;
};

const LocationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<LocationData[]>([]);
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        // Replace with your actual Google Sheet ID and tab name
        const sheetId = '1g6vVui0lG54_iFX9CLJoWAHUh-UePQygm15Kq7z3noI';
        const sheetName = 'Locations';
        
        const data = await fetchSheetData(sheetId, sheetName);
        
        // Find the location that matches the slug
        const locationData = data.find((loc: any) => 
          loc.slug?.toLowerCase() === slug?.toLowerCase()
        );

        if (!locationData) {
          setError('Location not found');
          setLoading(false);
          return;
        }

        setLocation(locationData as LocationData);

        // Process nearby locations if any
        if (locationData.nearby_locations) {
          const nearby = locationData.nearby_locations.split(',').map(nearby => 
            data.find((loc: any) => loc.slug.trim() === nearby.trim())
          ).filter(Boolean);
          setNearbyLocations(nearby as LocationData[]);
        }

        // Process FAQs if any
        if (locationData.faqs) {
          try {
            const faqsData = JSON.parse(locationData.faqs);
            setFaqs(faqsData);
          } catch (e) {
            console.error("Error parsing FAQs:", e);
          }
        } else {
          // Default FAQs if none provided
          setFaqs([
            {
              question: "How soon can you deliver?",
              answer: "Most deliveries arrive within 24-48 hours of order confirmation."
            },
            {
              question: "What's your minimum order?",
              answer: "Our minimum order is typically 1 cubic yard for most materials."
            },
            {
              question: "Do you offer delivery on weekends?", 
              answer: "Yes, we offer weekend delivery in most service areas for a small additional fee."
            }
          ]);
        }
        
      } catch (err) {
        console.error("Error fetching location data:", err);
        setError('Error loading location data');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLocation();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Location Not Found</h1>
          <p className="text-gray-600 mb-4">The location you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/locations">View All Locations</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Helmet>
        <title>{location.title || `Gravel Delivery in ${location.city}, ${location.state}`}</title>
        <meta name="description" content={location.meta_description || location.description} />
        <meta property="og:title" content={location.title || `Gravel Delivery in ${location.city}, ${location.state}`} />
        <meta property="og:description" content={location.meta_description || location.description} />
        {location.image_url && <meta property="og:image" content={location.image_url} />}
      </Helmet>
      
      <div className="relative py-20 px-4 bg-gray-800 text-white">
        {location.image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20" 
            style={{ backgroundImage: `url(${location.image_url})` }}
          />
        )}
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center text-sm mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <Link to="/locations" className="hover:underline">Locations</Link>
            <span className="mx-2">›</span>
            <span>{location.city}, {location.state}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {location.title || `Gravel Delivery in ${location.city}, ${location.state}`}
          </h1>
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="text-lg">{location.city}, {location.state}</span>
          </div>
          <p className="text-lg max-w-2xl">{location.description}</p>
        </div>
      </div>
      
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-6">Local Gravel Delivery in {location.city}</h2>
              
              <div className="prose max-w-none mb-8">
                <p>{location.local_info}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <TruckIcon className="h-5 w-5 mr-2" />
                  Delivery Information
                </h3>
                <p className="mb-4">{location.delivery_info}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-600" />
                    <span>24-48 hour delivery</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-gray-600" />
                    <span>Free delivery consultation</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-gray-600" />
                    <span>5-star local service</span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-6">Check Availability in Your Area</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm mb-12">
                <ZipCodeSearch />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Service Areas</h3>
                  <p className="mb-4">We proudly deliver to the following areas near {location.city}:</p>
                  <div className="space-y-2">
                    {location.service_area.split(',').map((area, index) => (
                      <div key={index} className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>{area.trim()}</span>
                      </div>
                    ))}
                  </div>
                  
                  {nearbyLocations.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <h3 className="text-xl font-semibold mb-4">Nearby Service Areas</h3>
                      <div className="space-y-2">
                        {nearbyLocations.map((nearby, index) => (
                          <Link 
                            key={index} 
                            to={`/locations/${nearby.slug}`}
                            className="flex items-center text-primary hover:underline"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{nearby.city}, {nearby.state}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-12 mt-16">Available Products</h2>
          <ProductGrid />
        </div>
      </section>
      
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions About Gravel Delivery in {location.city}
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index}>
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocationPage;
