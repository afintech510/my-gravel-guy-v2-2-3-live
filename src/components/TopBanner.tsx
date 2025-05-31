
import React, { useState } from 'react';
import { MapPin, ChevronsRight } from 'lucide-react';
import { useZipCode } from '../contexts/ZipCodeContext';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import ZipCodeSearch from './zip-code/ZipCodeSearch';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface TopBannerProps {
  className?: string;
}

const TopBanner = ({ className }: TopBannerProps) => {
  const { zipCodeData } = useZipCode();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Use the city name and state from zipCodeData if available
  const locationText = zipCodeData ? 
    `${zipCodeData.city}, ${zipCodeData.state_id}` : 
    'Nationwide';
  
  // Callback to close the dialog when a ZIP code is selected
  const handleZipCodeSelected = () => {
    setDialogOpen(false);
  };
  
  return (
    <div className={cn(
      "bg-primary text-primary-foreground py-0.5 px-4 text-right md:text-center z-50 relative",
      className
    )}>
      <div className="max-w-6xl mx-auto flex items-center justify-end md:justify-center">
        <h3 className="text-sm font-roboto-mono font-bold">
          <span className="italic">FREE</span>{' '}DELIVERY{' '} 
           
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center underline hover:text-white transition-colors">
                <ChevronsRight className="h-3 w-5 ml-1" />
                {locationText}
                <MapPin className="h-3 w-3 ml-0.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Your Delivery Location</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your ZIP code to see delivery options and pricing for your area.
                </p>
                <ZipCodeSearch 
                  variant="minimal" 
                  className="w-full" 
                  onZipCodeSelected={handleZipCodeSelected}
                />
              </div>
            </DialogContent>
          </Dialog>
        </h3>
      </div>
    </div>
  );
};

export default TopBanner;
