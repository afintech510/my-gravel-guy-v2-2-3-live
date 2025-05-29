import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { ZipCodeData } from '../services/productTypes';
import { useZipCode } from '../contexts/ZipCodeContext';
import {
  findZipCodeMatch,
  findZipCodeSuggestions,
  checkZipCodeTableExists,
  getDemoZipCode,
  saveLocationSearch
} from '../utils/zipCode';

export const useZipCodeSearch = (onZipCodeSelected?: () => void) => {
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
      setLoading(true);
      
      // Try to find a match for the input value
      const zipCodeData = await findZipCodeMatch(inputValue);
      
      // If we've found a match, use it
      if (zipCodeData) {
        console.log('Found match:', zipCodeData);
        
        // Save ZIP code to context
        setZipCode(zipCodeData.zip, zipCodeData);
        setSearchCompleted(true);
        setInputValue(zipCodeData.zip); // Update the input with the found ZIP code

        /*
        // Show success message with location info
        toast({
          title: "Location Found!",
          description: `We deliver to ${zipCodeData.city}, ${zipCodeData.state_id}. Browse our products below.`,
        });
        */
        
        // Call the callback if provided to close the dialog
        if (onZipCodeSelected) {
          onZipCodeSelected();
        }
        
        return;
      }
      
      // If no match found at all, check if there are any ZIP codes in the database
      const count = await checkZipCodeTableExists();
      
      // If the table is empty, use demo mode
      if (count === 0) {
        console.log('No ZIP codes in database. Using demo mode.');
        
        // Create a mock ZIP code data for demo purposes
        const demoZipData = getDemoZipCode();
        
        setZipCode(demoZipData.zip, demoZipData);
        setSearchCompleted(true);
        setInputValue(demoZipData.zip);

        /*
        toast({
          title: "Demo Mode",
          description: `Using demo location: ${demoZipData.city}, ${demoZipData.state_id}. This is because no ZIP codes are in the database yet.`,
        });
        */        
        
        // Call the callback if provided to close the dialog
        if (onZipCodeSelected) {
          onZipCodeSelected();
        }
        
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
    
    // Find suggestions if user has typed enough characters
    if (value.length >= 2) {
      const zipCodeSuggestions = await findZipCodeSuggestions(value);
      setSuggestions(zipCodeSuggestions);
      setShowSuggestions(zipCodeSuggestions.length > 0);
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

    /*
    toast({
      title: "Location Selected",
      description: `${suggestion.city}, ${suggestion.state_id} selected.`,
    });
    */
    
    // Call the callback if provided to close the dialog
    if (onZipCodeSelected) {
      onZipCodeSelected();
    }
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
