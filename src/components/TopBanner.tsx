
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ZipCodeSearch from './zip-code/ZipCodeSearch';
import { useZipCode } from '../contexts/ZipCodeContext';

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(
    localStorage.getItem('topBannerDismissed') !== 'true'
  );
  const { zipCode } = useZipCode();
  const [showZipSearch, setShowZipSearch] = useState(false);

  const handleDismiss = () => {
    localStorage.setItem('topBannerDismissed', 'true');
    setIsVisible(false);
  };

  const handleZipCodeSelected = () => {
    setShowZipSearch(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 flex items-center justify-between relative">
      <div className="text-center flex-1 font-medium">
        Free delivery on orders over 10 tons! <Link to="/delivery" className="underline ml-1 font-bold">Check delivery info</Link>
      </div>
      
      <div className="flex items-center space-x-4">
        {!showZipSearch && !zipCode ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-3 bg-transparent border-white hover:bg-white/10"
            onClick={() => setShowZipSearch(true)}
          >
            Enter ZIP Code
          </Button>
        ) : showZipSearch ? (
          <div className="w-48">
            <ZipCodeSearch variant="minimal" onZipCodeSelected={handleZipCodeSelected} />
          </div>
        ) : null}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
};

export default TopBanner;
