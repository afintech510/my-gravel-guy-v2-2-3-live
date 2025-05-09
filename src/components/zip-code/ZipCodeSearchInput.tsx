
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

interface ZipCodeSearchInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (e: React.FormEvent) => void;
  error: string | null;
  loading: boolean;
  searchCompleted: boolean;
  variant?: 'default' | 'minimal';
}

const ZipCodeSearchInput = ({
  inputValue,
  onInputChange,
  onSearch,
  error,
  loading,
  searchCompleted,
  variant = 'default'
}: ZipCodeSearchInputProps) => {
  return (
    <form onSubmit={onSearch} className="w-full">
      <div className="relative flex gap-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Enter ZIP code, city or state"
            value={inputValue}
            onChange={onInputChange}
            className={searchCompleted ? "pl-3" : "pl-9"}
          />
          {!searchCompleted && (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          
          {error && (
            <div className="text-red-500 text-xs mt-1 absolute bottom-[-20px] left-0 w-full">
              {error}
            </div>
          )}
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
                'Check Availability'
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ZipCodeSearchInput;
