
import React, { useState, useEffect } from 'react';
import { getServiceAreasByState } from '../services/productService';
import { ZipCodeData } from '../services/productTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const ServiceAreaList = () => {
  const [serviceAreas, setServiceAreas] = useState<Record<string, ZipCodeData[]>>({});
  const [filteredAreas, setFilteredAreas] = useState<Record<string, ZipCodeData[]>>({});
  const [states, setStates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceAreas = async () => {
      try {
        setLoading(true);
        const areas = await getServiceAreasByState();
        setServiceAreas(areas);
        setFilteredAreas(areas);
        
        // Extract state names for tabs
        const stateNames = Object.keys(areas).sort();
        setStates(stateNames);
      } catch (error) {
        console.error("Error fetching service areas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceAreas();
  }, []);

  // Filter service areas when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAreas(serviceAreas);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered: Record<string, ZipCodeData[]> = {};

    Object.entries(serviceAreas).forEach(([state, zips]) => {
      const matchingZips = zips.filter(
        zip => 
          zip.zip.includes(term) || 
          zip.city.toLowerCase().includes(term) || 
          zip.county_name.toLowerCase().includes(term)
      );

      if (matchingZips.length > 0) {
        filtered[state] = matchingZips;
      }
    });

    setFilteredAreas(filtered);
  }, [searchTerm, serviceAreas]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No service areas found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search by ZIP, city, or county..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      </div>

      <Tabs defaultValue={states[0]}>
        <TabsList className="w-full overflow-x-auto flex whitespace-nowrap">
          {states.map((state) => (
            <TabsTrigger key={state} value={state} className="flex-shrink-0">
              {state}
            </TabsTrigger>
          ))}
        </TabsList>

        {states.map((state) => (
          <TabsContent key={state} value={state} className="max-h-[400px] overflow-y-auto">
            {filteredAreas[state] && filteredAreas[state].length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredAreas[state]
                  .sort((a, b) => a.zip.localeCompare(b.zip))
                  .map((zip) => (
                    <div key={zip.zip} className="p-2 border rounded">
                      <div className="font-medium">{zip.zip}</div>
                      <div className="text-xs text-gray-500">{zip.city}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {searchTerm 
                  ? "No matching areas found." 
                  : "No service areas in this state."}
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ServiceAreaList;
