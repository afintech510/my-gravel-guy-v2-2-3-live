
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(
    localStorage.getItem('topBannerDismissed') !== 'true'
  );

  const handleDismiss = () => {
    localStorage.setItem('topBannerDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-sm flex items-center justify-center relative">
      <div className="text-center max-w-3xl mx-auto">
        Free delivery on orders over 10 tons! <Link to="/delivery" className="underline ml-1 font-medium">Check delivery info</Link>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
};

export default TopBanner;
