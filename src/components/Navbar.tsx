
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, Calculator, Store, MapPin, X, HardHat, FileText, Zap, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from '../contexts/CartContext';
import { useZipCode } from '../contexts/ZipCodeContext';
import ZipCodeSearch from './zip-code/ZipCodeSearch';
import { useState } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { items } = useCart();
  const { zipCode, zipCodeData, clearZipCode, isSearchLocked } = useZipCode();
  const totalItems = items.reduce((sum, item) => sum + item.tons, 0);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const centerLinks = [
    { href: "/contractors", label: "Contractors", icon: <HardHat className="h-4 w-4 mr-1.5" /> },
    { href: "/shop", label: "Materials", icon: <Store className="h-4 w-4 mr-1.5" /> },
    { href: "/product-calculator", label: "Calculator", icon: <Calculator className="h-4 w-4 mr-1.5" /> },
    { href: "/contact", label: "Get Quote", icon: <FileText className="h-4 w-4 mr-1.5" /> },
  ];

  const mobileLinks = [
    { href: "/shop", label: "Order Now", icon: <Store className="h-5 w-5" /> },
    { href: "/product-calculator", label: "Calculator", icon: <Calculator className="h-5 w-5" /> },
  ];

  const handleMenuClick = () => {
    setIsOpen(false);
  };

  const handleClearZipCode = () => {
    clearZipCode();
  };

  return (
    <>
      {/* Mobile/Tablet Logo Overlay - positioned relative to the nav */}
      <div className="lg:hidden absolute left-4 -top-1 z-50 pointer-events-none">
        <Link to="/" className="pointer-events-auto">
          <img 
            src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//mygravelguy_logo_150x200.png" 
            alt="My Gravel Guy Logo" 
            className="h-14 w-auto"
          />  
        </Link>
      </div>

      <nav className="bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Left: Logo (desktop) */}
            <div className="flex-shrink-0 hidden lg:flex items-center gap-3">
              <Link to="/" className="flex items-center">
                <img 
                  src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//mygravelguy_wide_logo.png" 
                  alt="My Gravel Guy Logo" 
                  className="h-12 w-auto"
                />  
              </Link>
            </div>

            {/* Center: Navigation Links (desktop) */}
            <div className="hidden lg:flex items-center gap-1">
              {centerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-foreground/80 hover:text-foreground hover:bg-accent px-3 py-2 rounded-md text-sm font-medium inline-flex items-center font-montserrat transition-colors"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              
              {/* Pill badges */}
              <div className="flex items-center gap-2 ml-2">
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 text-primary border-primary/30 text-xs font-medium px-2 py-0.5"
                >
                  <Gift className="h-3 w-3 mr-1" />
                  Rewards
                </Badge>
                <Badge 
                  variant="outline" 
                  className="bg-accent text-accent-foreground border-border text-xs font-medium px-2 py-0.5"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Expedited
                </Badge>
              </div>
            </div>

            {/* Right: CTAs (desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              {zipCode && zipCodeData && !isSearchLocked && (
                <Button variant="ghost" size="sm" className="text-xs mr-1 font-montserrat">
                  <MapPin className="h-3 w-3 mr-1" />
                  {zipCodeData.city}, {zipCodeData.state_id}
                </Button>
              )}
              
              <Link to="/contact">
                <Button variant="outline" size="sm" className="font-montserrat text-sm">
                  Get a Fast Quote
                </Button>
              </Link>
              <Link to="/shop">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-montserrat text-sm font-semibold">
                  Order Now
                </Button>
              </Link>
              <Link to="/cart" className="relative ml-1">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile: Right side controls */}
            <div className="flex items-center lg:hidden gap-1 ml-auto">
              <Link to="/shop">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-montserrat text-xs font-semibold h-8 px-3">
                  Order
                </Button>
              </Link>
              
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
              
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-background">
                  <div className="flex flex-col space-y-3 mt-4">
                    {zipCode && zipCodeData && (
                      <div className="px-3 py-2 rounded-md bg-primary/5 border border-border flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <div>
                            <div className="font-medium">{zipCodeData.city}, {zipCodeData.state_id}</div>
                            <div className="text-xs text-muted-foreground">{zipCode}</div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={handleClearZipCode}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {!zipCode && (
                      <div className="px-3 py-2">
                        <ZipCodeSearch variant="minimal" />
                      </div>
                    )}
                    
                    {centerLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="px-3 py-2.5 rounded-md text-base font-medium inline-flex items-center font-montserrat text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
                        onClick={handleMenuClick}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    ))}
                    
                    <div className="border-t border-border pt-3 mt-2">
                      <div className="flex flex-wrap gap-2 px-3">
                        <Badge 
                          variant="outline" 
                          className="bg-primary/10 text-primary border-primary/30 text-xs font-medium px-2 py-1"
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          Contractor Rewards
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="bg-accent text-accent-foreground border-border text-xs font-medium px-2 py-1"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Expedited Options
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-3 mt-2 px-3 space-y-2">
                      <Link to="/contact" onClick={handleMenuClick}>
                        <Button variant="outline" className="w-full font-montserrat">
                          Get a Fast Quote
                        </Button>
                      </Link>
                      <Link to="/shop" onClick={handleMenuClick}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-montserrat font-semibold">
                          Order Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
