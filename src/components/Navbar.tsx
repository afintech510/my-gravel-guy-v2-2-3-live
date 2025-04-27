
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, NotebookPen, Calculator, Store, ThumbsUp, Phone, House, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from '../contexts/CartContext';
import { useZipCode } from '../contexts/ZipCodeContext';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ServiceAreaList from './ServiceAreaList';

const Navbar = () => {
  const { items } = useCart();
  const { zipCode, zipCodeData, clearZipCode } = useZipCode();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const links = [
    { href: "/", label: "Home", icon: <House className="h-4 w-4 mr-1" /> },
    { href: "/products", label: "Shop", icon: <Store className="h-4 w-4 mr-1" /> },
    { href: "/calculator", label: "Calculator", icon: <Calculator className="h-4 w-4 mr-1" /> },
    { href: "/quiz", label: "Plan Project", icon: <NotebookPen className="h-4 w-4 mr-1" /> },
    { href: "/about", label: "About", icon: <ThumbsUp className="h-4 w-4 mr-1" /> },
    { href: "/contact", label: "Contact", icon: <Phone className="h-4 w-4 mr-1" /> },
  ];

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-bold text-xl">
            My Gravel Guy
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {zipCode && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {zipCodeData ? `${zipCodeData.city}, ${zipCodeData.state_id}` : zipCode}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold mb-1">Your Delivery Location</h2>
                        <p className="text-sm text-gray-500">
                          {zipCodeData ? (
                            <>ZIP {zipCode} - {zipCodeData.city}, {zipCodeData.state_name}</>
                          ) : (
                            <>ZIP {zipCode}</>
                          )}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={clearZipCode}>
                        Change
                      </Button>
                    </div>
                    <ServiceAreaList />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center"
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

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col space-y-4 mt-4">
                {zipCode && (
                  <div className="px-3 py-2 flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Delivery ZIP: {zipCode}</div>
                      {zipCodeData && (
                        <div className="text-xs text-gray-500">
                          {zipCodeData.city}, {zipCodeData.state_id}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {links.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/cart"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart {totalItems > 0 && `(${totalItems})`}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
