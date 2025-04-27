
import React, { createContext, useContext, useState } from 'react';
import { ZipCodeData } from '../services/productService';

interface ZipCodeContextType {
  zipCode: string | null;
  zipCodeData: ZipCodeData | null;
  setZipCode: (zipCode: string | null, data?: ZipCodeData | null) => void;
  clearZipCode: () => void;
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
    } else {
      localStorage.removeItem('userZipCode');
    }
  };
  
  const clearZipCode = () => {
    setZipCodeState(null);
    setZipCodeData(null);
    localStorage.removeItem('userZipCode');
    localStorage.removeItem('userZipCodeData');
  };

  return (
    <ZipCodeContext.Provider 
      value={{ 
        zipCode, 
        zipCodeData, 
        setZipCode, 
        clearZipCode 
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
