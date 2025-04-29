
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSheetData } from '../utils/googleSheets';
import ZipCodeSearch from '../components/ZipCodeSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryLocation, generateLocationSlug } from '@/types/location.types';
import { deliveryLocations } from '@/data/locations';

// Updated to use the Products sheet ID which is known to work
const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";
const SHEET_NAME = "Locations";

type LocationData = DeliveryLocation;

// Fallback locations from our static data files
const fallbackLocations = deliveryLocations;

const LocationsIndex = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [locationsByState, setLocationsByState] = useState<Record<string, LocationData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [states, setStates] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        console.log("Fetching locations from sheet:", SHEET_ID, SHEET_NAME);
        const data = await fetchSheetData(SHEET_ID, SHEET_NAME);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.error("No location data found or invalid data format");
          console.log("Using fallback location data instead");
          processLocationData(fallbackLocations);
          return;
        }
        
        const processedLocations: DeliveryLocation[] = data.map((row: any) => {
          const city = row.city || "Unknown City";
          const state = row.state || "Unknown State";
          
          // IMPORTANT: Always use the slug from the Google Sheet if available
          // Otherwise generate one as a fallback
          let slug = row.slug;
          if (!slug || slug.trim() === '') {
            slug = generateLocationSlug(city, state);
            console.log(`No slug found in sheet for ${city}, ${state}. Generated: ${slug}`);
          } else {
            console.log(`Using sheet slug for ${city}, ${state}: ${slug}`);
          }
          
          return {
            city,
            state,
            product_name: row.product_name || "Gravel Delivery",
            lat: parseFloat(row.lat) || 0,
            lng: parseFloat(row.lng) || 0,
            region: row.region || "",
            slug: slug,
            title: row.title || `Gravel Delivery in ${city}, ${state}`,
            description: row.description || `Fast and reliable gravel delivery services in ${city}.`,
            meta_description: row.meta_description || `Professional gravel delivery in ${city}, ${state} with competitive pricing and reliable service.`,
            local_info: row.local_info || `${city} homeowners and contractors trust our premium gravel delivery service for landscaping and construction projects.`,
            delivery_info: row.delivery_info || `We deliver throughout the ${city} area 7 days a week. Most orders can be delivered same-day when ordered before noon, or next-day for orders placed later.`,
            service_area: row.service_area || `${city} and surrounding areas`
          };
        });
        
        console.log("Fetched locations from Google Sheet:", processedLocations.length);
        console.log("Sample location slugs:", processedLocations.slice(0, 5).map(l => l.slug));
        processLocationData(processedLocations);
        
      } catch (err) {
        console.error("Error fetching locations:", err);
        console.log("Using fallback location data instead");
        processLocationData(fallbackLocations);
        setError('Using local location data. Google Sheet data unavailable.');
      } finally {
        setLoading(false);
      }
    };
    
    const processLocationData = (data: DeliveryLocation[]) => {
      const processedLocations = data.map(location => {
        // If slug is not already defined, generate one
        if (!location.slug) {
          // Ensure we have a valid state abbreviation
          const stateAbbr = location.state.length === 2 ? location.state : location.state.substring(0, 2).toUpperCase();
          location.slug = generateLocationSlug(location.city, stateAbbr);
          console.log(`Generated slug for location: ${location.city}, ${location.state} -> ${location.slug}`);
        } else {
          console.log(`Using existing slug for ${location.city}, ${location.state}: ${location.slug}`);
        }
        
        return location;
      });
      
      setLocations(processedLocations);
      
      const groupedByState: Record<string, DeliveryLocation[]> = {};
      processedLocations.forEach((location: any) => {
        const state = location.state || 'Other';
        if (!groupedByState[state]) {
          groupedByState[state] = [];
        }
        groupedByState[state].push(location);
      });
      
      Object.keys(groupedByState).forEach(state => {
        groupedByState[state].sort((a, b) => a.city.localeCompare(b.city));
      });
      
      setLocationsByState(groupedByState);
      setStates(Object.keys(groupedByState).sort());
    };
    
    fetchLocations();
  }, []);
  
  const filteredStates = searchTerm 
    ? Object.keys(locationsByState).reduce((acc, state) => {
        const filteredLocations = locationsByState[state].filter(location => 
          location.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
          location.state.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filteredLocations.length > 0) {
          acc[state] = filteredLocations;
        }
        
        return acc;
      }, {} as Record<string, LocationData[]>)
    : locationsByState;
  
  const filteredStatesList = Object.keys(filteredStates).sort();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Helmet>
        <title>Gravel Delivery Locations | Service Areas</title>
        <meta name="description" content="Find gravel delivery service areas near you. We deliver gravel, sand, and dirt across multiple locations." />
      </Helmet>
      
      <div className="relative py-20 px-4 bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center text-sm mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <span>Locations</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Gravel Delivery Service Areas
          </h1>
          <p className="text-lg max-w-2xl mb-8">
            Find local gravel, sand, and dirt delivery services in your area. We offer competitive rates and reliable delivery across multiple locations.
          </p>
          
          <div className="max-w-md">
            <ZipCodeSearch />
          </div>
        </div>
      </div>
      
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Browse Delivery Locations</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3 mb-4" />
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-10"
                    placeholder="Search by city or state..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {filteredStatesList.length === 0 ? (
                <div className="text-center py-8">
                  <p>No locations found for "{searchTerm}"</p>
                </div>
              ) : (
                <Tabs defaultValue={filteredStatesList[0]}>
                  <TabsList className="flex flex-wrap mb-6 overflow-x-auto">
                    {filteredStatesList.map(state => (
                      <TabsTrigger key={state} value={state} className="mb-2">
                        {state}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {filteredStatesList.map(state => (
                    <TabsContent key={state} value={state}>
                      <h3 className="text-2xl font-semibold mb-6">
                        {state} Delivery Locations
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStates[state].map((location, index) => {
                          // Make sure we have a valid slug
                          const locationSlug = location.slug || generateLocationSlug(location.city, location.state);
                          
                          return (
                            <Link 
                              key={index} 
                              to={`/locations/${locationSlug}`}
                              className="block transition-all duration-200 hover:scale-[1.02]"
                              aria-label={`View details for ${location.city}, ${location.state}`}
                            >
                              <Card className="h-full hover:shadow-lg transition-shadow border border-transparent hover:border-primary/20 group cursor-pointer">
                                <CardContent className="p-6 h-full flex flex-col">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                        {location.city}
                                      </h4>
                                      <div className="flex items-center text-sm text-gray-600 mb-4">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <span>{location.state}</span>
                                      </div>
                                    </div>
                                    <div className="rounded-full bg-gray-100 p-1 group-hover:bg-primary/10 transition-colors">
                                      <ArrowRight className="h-5 w-5 text-primary" />
                                    </div>
                                  </div>
                                  <p className="text-sm line-clamp-3">
                                    {location.description && location.description.length > 120 
                                      ? `${location.description.substring(0, 120)}...` 
                                      : location.description || "Fast and reliable gravel delivery services."
                                    }
                                  </p>
                                  <div className="mt-auto pt-4">
                                    <span className="text-sm font-medium text-primary group-hover:underline transition-colors">
                                      View Delivery Information
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default LocationsIndex;
