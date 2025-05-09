import React, { createContext, useContext, useState, useEffect } from 'react';
import { ZipCodeData } from '../services/productTypes';
import { supabase } from '@/integrations/supabase/client';

interface ZipCodeContextType {
  zipCode: string | null;
  zipCodeData: ZipCodeData | null;
  setZipCode: (zipCode: string | null, data?: ZipCodeData | null) => void;
  clearZipCode: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchLocked: boolean;
  setIsSearchLocked: (locked: boolean) => void;
}

const ZipCodeContext = createContext<ZipCodeContextType | undefined>(undefined);

export function ZipCodeProvider({ children }: { children: React.ReactNode }) {
  // Try to get the ZIP code from localStorage first
  const initialZipCode = typeof window !== 'undefined' 
    ? localStorage.getItem('userZipCode')
    : null;
  
  // Try to get ZIP code data from localStorage
  const initialZipCodeDataStr = typeof window !== 'undefined'
    ? localStorage.getItem('userZipCodeData')
    : null;
  
  let initialZipCodeData: ZipCodeData | null = null;
  if (initialZipCodeDataStr) {
    try {
      initialZipCodeData = JSON.parse(initialZipCodeDataStr);
    } catch (e) {
      console.error("Error parsing ZIP code data from localStorage:", e);
    }
  }
  
  const [zipCode, setZipCodeState] = useState<string | null>(initialZipCode);
  const [zipCodeData, setZipCodeData] = useState<ZipCodeData | null>(initialZipCodeData);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchLocked, setIsSearchLocked] = useState<boolean>(!!initialZipCode);

  // Auto-detect user's location on initial load if no zipCode is set
  useEffect(() => {
    if (!zipCode) {
      const detectLocation = async () => {
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          
          if (data.postal && data.city && data.region) {
            console.log("Auto-detected location:", data);
            
            // Check if the detected zip code is in our service area
            const { data: zipData, error } = await supabase
              .from('service_zip_codes')
              .select('*')
              .eq('zip', data.postal)
              .maybeSingle();
              
            if (zipData) {
              // Found exact match for ZIP code with proper type conversion
              const formattedZipData: ZipCodeData = {
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
              
              setZipCode(data.postal, formattedZipData);
              setIsSearchLocked(true);
            } else {
              // Try to find by city name
              const { data: cityData, error: cityError } = await supabase
                .from('service_zip_codes')
                .select('*')
                .ilike('city', `${data.city}%`)
                .limit(1);
                
              if (cityData && cityData.length > 0) {
                // Found city match with proper type conversion
                const formattedCityData: ZipCodeData = {
                  zip: cityData[0].zip,
                  lat: Number(cityData[0].lat) || 0,
                  lng: Number(cityData[0].lng) || 0,
                  city: cityData[0].city,
                  state_id: cityData[0].state_id,
                  state_name: cityData[0].state_name,
                  population: Number(cityData[0].population) || 0,
                  density: Number(cityData[0].density) || 0,
                  county_fips: cityData[0].county_fips,
                  county_name: cityData[0].county_name,
                  county_names_all: cityData[0].county_names_all,
                  county_fips_all: cityData[0].county_fips_all,
                  timezone: cityData[0].timezone
                };
                
                setZipCode(cityData[0].zip, formattedCityData);
                setIsSearchLocked(true);
              } else {
                // If no matches, just get any service location as fallback
                const { data: anyZipData, error: anyError } = await supabase
                  .from('service_zip_codes')
                  .select('*')
                  .limit(1);
                  
                if (anyZipData && anyZipData.length > 0) {
                  // Format any ZIP data with proper type conversion
                  const formattedAnyData: ZipCodeData = {
                    zip: anyZipData[0].zip,
                    lat: Number(anyZipData[0].lat) || 0,
                    lng: Number(anyZipData[0].lng) || 0,
                    city: anyZipData[0].city,
                    state_id: anyZipData[0].state_id,
                    state_name: anyZipData[0].state_name,
                    population: Number(anyZipData[0].population) || 0,
                    density: Number(anyZipData[0].density) || 0,
                    county_fips: anyZipData[0].county_fips,
                    county_name: anyZipData[0].county_name,
                    county_names_all: anyZipData[0].county_names_all,
                    county_fips_all: anyZipData[0].county_fips_all,
                    timezone: anyZipData[0].timezone
                  };
                  
                  setZipCode(anyZipData[0].zip, formattedAnyData);
                  setIsSearchLocked(true);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error detecting location:", error);
          // Fallback to any available service location
          const { data: anyZipData } = await supabase
            .from('service_zip_codes')
            .select('*')
            .limit(1);
            
          if (anyZipData && anyZipData.length > 0) {
            // Format fallback data with proper type conversion
            const formattedFallbackData: ZipCodeData = {
              zip: anyZipData[0].zip,
              lat: Number(anyZipData[0].lat) || 0,
              lng: Number(anyZipData[0].lng) || 0,
              city: anyZipData[0].city,
              state_id: anyZipData[0].state_id,
              state_name: anyZipData[0].state_name,
              population: Number(anyZipData[0].population) || 0,
              density: Number(anyZipData[0].density) || 0,
              county_fips: anyZipData[0].county_fips,
              county_name: anyZipData[0].county_name,
              county_names_all: anyZipData[0].county_names_all,
              county_fips_all: anyZipData[0].county_fips_all,
              timezone: anyZipData[0].timezone
            };
            
            setZipCode(anyZipData[0].zip, formattedFallbackData);
            setIsSearchLocked(true);
          }
        }
      };
      
      detectLocation();
    }
  }, []);

  const setZipCode = (newZipCode: string | null, data?: ZipCodeData | null) => {
    setZipCodeState(newZipCode);
    
    if (data) {
      setZipCodeData(data);
      
      // Save data to localStorage
      localStorage.setItem('userZipCodeData', JSON.stringify(data));
    } else if (newZipCode === null) {
      setZipCodeData(null);
      localStorage.removeItem('userZipCodeData');
    }
    
    // Save to localStorage for persistence
    if (newZipCode) {
      localStorage.setItem('userZipCode', newZipCode);
      // When setting a zipCode, also lock the search
      setIsSearchLocked(true);
    } else {
      localStorage.removeItem('userZipCode');
      setIsSearchLocked(false);
    }
    
    // Save search to location_search table
    if (newZipCode) {
      saveLocationSearch({
        search_text: newZipCode,
        zipcode: newZipCode,
        city: data?.city || null,
        state: data?.state_id || null,
      });
    }
  };
  
  const clearZipCode = () => {
    setZipCodeState(null);
    setZipCodeData(null);
    setIsSearchLocked(false);
    localStorage.removeItem('userZipCode');
    localStorage.removeItem('userZipCodeData');
  };

  // Function to save location search to the database
  const saveLocationSearch = async (searchData: {
    search_text: string;
    zipcode?: string | null;
    city?: string | null;
    state?: string | null;
  }) => {
    try {
      // Get IP address using ipify API
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip_address = ipData.ip;
      
      // Get user agent
      const user_agent = navigator.userAgent;
      
      // Insert into location_search table
      await supabase.from('location_search').insert([{
        search_text: searchData.search_text,
        ip_address,
        user_agent,
        zipcode: searchData.zipcode || null,
        city: searchData.city || null,
        state: searchData.state || null,
      }]);
      
    } catch (error) {
      console.error("Error saving location search:", error);
    }
  };

  return (
    <ZipCodeContext.Provider 
      value={{ 
        zipCode, 
        zipCodeData, 
        setZipCode, 
        clearZipCode,
        searchQuery,
        setSearchQuery,
        isSearchLocked,
        setIsSearchLocked
      }}
    >
      {children}
    </ZipCodeContext.Provider>
  );
}

export function useZipCode() {
  const context = useContext(ZipCodeContext);
  if (context === undefined) {
    throw new Error('useZipCode must be used within a ZipCodeProvider');
  }
  return context;
}
