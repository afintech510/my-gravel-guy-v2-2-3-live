
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useZipCode } from '../contexts/ZipCodeContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, X } from 'lucide-react';
import { ZipCodeData } from '../services/productTypes';
import { useClickOutside } from '@/hooks/use-click-outside';
import { cn } from '@/lib/utils';

interface ZipCodeSearchProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

const ZipCodeSearch = ({ className, variant = 'default' }: ZipCodeSearchProps) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ZipCodeData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  
  const { zipCode, zipCodeData, setZipCode, clearZipCode, isSearchLocked, setIsSearchLocked } = useZipCode();
  const { toast } = useToast();
  
  // Debug logs for initial state
  useEffect(() => {
    console.log('ZipCodeSearch mounted');
    console.log('Initial zipCode:', zipCode);
    console.log('Initial zipCodeData:', zipCodeData);
  }, []);
  
  // Initialize input value with zip code if available
  useEffect(() => {
    console.log('ZipCode or zipCodeData changed:', { zipCode, zipCodeData });
    if (zipCode && zipCodeData) {
      setInputValue(zipCode);
      setSearchCompleted(true);
    }
  }, [zipCode, zipCodeData]);
  
  const suggestionsRef = useClickOutside(() => {
    setShowSuggestions(false);
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!inputValue) {
      setError("Please enter a ZIP code, city, or state");
      return;
    }
    
    try {
      console.log('Searching for:', inputValue);
      setLoading(true);
      
      // First try exact match on zip code
      let { data: zipData, error: zipError } = await supabase
        .from('service_zip_codes')
        .select('*')
        .eq('zip', inputValue)
        .maybeSingle();
      
      console.log('ZIP exact match result:', { zipData, zipError });
      
      // If no zip match, try city
      if (!zipData) {
        const { data: cityData, error: cityError } = await supabase
          .from('service_zip_codes')
          .select('*')
          .ilike('city', `${inputValue}%`)
          .limit(1);
          
        console.log('City search result:', { cityData, cityError });
        
        if (cityData && cityData.length > 0) {
          zipData = cityData[0];
        } else {
          // Try state as last resort
          const { data: stateData, error: stateError } = await supabase
            .from('service_zip_codes')
            .select('*')
            .or(`state_id.ilike.${inputValue}%,state_name.ilike.${inputValue}%`)
            .limit(1);
            
          console.log('State search result:', { stateData, stateError });
          
          if (stateData && stateData.length > 0) {
            zipData = stateData[0];
          }
        }
      }
      
      // If we've found a match, use it
      if (zipData) {
        console.log('Found match:', zipData);
        
        // Convert Supabase data to ZipCodeData format
        const zipCodeData: ZipCodeData = {
          zip: zipData.zip,
          lat: zipData.lat,
          lng: zipData.lng,
          city: zipData.city,
          state_id: zipData.state_id,
          state_name: zipData.state_name,
          population: zipData.population,
          density: zipData.density,
          county_fips: zipData.county_fips,
          county_name: zipData.county_name,
          county_names_all: zipData.county_names_all,
          county_fips_all: zipData.county_fips_all,
          timezone: zipData.timezone
        };
        
        // Save ZIP code to context
        setZipCode(zipData.zip, zipCodeData);
        setSearchCompleted(true);
        setInputValue(zipData.zip); // Update the input with the found ZIP code
        
        // Show success message with location info
        toast({
          title: "Location Found!",
          description: `We deliver to ${zipData.city}, ${zipData.state_id}. Browse our products below.`,
        });
        return;
      }
      
      // If no match found at all, check if there are any ZIP codes in the database
      const { count, error: countError } = await supabase
        .from('service_zip_codes')
        .select('*', { count: 'exact', head: true });
        
      console.log('ZIP codes count in DB:', { count, countError });
      
      // If the table is empty, use demo mode
      if (count === 0) {
        console.log('No ZIP codes in database. Using demo mode.');
        
        // Create a mock ZIP code data for demo purposes
        const demoZipData: ZipCodeData = {
          zip: '90210',
          city: 'Beverly Hills',
          state_id: 'CA',
          state_name: 'California',
          lat: 34.0901,
          lng: -118.4065,
          timezone: 'America/Los_Angeles',
          population: 20000,
          density: 1000,
          county_fips: '123',
          county_name: 'Los Angeles',
          county_names_all: 'Los Angeles',
          county_fips_all: '123',
        };
        
        setZipCode(demoZipData.zip, demoZipData);
        setSearchCompleted(true);
        setInputValue(demoZipData.zip);
        
        toast({
          title: "Demo Mode",
          description: `Using demo location: ${demoZipData.city}, ${demoZipData.state_id}. This is because no ZIP codes are in the database yet.`,
        });
        return;
      }
      
      // If no specific match but there are ZIP codes in DB, show a general error
      setError("Location not found. Please try a different search term.");
      toast({
        title: "Location Not Found",
        description: "We couldn't find that location. Please try a different ZIP code, city, or state.",
        variant: "destructive"
      });
      
    } catch (error) {
      console.error("Error checking location:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };
  
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchCompleted(false);
    setError(null);
    
    if (value.length >= 2) {
      try {
        console.log('Searching for suggestions:', value);
        // Search for suggestions in zip codes, cities, and states
        const { data, error } = await supabase
          .from('service_zip_codes')
          .select('*')
          .or(`zip.ilike.${value}%,city.ilike.${value}%,state_id.ilike.${value}%,state_name.ilike.${value}%`)
          .limit(5);
          
        console.log('Suggestions result:', { data, error });
        
        if (data && data.length > 0) {
          // Convert to ZipCodeData format
          const zipCodeSuggestions: ZipCodeData[] = data.map(item => ({
            zip: item.zip,
            lat: item.lat,
            lng: item.lng,
            city: item.city,
            state_id: item.state_id,
            state_name: item.state_name,
            population: item.population,
            density: item.density,
            county_fips: item.county_fips,
            county_name: item.county_name,
            county_names_all: item.county_names_all,
            county_fips_all: item.county_fips_all,
            timezone: item.timezone
          }));
          
          setSuggestions(zipCodeSuggestions);
          setShowSuggestions(true);
        } else if (value.length >= 3) {
          // If no suggestions found but table has data, check if we have any data at all
          const { count } = await supabase
            .from('service_zip_codes')
            .select('*', { count: 'exact', head: true });
          
          console.log('ZIP codes count for suggestions:', count);
          
          if (count === 0) {
            // If table is empty, use demo suggestions
            const demoSuggestions: ZipCodeData[] = [
              {
                zip: '90210',
                city: 'Beverly Hills',
                state_id: 'CA',
                state_name: 'California',
                lat: 34.0901,
                lng: -118.4065,
                timezone: 'America/Los_Angeles',
                population: 20000,
                density: 1000,
                county_fips: '123',
                county_name: 'Los Angeles',
                county_names_all: 'Los Angeles',
                county_fips_all: '123',
              },
              {
                zip: '10001',
                city: 'New York',
                state_id: 'NY',
                state_name: 'New York',
                lat: 40.7128,
                lng: -74.006,
                timezone: 'America/New_York',
                population: 8000000,
                density: 10000,
                county_fips: '456',
                county_name: 'New York',
                county_names_all: 'New York',
                county_fips_all: '456',
              }
            ];
            
            setSuggestions(demoSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: ZipCodeData) => {
    console.log('Selected suggestion:', suggestion);
    setZipCode(suggestion.zip, suggestion);
    setInputValue(suggestion.zip);
    setShowSuggestions(false);
    setSearchCompleted(true);
    setError(null);
    
    toast({
      title: "Location Selected",
      description: `${suggestion.city}, ${suggestion.state_id} selected.`,
    });
  };
  
  const handleUnlockSearch = () => {
    setIsSearchLocked(false);
    clearZipCode();
    setInputValue('');
    setSearchCompleted(false);
    setError(null);
  };

  return (
    <div className={cn("w-full max-w-md mx-auto relative", className)}>
      {isSearchLocked && zipCodeData ? (
        <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <div>
              <span className="font-medium">{zipCodeData.city}, {zipCodeData.state_id}</span>
              <div className="text-xs text-gray-500">ZIP: {zipCode}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-8 w-8 p-0" 
            onClick={handleUnlockSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative flex gap-2">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Enter ZIP code, city or state"
                value={inputValue}
                onChange={handleInputChange}
                className={searchCompleted ? "pl-3" : "pl-9"}
              />
              {!searchCompleted && (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef as React.RefObject<HTMLDivElement>}
                  className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border overflow-hidden"
                >
                  <ul className="max-h-60 overflow-auto">
                    {suggestions.map((suggestion) => (
                      <li 
                        key={suggestion.zip} 
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="font-medium">{suggestion.city}, {suggestion.state_id}</div>
                        <div className="text-xs text-gray-500">ZIP: {suggestion.zip}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {error && (
                <div className="text-red-500 text-xs mt-1 absolute bottom-[-20px] left-0 w-full">
                  {error}
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className={variant === 'minimal' ? 'px-3' : ''}>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
              ) : (
                <>
                  {variant === 'minimal' ? (
                    <Search className="h-4 w-4" />
                  ) : (
                    'Check Availability'
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ZipCodeSearch;
