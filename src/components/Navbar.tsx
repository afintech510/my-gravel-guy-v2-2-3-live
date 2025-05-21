
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, NotebookPen, Calculator, Store, ThumbsUp, Phone, House, MapPin, DollarSign, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from '../contexts/CartContext';
import { useZipCode } from '../contexts/ZipCodeContext';
import ZipCodeSearch from './zip-code/ZipCodeSearch';
import { useState } from 'react';

const Navbar = () => {
  const { items } = useCart();
  const { zipCode, zipCodeData, clearZipCode, isSearchLocked } = useZipCode();
  const totalItems = items.reduce((sum, item) => sum + item.tons, 0);
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: <House className="h-4 w-4 mr-1" /> },
    { href: "/products", label: "Shop", icon: <Store className="h-4 w-4 mr-1" /> },
    { href: "/calculator-shop", label: "Calculator", icon: <Calculator className="h-4 w-4 mr-1" /> },
//    { href: "/quiz", label: "Plan Project", icon: <NotebookPen className="h-4 w-4 mr-1" /> },
    { href: "/about", label: "About", icon: <ThumbsUp className="h-4 w-4 mr-1" /> },
    { href: "/contact", label: "Quote", icon: <DollarSign className="h-4 w-4 mr-1" /> },
  ];

  const handleMenuClick = () => {
    setIsOpen(false);
  };

  const handleClearZipCode = () => {
    clearZipCode();
  };

  return (
    <nav className="bg-white border-b z-40"> {/* Removed pt-14 padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14"> {/* Reduced height from 16 to 14 */}
          <div className="flex-1">
                  {/* Logo floating above banner and navbar */}
                      <Link <Link to="/" className="absolute left-4 sm:left-6 lg:left-8 -top-3 z-50">
                        <img 
                          src="/lovable-uploads/04048679-bd9f-42de-b2d0-70fddf60125e.png" 
                          alt="My Gravel Guy Logo" 
                          className="h-24 w-auto" /* Slightly reduced height from 28 to 24 */
                        />  
                      </Link>
          </div> {/* Space filler where logo was */}

          <div className="hidden md:flex items-center space-x-4">
            {zipCode && zipCodeData && !isSearchLocked && (
              <Button variant="ghost" size="sm" className="text-xs mr-2">
                <MapPin className="h-3 w-3 mr-1" />
                {zipCodeData.city}, {zipCodeData.state_id}
              </Button>
            )}
            
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[1.1rem] font-medium inline-flex items-center" // Changed from text-sm to text-[1.1rem] (10% increase)
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          <div className="flex items-center md:hidden gap-2">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-4">
                  {zipCode && zipCodeData && (
                    <div className="px-3 py-2 rounded-md bg-primary/5 flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">{zipCodeData.city}, {zipCodeData.state_id}</div>
                          <div className="text-xs text-gray-500">ZIP: {zipCode}</div>
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
                  
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-[1.1rem] font-medium inline-flex items-center" // Changed from text-sm to text-[1.1rem] (10% increase) for mobile menu too
                      onClick={handleMenuClick}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
