
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

interface ShopProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function ShopProductCard({ product, isSelected = false, onSelect }: ShopProductCardProps) {
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

  // Get description to display - use short_description if available, otherwise use description
  const getDisplayDescription = () => {
    if (product.short_description && product.short_description.trim()) {
      return product.short_description;
    }
    // Fallback to truncated description if short_description is not available
    if (product.description) {
      return product.description.length > 100 
        ? product.description.substring(0, 100) + '...'
        : product.description;
    }
    return '';
  };

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
        "h-fit transition-all duration-200 cursor-pointer bg-card border-border",
        isSelected ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Product Image and Basic Info */}
        <div className="flex gap-4 mb-4">
          {product.image && (
            <div className="w-20 h-20 bg-muted rounded flex-shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover rounded"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground mb-1">{product.name}</h3>
                <p className="text-sm text-foreground font-medium mb-2">
                  Starting at ${(displayStartingPrice * 3).toFixed(0)} for 3 tons delivered
                </p>
              </div>
              {/* Expand/Collapse Indicator */}
              <div className="flex items-center text-primary ml-2">
                {isSelected ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {getDisplayDescription()}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isSelected && (
          <div className="space-y-4 border-t border-border pt-4 mt-4" onClick={(e) => e.stopPropagation()}>
            {/* Quantity Selector with Total Price */}
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTons(Math.max(3, selectedTons - 1))}
                    disabled={selectedTons <= 3}
                  >
                    -
                  </Button>
                  <div className="px-4 py-2 border border-border rounded text-center min-w-[80px] bg-background">
                    <div className="text-sm font-medium text-foreground">{selectedTons} tons</div>
                    <div className="text-xs text-muted-foreground">≡ {cubicYards.toFixed(1)} cu. yds.</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTons(selectedTons + 1)}
                  >
                    +
                  </Button>
                </div> 
              </div>

              {/* Total Price and Free Delivery */}
              <div className="text-right">
                <div className="mb-1">
                  <span className="text-2xl font-bold text-foreground">
                    ${(displayPrice * selectedTons).toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">Total</span>
                </div>
                <div className="text-sm text-muted-foreground font-medium mb-1">
                  ${displayPrice.toFixed(2)} per ton
                </div>
                <div className="text-sm text-foreground font-medium">
                  FREE Delivery
                </div>
              </div>
            </div>

            {/* Uses */}
            {product.uses && product.uses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Common Uses</h4>
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
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleViewDetails}
                className="w-full border-primary bg-muted hover:bg-accent text-primary"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                More Details
              </Button>
              <Button
                onClick={handleAddToCart}
                className="w-full"
                size="sm"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
