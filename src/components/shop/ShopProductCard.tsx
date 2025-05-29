
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

interface ShopProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function ShopProductCard({ product, isSelected = false, onSelect }: ShopProductCardProps) {
  const [selectedTons, setSelectedTons] = useState(10);
  const { addToCart } = useCart();
  const { zipCode } = useZipCode();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use the useProduct hook for real-time pricing
  const { adjustedPrice, priceDetails } = useProduct(
    product.slug, 
    zipCode, 
    selectedTons
  );

  const displayPrice = adjustedPrice ?? product.price;

  const handleAddToCart = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // Default to 3 days from now

    addToCart({
      ...product,
      tons: selectedTons,
      deliveryDate,
      price: displayPrice
    });

    toast({
      title: "Added to cart",
      description: `${selectedTons} tons of ${product.name} added to your cart.`,
    });
  };

  const handleViewDetails = () => {
    navigate(`/products/${product.slug}`);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card 
      className={cn(
        "h-fit transition-all duration-200 cursor-pointer",
        isSelected ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Product Image and Basic Info */}
        <div className="flex gap-4 mb-4">
          {product.image && (
            <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover rounded"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
            <Badge variant="secondary" className="mb-2">
              {product.category}
            </Badge>
            <p className="text-sm text-gray-600">
              {truncateDescription(product.description)}
            </p>
          </div>
        </div>

        {/* Price Display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${displayPrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">per ton</span>
          </div>
          {priceDetails && priceDetails.zipAdjustment !== 1 && (
            <p className="text-xs text-gray-500">
              Price adjusted for your area
            </p>
          )}
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="flex items-center justify-center text-primary">
          {isSelected ? (
            <>
              <span className="text-sm mr-2">Less details</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span className="text-sm mr-2">More details</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </div>

        {/* Expanded Content */}
        {isSelected && (
          <div className="space-y-4 border-t pt-4 mt-4" onClick={(e) => e.stopPropagation()}>
            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (tons)
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTons(Math.max(1, selectedTons - 1))}
                  disabled={selectedTons <= 1}
                >
                  -
                </Button>
                <span className="px-4 py-2 border rounded text-center min-w-[60px]">
                  {selectedTons}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTons(selectedTons + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total: ${(displayPrice * selectedTons).toFixed(2)}
              </p>
            </div>

            {/* Product Specifications */}
            {product.specifications && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Specifications</h4>
                <div className="text-xs text-gray-600 space-y-1">
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Common Uses</h4>
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
        )}
      </CardContent>
    </Card>
  );
}
