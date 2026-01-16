
import React, { useState } from 'react';
import { MapPin, Moon } from 'lucide-react';
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
import { useTheme } from 'next-themes';

interface TopBannerProps {
  className?: string;
}

const TopBanner = ({ className }: TopBannerProps) => {
  const { zipCodeData } = useZipCode();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Use the city name and state from zipCodeData if available
  const locationText = zipCodeData ? 
    `${zipCodeData.city}, ${zipCodeData.state_id}` : 
    'Nationwide';
  
  // Callback to close the dialog when a ZIP code is selected
  const handleZipCodeSelected = () => {
    setDialogOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <div className={cn(
      "bg-primary text-primary-foreground py-0.5 px-4 z-50 relative",
      className
    )}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex-1" />
        
        <h3 className="text-sm font-roboto-mono font-bold text-center">
          <span className="italic">FREE</span>{' '}DELIVERY{' '} 
           
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center underline hover:text-white transition-colors">
                <img 
                  src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//wide-arrow.svg" 
                  alt="Arrow" 
                  className="h-3 w-5 ml-1"
                />
                {locationText}
                <MapPin className="h-3 w-3 ml-0.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md fixed left-[50%] translate-x-[-50%] top-4 sm:top-[50%] sm:translate-y-[-50%] translate-y-0">
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
        
        {/* Dark mode toggle - minimal moon icon */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={toggleTheme}
            className="p-1 hover:opacity-80 transition-opacity"
            aria-label="Toggle dark mode"
          >
            <Moon 
              className={cn(
                "h-4 w-4 text-primary-foreground transition-all",
                theme === 'dark' ? "fill-primary-foreground" : "fill-transparent"
              )} 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
