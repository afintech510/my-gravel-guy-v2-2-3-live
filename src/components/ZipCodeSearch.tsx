
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
  
  const { zipCode, zipCodeData, setZipCode, clearZipCode, isSearchLocked, setIsSearchLocked } = useZipCode();
  const { toast } = useToast();
  
  // Initialize input value with zip code if available
  useEffect(() => {
    if (zipCode && zipCodeData) {
      setInputValue(zipCode);
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
      
      if (!zipData) {
        setError("Location not found in our service area. Please try another.");
        return;
      }
      
      // Save ZIP code to context
      setZipCode(zipData.zip, zipData);
      
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
  };
  
  const handleUnlockSearch = () => {
    setIsSearchLocked(false);
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
                className="pr-10 pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              
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
