
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useZipCode } from '../contexts/ZipCodeContext';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import ZipCodeSearch from './ZipCodeSearch';
import { cn } from '@/lib/utils';

interface TopBannerProps {
  className?: string;
}

const TopBanner = ({ className }: TopBannerProps) => {
  const { zipCodeData } = useZipCode();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Use the city name from zipCodeData if available
  const cityName = zipCodeData?.city || 'Your Area';
  
  return (
    <div className={cn(
      "bg-primary text-primary-foreground py-2 px-4 text-center relative", 
      className
    )}>
      <div className="max-w-6xl mx-auto flex items-center justify-center">
        <h3 className="text-sm font-semibold">
          FREE Delivery in{' '}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center underline hover:text-white transition-colors">
                {cityName}
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
                <ZipCodeSearch variant="minimal" className="w-full" />
              </div>
            </DialogContent>
          </Dialog>
          {' '}on PREMIUM Gravel
        </h3>
      </div>
    </div>
  );
};

export default TopBanner;
