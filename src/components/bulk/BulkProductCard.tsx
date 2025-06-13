
import React from 'react';
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
  quantity?: number;
  onQuantityChange?: (newQuantity: number) => void;
}

export default function BulkProductCard({ 
  product, 
  isSelected = false, 
  onSelect,
  quantity = 5,
  onQuantityChange
}: BulkProductCardProps) {
  const { addToCart } = useCart();
  const { zipCode } = useZipCode();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Use the useProduct hook for real-time pricing
  const { adjustedPrice, priceDetails } = useProduct(
    product.slug, 
    zipCode, 
    quantity
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

  const cubicYards = calculateCubicYards(quantity);

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(3, quantity + change);
    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  const handleAddToCart = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // Default to 3 days from now

    addToCart({
      ...product,
      tons: quantity,
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
        "transition-all duration-200 cursor-pointer",
        isSelected ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md",
        // Fixed height for collapsed cards
        !isSelected && "h-80"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Collapsed View Content */}
        {!isSelected && (
          <>
            {/* Product Image - Fixed aspect ratio */}
            {product.image && (
              <div className="w-full aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden flex-shrink-0">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Product Info - Pinned to bottom */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Product name */}
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 line-clamp-2">
                    {product.name}
                  </h3>
                  {/* Starting price */}
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Starting at ${(displayStartingPrice * 3).toFixed(0)} for 3 tons delivered
                  </p>
                </div>
                {/* Expand Indicator */}
                <div className="flex items-center ml-2 text-gray-600 dark:text-gray-400 flex-shrink-0">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Expanded View Content */}
        {isSelected && (
          <>
            {/* Product Image and Basic Info */}
            <div className="flex flex-col gap-4 mb-4">
              {/* Larger Product Image */}
              {product.image && (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Product name */}
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                      {product.name}
                    </h3>
                    {/* Starting price */}
                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Starting at ${(displayStartingPrice * 3).toFixed(0)} for 3 tons delivered
                    </p>
                  </div>
                  {/* Collapse Indicator */}
                  <div className="flex items-center ml-2 text-gray-600 dark:text-gray-400">
                    <ChevronUp className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <div className="space-y-4 border-t pt-4 mt-4" onClick={(e) => e.stopPropagation()}>
              {/* Product Description in expanded view only */}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {product.description}
                <Link 
                  to={`/products/${product.slug}`}
                  className="ml-1 inline-flex items-center text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  More Details...
                </Link>
              </div>

              {/* Quantity Selector with Total Price */}
              <div className="flex items-start justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 3}
                    >
                      -
                    </Button>
                    <div className="px-4 py-2 border rounded text-center min-w-[80px]">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{quantity} tons</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">≡ {cubicYards.toFixed(1)} cu. yds.</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(1)}
                    >
                      +
                    </Button>
                  </div> 
                </div>

                {/* Total Price and Free Delivery */}
                <div className="text-right">
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${(displayPrice * quantity).toFixed(2)}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Total</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    FREE Delivery
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              {product.specifications && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Specifications</h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
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
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Common Uses</h4>
                  <div className="flex flex-wrap gap-1">
                    {product.uses.slice(0, 3).map((use, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
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
                  className="flex-1"
                  size="sm"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={handleViewDetails}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
