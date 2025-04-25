
import React, { createContext, useContext, useState } from 'react';

interface ZipCodeContextType {
  zipCode: string | null;
  setZipCode: (zipCode: string | null) => void;
}

const ZipCodeContext = createContext<ZipCodeContextType | undefined>(undefined);

export function ZipCodeProvider({ children }: { children: React.ReactNode }) {
  // Try to get the ZIP code from localStorage first
  const initialZipCode = typeof window !== 'undefined' 
    ? localStorage.getItem('userZipCode')
    : null;
  
  const [zipCode, setZipCodeState] = useState<string | null>(initialZipCode);

  const setZipCode = (newZipCode: string | null) => {
    setZipCodeState(newZipCode);
    
    // Save to localStorage for persistence
    if (newZipCode) {
      localStorage.setItem('userZipCode', newZipCode);
    } else {
      localStorage.removeItem('userZipCode');
    }
  };

  return (
    <ZipCodeContext.Provider value={{ zipCode, setZipCode }}>
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
