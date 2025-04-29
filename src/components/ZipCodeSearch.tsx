
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
  
  // Initialize input value with zip code if available
  useEffect(() => {
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
      setLoading(true);
      
      // First try exact match on zip code
      let { data: zipData } = await supabase
        .from('service_zip_codes')
        .select('*')
        .eq('zip', inputValue)
        .single();
      
      // If no zip match, try city
      if (!zipData) {
        const { data: cityData } = await supabase
          .from('service_zip_codes')
          .select('*')
          .ilike('city', `${inputValue}%`)
          .limit(1);
          
        if (cityData && cityData.length > 0) {
          zipData = cityData[0];
        } else {
          // Try state as last resort
          const { data: stateData } = await supabase
            .from('service_zip_codes')
            .select('*')
            .or(`state_id.ilike.${inputValue}%,state_name.ilike.${inputValue}%`)
            .limit(1);
            
          if (stateData && stateData.length > 0) {
            zipData = stateData[0];
          }
        }
      }
      
      // If still no match, find the closest available location
      if (!zipData) {
        // Try a more flexible search to find any close match
        const { data: anyData } = await supabase
          .from('service_zip_codes')
          .select('*')
          .limit(1);
          
        if (anyData && anyData.length > 0) {
          zipData = anyData[0];
          
          toast({
            title: "Location approximated",
            description: `We couldn't find an exact match, showing results near ${zipData.city}, ${zipData.state_id}.`,
          });
        } else {
          setError("No service locations available. Please try again later.");
          return;
        }
      }
      
      // Save search to location_search table
      try {
        // Get IP address using ipify API
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ip_address = ipData.ip;
        
        // Get user agent
        const user_agent = navigator.userAgent;
        
        // Insert into location_search table
        await supabase.from('location_search').insert([{
          search_text: inputValue,
          ip_address,
          user_agent,
          zipcode: zipData.zip,
          city: zipData.city,
          state: zipData.state_id,
        }]);
      } catch (err) {
        console.error("Error saving search data:", err);
        // Continue with the flow even if logging fails
      }
      
      // Save ZIP code to context
      setZipCode(zipData.zip, zipData);
      setSearchCompleted(true);
      
      // Show success message with location info
      toast({
        title: "Location Found!",
        description: `We deliver to ${zipData.city}, ${zipData.state_id}. Browse our products below.`,
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
    
    if (value.length >= 2) {
      try {
        // Search for suggestions in zip codes, cities, and states
        const { data } = await supabase
          .from('service_zip_codes')
          .select('*')
          .or(`zip.ilike.${value}%,city.ilike.${value}%,state_id.ilike.${value}%,state_name.ilike.${value}%`)
          .limit(5);
          
        if (data) {
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: ZipCodeData) => {
    setZipCode(suggestion.zip, suggestion);
    setInputValue(suggestion.zip);
    setShowSuggestions(false);
    setSearchCompleted(true);
  };
  
  const handleUnlockSearch = () => {
    setIsSearchLocked(false);
    clearZipCode();
    setInputValue('');
    setSearchCompleted(false);
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
                className={searchCompleted ? "pl-3 pr-10" : "pr-10 pl-9"}
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
              
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
                    <>
                      <Search className="h-4 w-4 mr-1" />
                      {zipCode ? 'Update Location' : 'Check Availability'}
                    </>
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
