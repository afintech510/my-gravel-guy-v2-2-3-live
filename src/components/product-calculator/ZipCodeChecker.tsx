
import React, { useState } from 'react';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { Check, MapPin, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useZipCodeSearch } from '@/hooks/useZipCodeSearch';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function ZipCodeChecker() {
  const { zipCode, zipCodeData, clearZipCode } = useZipCode();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const { 
    inputValue, 
    handleInputChange, 
    handleSearch, 
    handleUnlockSearch, 
    isSearchLocked,
    loading,
    error,
    setShowSuggestions
  } = useZipCodeSearch(() => {
    // Callback when ZIP code is selected
    setIsEditing(false);
    /*
    toast({
      title: "ZIP code updated",
      description: "Your delivery location has been updated.",
    });
    */
  });

  // Check if delivery is available (for now, we'll assume it is if we have zip code data)
  const isDeliveryAvailable = !!zipCodeData;

  const handleChangeClick = () => {
    setIsEditing(true);
    handleUnlockSearch();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800">Delivery Availability</h3>
      
      {isDeliveryAvailable && !isEditing ? (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-700 font-medium">
                  FREE Delivery Available
                </p>
                <p className="text-sm text-gray-600">
                  to {zipCodeData.city}, {zipCodeData.state_id} ({zipCode})
                </p>
              </div>
            </div>
            <Button 
              onClick={handleChangeClick} 
              variant="ghost" 
              size="sm" 
              className="h-8 text-gray-500 hover:text-gray-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">
            Enter your ZIP code to check delivery availability in your area.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-grow">
              <MapPin className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Enter ZIP code"
                value={inputValue}
                onChange={handleInputChange}
                className={cn(
                  "pl-9",
                  isSearchLocked ? "bg-gray-50" : "",
                  error ? "border-red-300" : ""
                )}
                disabled={isSearchLocked || loading}
              />
            </div>
            
            <div className="flex gap-2">
              {isEditing && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              )}
              
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check'}
              </Button>
            </div>
          </form>
          
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
