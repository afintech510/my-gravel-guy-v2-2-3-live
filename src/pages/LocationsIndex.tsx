
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
};

// Fallback location data to display when the API is not available
const fallbackLocations: LocationData[] = [
  {
    state: "Texas",
    city: "Austin",
    region: "Central Texas",
    slug: "austin-tx",
    title: "Gravel Delivery in Austin, TX",
    description: "Fast gravel and material delivery throughout Austin and surrounding areas. Same day and next day options available."
  },
  {
    state: "Texas",
    city: "Dallas",
    region: "North Texas",
    slug: "dallas-tx",
    title: "Gravel Delivery in Dallas, TX",
    description: "Premium gravel, sand, and dirt delivery to all Dallas neighborhoods with competitive pricing."
  },
  {
    state: "California",
    city: "Los Angeles",
    region: "Southern California",
    slug: "los-angeles-ca",
    title: "Gravel Delivery in Los Angeles, CA",
    description: "Professional gravel delivery across Los Angeles county, serving residential and commercial projects."
  },
  {
    state: "California",
    city: "San Francisco",
    region: "Northern California",
    slug: "san-francisco-ca",
    title: "Gravel Delivery in San Francisco, CA",
    description: "Reliable material delivery solutions for San Francisco and the Bay Area. Bulk discounts available."
  },
  {
    state: "Florida",
    city: "Miami",
    region: "South Florida",
    slug: "miami-fl",
    title: "Gravel Delivery in Miami, FL",
    description: "Fast and affordable gravel delivery services throughout Miami-Dade county. Perfect for landscaping projects."
  }
];

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
        // Replace with your actual Google Sheet ID and tab name
        const sheetId = '1g6vVui0lG54_iFX9CLJoWAHUh-UePQygm15Kq7z3noI';
        const sheetName = 'Locations';
        
        try {
          const data = await fetchSheetData(sheetId, sheetName);
          
          if (!Array.isArray(data) || data.length === 0) {
            console.log("No location data found, using fallback data");
            processLocationData(fallbackLocations);
            return;
          }
          
          processLocationData(data as LocationData[]);
        } catch (fetchError) {
          console.error("Error fetching location data:", fetchError);
          console.log("Using fallback location data instead");
          processLocationData(fallbackLocations);
        }
        
      } catch (err) {
        console.error("Error in location processing:", err);
        setError('Error processing locations');
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to process location data
    const processLocationData = (data: LocationData[]) => {
      setLocations(data);
      
      // Group locations by state
      const groupedByState: Record<string, LocationData[]> = {};
      data.forEach((location: any) => {
        const state = location.state || 'Other';
        if (!groupedByState[state]) {
          groupedByState[state] = [];
        }
        groupedByState[state].push(location);
      });
      
      // Sort locations within each state by city name
      Object.keys(groupedByState).forEach(state => {
        groupedByState[state].sort((a, b) => a.city.localeCompare(b.city));
      });
      
      setLocationsByState(groupedByState);
      setStates(Object.keys(groupedByState).sort());
    };
    
    fetchLocations();
  }, []);
  
  // Filter locations based on search term
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
            <div className="text-center py-8">
              <p className="text-xl">Loading locations...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
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
                  <TabsList className="flex flex-wrap mb-6">
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
                        {filteredStates[state].map((location, index) => (
                          <Card key={index}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold mb-2">
                                    {location.city}
                                  </h4>
                                  <div className="flex items-center text-sm text-gray-600 mb-4">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>{location.state}</span>
                                  </div>
                                </div>
                                <Button asChild variant="ghost" size="icon">
                                  <Link to={`/locations/${location.slug}`}>
                                    <ArrowRight className="h-5 w-5" />
                                  </Link>
                                </Button>
                              </div>
                              <p className="text-sm line-clamp-3">
                                {location.description.length > 120 
                                  ? `${location.description.substring(0, 120)}...` 
                                  : location.description
                                }
                              </p>
                              <Button asChild variant="link" className="p-0 h-auto mt-4">
                                <Link to={`/locations/${location.slug}`}>
                                  View Delivery Information
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
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
