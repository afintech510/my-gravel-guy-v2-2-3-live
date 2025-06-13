
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useProduct } from '@/hooks/useProduct';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ShoppingCart, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface BulkProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function BulkProductCard({ product, isSelected = false, onSelect }: BulkProductCardProps) {
  const [selectedTons, setSelectedTons] = useState(5);
  const { addToCart } = useCart();
  const { zipCode } = useZipCode();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Use the useProduct hook for real-time pricing
  const { adjustedPrice, priceDetails } = useProduct(
    product.slug, 
    zipCode, 
    selectedTons
  );

  // Get the starting price for 3 tons to display under product name
  const { adjustedPrice: startingPrice } = useProduct(
    product.slug,
    zipCode,
    3
  );

  const displayPrice = adjustedPrice ?? product.price;
  const displayStartingPrice = startingPrice ?? product.price;

  // Calculate cubic yards from tons
  const calculateCubicYards = (tons: number) => {
    const tonYardRatio = product.tonYardRatio || 1.5;
    return tons / tonYardRatio;
  };

  const cubicYards = calculateCubicYards(selectedTons);

  const handleAddToCart = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // Default to 3 days from now

    addToCart({
      ...product,
      tons: selectedTons,
      deliveryDate,
      price: displayPrice
    });
    
    // Navigate to cart immediately after adding product
    navigate('/cart');
    
    // Scroll to top on mobile after navigation
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleViewDetails = () => {
    navigate(`/products/${product.slug}`);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <Card 
      className={cn(
        "h-fit transition-all duration-200 cursor-pointer bg-[#1a1a1a] border-gray-700",
        isSelected ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Product Image and Basic Info */}
        <div className="flex flex-col gap-4 mb-4">
          {/* Larger Product Image */}
          {product.image && (
            <div className="w-full aspect-square bg-gray-800 rounded-lg flex-shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Product name in neon green */}
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#14FF6A' }}>
                  {product.name}
                </h3>
                {/* Starting price in same green */}
                <p className="text-sm font-medium mb-2" style={{ color: '#14FF6A' }}>
                  Starting at ${(displayStartingPrice * 3).toFixed(0)} for 3 tons delivered
                </p>
              </div>
              {/* Expand/Collapse Indicator */}
              <div className="flex items-center ml-2" style={{ color: '#14FF6A' }}>
                {isSelected ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isSelected && (
          <div className="space-y-4 border-t border-gray-600 pt-4 mt-4" onClick={(e) => e.stopPropagation()}>
            {/* Product Description in expanded view only */}
            <div className="text-sm text-white">
              {product.description}
              <Link 
                to={`/products/${product.slug}`}
                className="ml-1 inline-flex items-center"
                style={{ color: '#14FF6A' }}
                onClick={(e) => e.stopPropagation()}
              >
                More Details...
              </Link>
            </div>

            {/* Quantity Selector with Total Price */}
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTons(Math.max(3, selectedTons - 1))}
                    disabled={selectedTons <= 3}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    -
                  </Button>
                  <div className="px-4 py-2 border border-gray-600 rounded text-center min-w-[80px] bg-gray-800">
                    <div className="text-sm font-medium text-white">{selectedTons} tons</div>
                    <div className="text-xs text-gray-400">≡ {cubicYards.toFixed(1)} cu. yds.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTons(selectedTons + 1)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    +
                  </Button>
                </div> 
              </div>

              {/* Total Price and Free Delivery */}
              <div className="text-right">
                <div className="mb-1">
                  <span className="text-2xl font-bold" style={{ color: '#14FF6A' }}>
                    ${(displayPrice * selectedTons).toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">Total</span>
                </div>
                <div className="text-sm text-white font-medium">
                  FREE Delivery
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            {product.specifications && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Specifications</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  {product.specifications.size && (
                    <p>Size: {product.specifications.size}</p>
                  )}
                  {product.specifications.color && (
                    <p>Color: {product.specifications.color}</p>
                  )}
                  {product.specifications.coverage && (
                    <p>Coverage: {product.specifications.coverage}</p>
                  )}
                </div>
              </div>
            )}

            {/* Uses */}
            {product.uses && product.uses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Common Uses</h4>
                <div className="flex flex-wrap gap-1">
                  {product.uses.slice(0, 3).map((use, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {use}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddToCart}
                className="flex-1 text-black"
                style={{ backgroundColor: '#14FF6A' }}
                size="sm"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={handleViewDetails}
                size="sm"
                className="flex-shrink-0 border-gray-600 text-white hover:bg-gray-700"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
