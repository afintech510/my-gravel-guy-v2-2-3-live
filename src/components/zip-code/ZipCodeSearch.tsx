
import React from 'react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useZipCodeSearch } from '../../hooks/useZipCodeSearch';
import ZipCodeSuggestion from './ZipCodeSuggestion';
import ZipCodeSearchInput from './ZipCodeSearchInput';
import ZipCodeDisplay from './ZipCodeDisplay';

interface ZipCodeSearchProps {
  className?: string;
  variant?: 'default' | 'minimal';
  onZipCodeSelected?: () => void; // New callback prop
}

const ZipCodeSearch = ({ className, variant = 'default', onZipCodeSelected }: ZipCodeSearchProps) => {
  const {
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
  } = useZipCodeSearch(onZipCodeSelected); // Pass the callback to the hook
  
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Use the hook with our ref
  useClickOutside(() => {
    setShowSuggestions(false);
  }, suggestionsRef);

  return (
    <div className={cn("w-full max-w-md mx-auto relative", className)}>
      {isSearchLocked && zipCodeData ? (
        <ZipCodeDisplay 
          zipCode={zipCode} 
          zipCodeData={zipCodeData} 
          onUnlock={handleUnlockSearch}
        />
      ) : (
        <div className="relative">
          <ZipCodeSearchInput
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onSearch={handleSearch}
            error={error}
            loading={loading}
            searchCompleted={searchCompleted}
            variant={variant}
          />
          
          {showSuggestions && (
            <ZipCodeSuggestion
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
              suggestionsRef={suggestionsRef}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ZipCodeSearch;
