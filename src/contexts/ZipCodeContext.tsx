import React, { createContext, useContext, useState, useEffect } from 'react';
import { ZipCodeData } from '../services/productTypes';
import { saveLocationSearch } from '../utils/zipCodeUtils';
import { detectUserLocation } from '../services/zipCodeService';

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
  // Load initial ZIP code and data from localStorage
  const initialZipCode = typeof window !== 'undefined' 
    ? localStorage.getItem('userZipCode')
    : null;
  
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
      handleLocationDetection();
    }
  }, []);
  
  // Function to handle location detection
  const handleLocationDetection = async () => {
    const result = await detectUserLocation();
    
    if (result.zipCode && result.zipCodeData) {
      setZipCode(result.zipCode, result.zipCodeData);
    }
  };

  // Enhanced setZipCode function with better session management
  const setZipCode = (newZipCode: string | null, data?: ZipCodeData | null) => {
    console.log('[ZipCodeContext] Setting ZIP code:', newZipCode, 'with data:', data);
    
    setZipCodeState(newZipCode);
    
    if (data) {
      setZipCodeData(data);
      // Save data to localStorage
      localStorage.setItem('userZipCodeData', JSON.stringify(data));
      console.log('[ZipCodeContext] Saved ZIP code data to localStorage');
    } else if (newZipCode === null) {
      setZipCodeData(null);
      localStorage.removeItem('userZipCodeData');
      console.log('[ZipCodeContext] Cleared ZIP code data from localStorage');
    }
    
    // Save to localStorage for persistence
    if (newZipCode) {
      localStorage.setItem('userZipCode', newZipCode);
      // When setting a zipCode, also lock the search
      setIsSearchLocked(true);
      console.log('[ZipCodeContext] ZIP code session updated:', newZipCode);
    } else {
      localStorage.removeItem('userZipCode');
      setIsSearchLocked(false);
      console.log('[ZipCodeContext] ZIP code session cleared');
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
  
  // Function to clear ZIP code
  const clearZipCode = () => {
    setZipCodeState(null);
    setZipCodeData(null);
    setIsSearchLocked(false);
    localStorage.removeItem('userZipCode');
    localStorage.removeItem('userZipCodeData');
  };

  // Provide context value
  const contextValue = {
    zipCode,
    zipCodeData,
    setZipCode,
    clearZipCode,
    searchQuery,
    setSearchQuery,
    isSearchLocked,
    setIsSearchLocked
  };

  return (
    <ZipCodeContext.Provider value={contextValue}>
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
