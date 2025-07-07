
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, NotebookPen, Calculator, Store, ThumbsUp, Phone, House, MapPin, DollarSign, X, Mails, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from '../contexts/CartContext';
import { useZipCode } from '../contexts/ZipCodeContext';
import ZipCodeSearch from './zip-code/ZipCodeSearch';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const Navbar = () => {
  const { items } = useCart();
  const { zipCode, zipCodeData, clearZipCode, isSearchLocked } = useZipCode();
  const totalItems = items.reduce((sum, item) => sum + item.tons, 0);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const links = [
    { href: "/", label: "Home", icon: <House className="h-5 w-5 mr-2" /> },
    { href: "/shop", label: "Shop", icon: <Store className="h-5 w-5 mr-2" /> },
    { href: "/product-calculator", label: "Calculator", icon: <Calculator className="h-5 w-5 mr-2" /> },
//    { href: "/quiz", label: "Plan Project", icon: <NotebookPen className="h-5 w-5 mr-2" /> },
    { href: "/about", label: "About", icon: <Sparkles className="h-5 w-5 mr-2" /> },
    { href: "/contact", label: "Quote", icon: <Mails className="h-5 w-5 mr-2" /> },
  ];

  const mobileLinks = [
    { href: "/shop", label: "Shop", icon: <Store className="h-6 w-6" /> },
    { href: "/product-calculator", label: "Calculator", icon: <Calculator className="h-6 w-6" /> },
  ];

  const handleMenuClick = () => {
    setIsOpen(false);
  };

  const handleClearZipCode = () => {
    clearZipCode();
  };

  return (
    <>
      {/* Mobile/Tablet Logo Overlay - positioned to not cover top banner text */}
      <div className="lg:hidden fixed left-4 top-6 z-50 pointer-events-none">
        <Link to="/" className="pointer-events-auto">
          <img 
            src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//mygravelguy_logo_150x200.png" 
            alt="My Gravel Guy Logo" 
            className="h-16 w-auto"
          />  
        </Link>
      </div>

      <nav className="bg-white dark:bg-gray-900 border-b z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            <div className="flex-1">
              {/* Desktop Logo positioned to the left */}
              <div className="hidden lg:block absolute left-4 lg:left-[calc((100%-72rem)/2+1rem)] -top-1 z-50 mt-[3px] flex items-center gap-2">
                <Link to="/">
                  <img 
                    src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//mygravelguy_wide_logo.png" 
                    alt="My Gravel Guy Logo" 
                    className="h-20 w-auto"
                  />  
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              {zipCode && zipCodeData && !isSearchLocked && (
                <Button variant="ghost" size="sm" className="text-xs mr-2 font-playfair">
                  <MapPin className="h-3 w-3 mr-1" />
                  {zipCodeData.city}, {zipCodeData.state_id}
                </Button>
              )}
              
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 rounded-md text-[1.1rem] font-medium inline-flex items-center font-playfair"
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

            <div className="flex items-center lg:hidden gap-2 ml-20">
              {/* Mobile links with icons */}
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="relative"
                >
                  <Button variant="ghost" size="icon">
                    {link.icon}
                    <span className="sr-only">{link.label}</span>
                  </Button>
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
                            <div className="text-xs text-gray-500">{zipCode}</div>
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
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 rounded-md text-[1.1rem] font-medium inline-flex items-center font-playfair"
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
    </>
  );
};

export default Navbar;
