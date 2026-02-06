import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductGrid from '../components/ProductGrid';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';
import { fetchSheetData } from '../utils/googleSheets';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, TruckIcon, Clock, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { deliveryLocations } from '@/data/locations';

type LocationData = {
  state: string;
  city: string;
  region: string;
  slug: string;
  title: string;
  description: string;
  meta_description?: string;
  service_area?: string;
  local_info?: string;
  delivery_info?: string;
  image_url?: string;
  nearby_locations?: string;
  faqs?: string;
};

// Fallback location data in case the API is not available
const fallbackLocationData: Record<string, LocationData> = {
  'austin-tx': {
    state: 'Texas',
    city: 'Austin',
    region: 'Central Texas',
    slug: 'austin-tx',
    title: 'Gravel Delivery in Austin, TX',
    description: 'Fast and reliable gravel delivery throughout Austin and surrounding areas. Same or next day delivery available.',
    meta_description: 'Order gravel, sand, and dirt delivery in Austin, TX with same-day options. Best prices and reliable service.',
    service_area: 'Downtown Austin, North Austin, South Austin, Round Rock, Cedar Park, Pflugerville, Lakeway',
    local_info: 'Austin homeowners and contractors trust our premium gravel delivery service for landscaping and construction projects. We serve all neighborhoods with prompt delivery and great prices.',
    delivery_info: 'We deliver throughout the Austin area 7 days a week. Most orders can be delivered same-day when ordered before noon, or next-day for orders placed later.',
    image_url: 'https://images.unsplash.com/photo-1557434440-d4d48e6578b5'
  },
  'dallas-tx': {
    state: 'Texas',
    city: 'Dallas',
    region: 'North Texas',
    slug: 'dallas-tx',
    title: 'Gravel Delivery in Dallas, TX',
    description: 'Premium gravel and material delivery throughout Dallas and surrounding suburbs.',
    meta_description: 'Order gravel, sand, and dirt delivery in Dallas, TX. Fast service for residential and commercial projects.',
    service_area: 'Downtown Dallas, North Dallas, Richardson, Plano, Frisco, Garland, Mesquite, Irving',
    local_info: 'Dallas residents and businesses rely on our extensive selection of materials for landscapes, driveways, and commercial projects. We provide top-quality products at competitive prices.',
    delivery_info: 'We deliver throughout Dallas and surrounding areas with flexible scheduling options. Standard delivery is available Monday through Saturday.',
    image_url: 'https://images.unsplash.com/photo-1545402131-87158652882e'
  },
  'los-angeles-ca': {
    state: 'California',
    city: 'Los Angeles',
    region: 'Southern California',
    slug: 'los-angeles-ca',
    title: 'Gravel Delivery in Los Angeles, CA',
    description: 'Professional gravel delivery across Los Angeles county, serving residential and commercial projects.',
    meta_description: 'Order gravel, sand, and construction materials in Los Angeles with reliable delivery service.',
    service_area: 'Downtown LA, Hollywood, Santa Monica, Long Beach, Pasadena, Glendale, Burbank',
    local_info: 'Los Angeles property owners choose us for quality landscape and construction materials. Our extensive inventory includes decorative gravels perfect for Southern California landscape designs.',
    delivery_info: 'We provide delivery throughout Los Angeles County with flexible scheduling. Most areas can receive delivery within 2 business days.',
    image_url: 'https://images.unsplash.com/photo-1506190503914-c9c7b96c2be9'
  },
  'san-francisco-ca': {
    state: 'California',
    city: 'San Francisco',
    region: 'Northern California',
    slug: 'san-francisco-ca',
    title: 'Gravel Delivery in San Francisco, CA',
    description: 'Reliable material delivery solutions for San Francisco and the Bay Area. Bulk discounts available.',
    meta_description: 'Premium gravel and landscaping materials delivered across San Francisco and the Bay Area.',
    service_area: 'Downtown SF, Richmond District, Sunset District, Mission District, Oakland, Berkeley, Daly City',
    local_info: 'San Francisco residents trust our delivery service for all their landscaping and hardscaping needs. We offer sustainable and locally-sourced materials perfect for Bay Area projects.',
    delivery_info: 'We deliver throughout San Francisco and the Bay Area with scheduled delivery windows to accommodate urban access challenges.',
    image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29'
  },
  'miami-fl': {
    state: 'Florida',
    city: 'Miami',
    region: 'South Florida',
    slug: 'miami-fl',
    title: 'Gravel Delivery in Miami, FL',
    description: 'Fast and affordable gravel delivery services throughout Miami-Dade county. Perfect for landscaping projects.',
    meta_description: 'Quality gravel and decorative stone delivery across Miami and South Florida. Ideal for tropical landscaping.',
    service_area: 'Downtown Miami, Miami Beach, Coral Gables, Kendall, North Miami, Hialeah, Homestead',
    local_info: 'Miami property owners love our selection of decorative gravels and stones perfect for tropical landscaping and modern South Florida design aesthetics.',
    delivery_info: 'We offer fast delivery throughout Miami-Dade County, usually within 1-2 business days of ordering.',
    image_url: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f'
  },
  'orlando-fl': {
    state: 'Florida',
    city: 'Orlando',
    region: 'Central Florida',
    slug: 'orlando-fl',
    title: 'Gravel Delivery in Orlando, FL',
    description: 'Quality gravel delivery service in Orlando area. Ideal for landscaping and construction projects.',
    meta_description: 'Reliable gravel and stone delivery across Greater Orlando. Perfect for residential and commercial projects.',
    service_area: 'Downtown Orlando, Kissimmee, Winter Park, Altamonte Springs, Sanford, Lake Buena Vista',
    local_info: 'Orlando homeowners and businesses choose our delivery service for quality materials that stand up to Florida weather and enhance outdoor spaces.',
    delivery_info: 'We deliver throughout the Orlando area Monday through Saturday, with most deliveries arriving within 48 hours of ordering.',
    image_url: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c'
  },
  'houston-tx': {
    state: 'Texas',
    city: 'Houston',
    region: 'Southeast Texas',
    slug: 'houston-tx',
    title: 'Gravel Delivery in Houston, TX',
    description: 'Reliable delivery of gravel and aggregates across Houston and surrounding suburbs.',
    meta_description: 'Professional gravel, sand and stone delivery across Houston metropolitan area with great prices.',
    service_area: 'Downtown Houston, The Woodlands, Sugar Land, Katy, Pearland, Pasadena, League City',
    local_info: 'Houston contractors and homeowners rely on our extensive inventory and reliable delivery service for projects of all sizes, from residential landscaping to commercial construction.',
    delivery_info: 'We deliver to all Houston neighborhoods and surrounding areas with same-day and next-day options available for most materials.',
    image_url: 'https://images.unsplash.com/photo-1589825743117-8ea5c158bd3d'
  },
  'new-york-ny': {
    state: 'New York',
    city: 'New York',
    region: 'New York Metropolitan Area',
    slug: 'new-york-ny',
    title: 'Gravel Delivery in New York, NY',
    description: 'Professional gravel delivery services across all New York City boroughs and surrounding areas.',
    meta_description: 'Urban gravel and construction material delivery across NYC boroughs. Specialized in city delivery logistics.',
    service_area: 'Manhattan, Brooklyn, Queens, Bronx, Staten Island, Jersey City, Hoboken',
    local_info: 'NYC property owners and contractors rely on our precise scheduling and reliable city delivery service for all their material needs, from rooftop gardens to ground-level landscaping.',
    delivery_info: 'We specialize in navigating NYC delivery challenges with scheduled delivery windows and specialized equipment for urban access.',
    image_url: 'https://images.unsplash.com/photo-1522083165195-3424ed129620'
  },
  'chicago-il': {
    state: 'Illinois',
    city: 'Chicago',
    region: 'Northern Illinois',
    slug: 'chicago-il',
    title: 'Gravel Delivery in Chicago, IL',
    description: 'Fast and reliable gravel delivery throughout Chicago and suburbs. Competitive rates for all project sizes.',
    meta_description: 'Efficient gravel and aggregate delivery across Chicago area. Perfect for urban and suburban projects.',
    service_area: 'Downtown Chicago, Evanston, Oak Park, Naperville, Schaumburg, Aurora, Joliet',
    local_info: 'Chicago homeowners and contractors appreciate our reliable delivery service that works around the challenges of urban delivery logistics and Midwest weather conditions.',
    delivery_info: 'We deliver throughout Chicago and the surrounding suburbs with flexible scheduling to accommodate city regulations and access restrictions.',
    image_url: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313'
  },
  'phoenix-az': {
    state: 'Arizona',
    city: 'Phoenix',
    region: 'Central Arizona',
    slug: 'phoenix-az',
    title: 'Gravel Delivery in Phoenix, AZ',
    description: 'Desert landscaping materials and gravel delivered across the Phoenix metropolitan area.',
    meta_description: 'Specialized desert landscaping materials and decorative gravel delivered across Greater Phoenix.',
    service_area: 'Downtown Phoenix, Scottsdale, Tempe, Mesa, Chandler, Glendale, Gilbert',
    local_info: 'Phoenix area residents trust our selection of desert-friendly landscaping materials perfect for xeriscaping and sustainable Southwest design.',
    delivery_info: 'We deliver throughout the Phoenix metropolitan area, with special early morning delivery options during summer months to beat the heat.',
    image_url: 'https://images.unsplash.com/photo-1558349559-b466457c3ff1'
  }
};

const LocationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<LocationData[]>([]);
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        
        // First check if the location exists in our local data
        if (slug) {
          const localLocation = deliveryLocations.find(loc => 
            loc.slug?.toLowerCase() === slug.toLowerCase()
          );
          
          if (localLocation) {
            console.log("Found location in local data:", localLocation);
            // Convert to LocationData format
            const locationData: LocationData = {
              city: localLocation.city,
              state: localLocation.state,
              region: localLocation.region || `${localLocation.state} Region`,
              slug: localLocation.slug || slug,
              title: localLocation.title || `Gravel Delivery in ${localLocation.city}, ${localLocation.state}`,
              description: localLocation.description || `Fast and reliable gravel delivery in ${localLocation.city}, ${localLocation.state}`,
              service_area: `${localLocation.city} and surrounding areas`,
              local_info: `${localLocation.city} homeowners and contractors trust our premium gravel delivery service for landscaping and construction projects.`,
              delivery_info: `We deliver throughout the ${localLocation.city} area 7 days a week. Most orders can be delivered same-day when ordered before noon, or next-day for orders placed later.`,
              image_url: `https://images.unsplash.com/photo-${Math.floor(Math.random()*1000000000)}`
            };
            
            setLocation(locationData);
            processNearbyAndFaqs(locationData);
            setLoading(false);
            return;
          }
        }

        // Replace with your actual Google Sheet ID and tab name
        const sheetId = '1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI';
        const sheetName = 'Locations';
        
        try {
          const data = await fetchSheetData(sheetId, sheetName);
          
          // Find the location that matches the slug
          const locationData = data.find((loc: any) => 
            loc.slug?.toLowerCase() === slug?.toLowerCase()
          );

          if (!locationData) {
            // If no data found from API, check fallback data
            if (slug && fallbackLocationData[slug]) {
              console.log("Using fallback data for location:", slug);
              setLocation(fallbackLocationData[slug]);
              processNearbyAndFaqs(fallbackLocationData[slug]);
              setLoading(false);
              return;
            }
            
            toast({
              title: "Location not found",
              description: `We couldn't find information for ${slug}. Redirecting to locations page.`,
              variant: "destructive"
            });
            
            // Wait a moment before redirecting
            setTimeout(() => {
              navigate('/locations');
            }, 2000);
            
            setError('Location not found');
            setLoading(false);
            return;
          }

          setLocation(locationData as LocationData);
          processNearbyAndFaqs(locationData as LocationData);
          
        } catch (fetchError) {
          console.error("Error fetching location data:", fetchError);
          // Use fallback data if available
          if (slug && fallbackLocationData[slug]) {
            console.log("Using fallback data after fetch error for:", slug);
            setLocation(fallbackLocationData[slug]);
            processNearbyAndFaqs(fallbackLocationData[slug]);
          } else {
            // Try to find it in our local data again as a last resort
            const localLocation = deliveryLocations.find(loc => 
              loc.slug?.toLowerCase() === slug?.toLowerCase() || 
              (loc.city.toLowerCase() + '-' + loc.state.toLowerCase().substring(0, 2)) === slug?.toLowerCase()
            );
            
            if (localLocation) {
              const locationData: LocationData = {
                city: localLocation.city,
                state: localLocation.state,
                region: localLocation.region || `${localLocation.state} Region`,
                slug: localLocation.slug || slug || '',
                title: localLocation.title || `Gravel Delivery in ${localLocation.city}, ${localLocation.state}`,
                description: localLocation.description || `Fast and reliable gravel delivery in ${localLocation.city}, ${localLocation.state}`,
                service_area: `${localLocation.city} and surrounding areas`,
                local_info: `${localLocation.city} homeowners and contractors trust our premium gravel delivery service for landscaping and construction projects.`,
                delivery_info: `We deliver throughout the ${localLocation.city} area 7 days a week. Most orders can be delivered same-day when ordered before noon, or next-day for orders placed later.`,
                image_url: `https://images.unsplash.com/photo-${Math.floor(Math.random()*1000000000)}`
              };
              
              setLocation(locationData);
              processNearbyAndFaqs(locationData);
            } else {
              toast({
                title: "Location data error",
                description: "Error loading location data. Redirecting to all locations.",
                variant: "destructive"
              });
              
              setTimeout(() => {
                navigate('/locations');
              }, 2000);
              
              setError('Error loading location data');
            }
          }
        }
        
      } catch (err) {
        console.error("Error in location processing:", err);
        setError('Error processing location data');
        
        toast({
          title: "Error",
          description: "Something went wrong loading this location. Please try again.",
          variant: "destructive"
        });
        
        setTimeout(() => {
          navigate('/locations');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    const processNearbyAndFaqs = (locationData: LocationData) => {
      // Process nearby locations if any
      if (locationData.nearby_locations) {
        const nearbySlugs = locationData.nearby_locations.split(',').map(s => s.trim());
        const nearby = nearbySlugs
          .map(nearbySlug => fallbackLocationData[nearbySlug])
          .filter(Boolean);
        setNearbyLocations(nearby);
      } else {
        // Add some default nearby locations based on state
        const sameStateLocations = Object.values(fallbackLocationData)
          .filter(loc => 
            loc.state === locationData.state && 
            loc.slug !== locationData.slug
          )
          .slice(0, 2);
        
        setNearbyLocations(sameStateLocations);
      }

      // Process FAQs if any
      if (locationData.faqs) {
        try {
          const faqsData = JSON.parse(locationData.faqs);
          setFaqs(faqsData);
        } catch (e) {
          console.error("Error parsing FAQs:", e);
          // Default FAQs if parsing fails
          setDefaultFaqs(locationData);
        }
      } else {
        // Default FAQs if none provided
        setDefaultFaqs(locationData);
      }
    };

    const setDefaultFaqs = (locationData: LocationData) => {
      setFaqs([
        {
          question: `How soon can you deliver gravel in ${locationData.city}?`,
          answer: "Most deliveries arrive within 24-48 hours of order confirmation. Same-day delivery may be available for orders placed before 10am."
        },
        {
          question: "What's your minimum order quantity?",
          answer: "Our minimum order is typically 1 cubic yard for most materials. This is enough to cover approximately 100 square feet at 3 inches depth."
        },
        {
          question: `Do you offer weekend delivery in ${locationData.city}?`, 
          answer: `Yes, we offer weekend delivery in ${locationData.city} and surrounding areas for a small additional fee. Saturday deliveries are more readily available than Sunday.`
        },
        {
          question: "What types of gravel do you deliver?",
          answer: "We offer a wide range of gravels including decorative river rock, crushed stone, pea gravel, limestone, granite, and specialty landscaping stones in various sizes and colors."
        }
      ]);
    };

    if (slug) {
      fetchLocation();
    }
  }, [slug, navigate]);

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
          <p className="text-gray-600 mb-4">The location you're looking for doesn't exist or couldn't be loaded.</p>
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
        <title>{location?.title || `Gravel Delivery Location`}</title>
        <meta name="description" content={location?.meta_description || location?.description || "Gravel delivery information for this location."} />
        <meta property="og:title" content={location?.title || `Gravel Delivery Location`} />
        <meta property="og:description" content={location?.meta_description || location?.description || "Gravel delivery information for this location."} />
        {location?.image_url && <meta property="og:image" content={location.image_url} />}
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
                    {location.service_area && location.service_area.split(',').map((area, index) => (
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
                            className="flex items-center text-foreground hover:text-primary hover:underline"
                          >
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
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
