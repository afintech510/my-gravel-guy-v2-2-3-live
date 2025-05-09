
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ZipCodeData } from '../services/productTypes';
import { supabase } from '@/integrations/supabase/client';
import { formatZipCodeData, saveLocationSearch } from '../utils/zipCodeUtils';

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
      detectUserLocation();
    }
  }, []);
  
  // Function to detect user's location using IP
  const detectUserLocation = async () => {
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
          // Found exact match for ZIP code
          const formattedZipData = formatZipCodeData(zipData);
          setZipCode(data.postal, formattedZipData);
        } else {
          await findAlternativeLocation(data.city);
        }
      }
    } catch (error) {
      console.error("Error detecting location:", error);
      findFallbackLocation();
    }
  };
  
  // Find location by city name
  const findAlternativeLocation = async (cityName: string) => {
    // Try to find by city name
    const { data: cityData, error: cityError } = await supabase
      .from('service_zip_codes')
      .select('*')
      .ilike('city', `${cityName}%`)
      .limit(1);
      
    if (cityData && cityData.length > 0) {
      // Found city match
      const formattedCityData = formatZipCodeData(cityData[0]);
      setZipCode(cityData[0].zip, formattedCityData);
    } else {
      findFallbackLocation();
    }
  };
  
  // Find any service location as fallback
  const findFallbackLocation = async () => {
    // If no matches, just get any service location as fallback
    const { data: anyZipData, error: anyError } = await supabase
      .from('service_zip_codes')
      .select('*')
      .limit(1);
      
    if (anyZipData && anyZipData.length > 0) {
      const formattedAnyData = formatZipCodeData(anyZipData[0]);
      setZipCode(anyZipData[0].zip, formattedAnyData);
    }
  };

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
