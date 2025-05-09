
import React from 'react';
import { ZipCodeData } from '../../services/productTypes';

interface ZipCodeSuggestionProps {
  suggestions: ZipCodeData[];
  onSuggestionClick: (suggestion: ZipCodeData) => void;
  suggestionsRef: React.RefObject<HTMLDivElement>;
}

const ZipCodeSuggestion = ({ 
  suggestions, 
  onSuggestionClick,
  suggestionsRef
}: ZipCodeSuggestionProps) => {
  if (!suggestions.length) return null;
  
  return (
    <div 
      ref={suggestionsRef}
      className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border overflow-hidden"
    >
      <ul className="max-h-60 overflow-auto">
        {suggestions.map((suggestion) => (
          <li 
            key={suggestion.zip} 
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <div className="font-medium">{suggestion.city}, {suggestion.state_id}</div>
            <div className="text-xs text-gray-500">ZIP: {suggestion.zip}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ZipCodeSuggestion;
