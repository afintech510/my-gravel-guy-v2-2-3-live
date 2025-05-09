
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../services/productTypes';
import { useZipCode } from '../contexts/ZipCodeContext';

export const useZipCodeSearch = () => {
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
    console.log('ZipCode or zipCodeData changed:', { zipCode, zipCodeData });
    if (zipCode && zipCodeData) {
      setInputValue(zipCode);
      setSearchCompleted(true);
    }
  }, [zipCode, zipCodeData]);

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
        
        // Convert Supabase data to ZipCodeData format with proper type conversion
        const zipCodeData: ZipCodeData = {
          zip: zipData.zip,
          lat: Number(zipData.lat) || 0,
          lng: Number(zipData.lng) || 0,
          city: zipData.city,
          state_id: zipData.state_id,
          state_name: zipData.state_name,
          population: Number(zipData.population) || 0,
          density: Number(zipData.density) || 0,
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
          // Convert to ZipCodeData format with proper type conversion
          const zipCodeSuggestions: ZipCodeData[] = data.map(item => ({
            zip: item.zip,
            lat: Number(item.lat) || 0,
            lng: Number(item.lng) || 0,
            city: item.city,
            state_id: item.state_id,
            state_name: item.state_name,
            population: Number(item.population) || 0,
            density: Number(item.density) || 0,
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

  return {
    inputValue,
    loading,
    error,
    suggestions,
    showSuggestions,
    searchCompleted,
    isSearchLocked,
    zipCode,
    zipCodeData,
    handleSearch,
    handleInputChange,
    handleSuggestionClick,
    handleUnlockSearch,
    setShowSuggestions
  };
};
