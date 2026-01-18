
import React, { useState } from 'react';
import { MapPin, Moon, Sun } from 'lucide-react';
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
  
  const locationText = zipCodeData ? 
    `${zipCodeData.city}, ${zipCodeData.state_id}` : 
    null;
  
  const handleZipCodeSelected = () => {
    setDialogOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <div className={cn(
      "bg-primary text-primary-foreground py-1 px-4 z-50 relative",
      className
    )}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Desktop: Theme toggle left */}
        <div className="hidden md:flex flex-1 justify-start">
          <button
            onClick={toggleTheme}
            className="p-1 hover:opacity-80 transition-opacity flex items-center gap-1 text-xs font-medium"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Center content */}
        <h3 className="text-xs sm:text-sm font-montserrat font-bold text-center tracking-wide">
          <span className="hidden sm:inline">CONTRACTOR PRIORITY DISPATCH</span>
          <span className="sm:hidden">CONTRACTOR PRIORITY</span>
          <span className="mx-2">•</span>
          <span className="hidden sm:inline">NATIONWIDE AGGREGATE DELIVERY</span>
          <span className="sm:hidden">NATIONWIDE</span>
        </h3>
        
        {/* Right: Location + Theme toggle on mobile */}
        <div className="flex flex-1 justify-end items-center gap-2">
          {locationText && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="hidden md:inline-flex items-center text-xs font-medium hover:opacity-80 transition-opacity">
                  <span className="mr-1">Delivering to:</span>
                  <span className="font-bold">{locationText}</span>
                  <MapPin className="h-3 w-3 ml-1" />
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
          )}
          
          {/* Mobile theme toggle */}
          <button
            onClick={toggleTheme}
            className="md:hidden p-1 hover:opacity-80 transition-opacity"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
