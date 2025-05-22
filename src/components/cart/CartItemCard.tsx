
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, CalendarIcon, InfoIcon, TrendingDown } from 'lucide-react';
import { CartItem } from '../../contexts/CartContext';
import DeliveryForm from './DeliveryForm';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (productId: string | number) => void;
  onUpdateDelivery: (productId: string | number, details: Partial<CartItem>) => void;
}

const CartItemCard = ({ item, onRemove, onUpdateDelivery }: CartItemCardProps) => {
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
  
  // Format date to display in a readable format
  const formatDate = (date?: Date) => {
    if (!date) return 'Not selected';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total price for this item
  const baseItemTotal = item.price * item.tons;
  
  // Calculate discounted price if volume discount applied
  const volumeDiscount = item.appliedMultiplier && item.appliedMultiplier < 1 
    ? baseItemTotal * (1 - item.appliedMultiplier) 
    : 0;
    
  // Apply any coupon discount
  const couponDiscount = item.couponApplied && item.couponAmount ? item.couponAmount : 0;
  
  // Final price after all discounts
  const finalTotal = baseItemTotal - volumeDiscount - couponDiscount;

  // Calculate and display yards if available
  const yards = item.tons / (item.tonYardRatio ? parseFloat(String(item.tonYardRatio)) : 1.5);
  
  // Determine what material details to show
  const showMaterialInfo = () => {
    let infoText = [];
    
    // Add category and subcategory if available
    if (item.materialCategory) {
      infoText.push(`${item.materialCategory.charAt(0).toUpperCase() + item.materialCategory.slice(1)}`);
    }
    
    if (item.materialSubcategory) {
      // Convert kebab-case to Title Case
      const formattedSubcategory = item.materialSubcategory
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      infoText.push(formattedSubcategory);
    }
    
    if (item.materialSize) {
      infoText.push(`Size: ${item.materialSize}`);
    }
    
    if (item.depth) {
      infoText.push(`Depth: ${item.depth} inches`);
    }
    
    return infoText.length > 0 ? infoText.join(' • ') : null;
  };

  const materialDetails = showMaterialInfo();

  return (
    <Card className="overflow-hidden border rounded-lg">
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          {/* Product Info */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 h-8 w-8 p-0" 
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
            
            {materialDetails && (
              <p className="text-sm text-muted-foreground">{materialDetails}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantity: </span>
                <span className="font-medium">{item.tons} tons</span>
                {yards > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({yards.toFixed(1)} cu. yds.)
                  </span>
                )}
              </div>
              
              <div>
                <span className="text-muted-foreground">Price: </span>
                <span className="font-medium">${item.price.toFixed(2)} per ton</span>
                {item.appliedMultiplier && item.appliedMultiplier < 1 && (
                  <span className="ml-1 text-green-600 text-xs">
                    ({(100 * (1 - item.appliedMultiplier)).toFixed(0)}% volume discount applied)
                  </span>
                )}
              </div>
            </div>
            
            {/* Display delivery date if selected */}
            {item.deliveryDate && (
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 mr-1 text-primary" />
                <span>Delivery: {formatDate(item.deliveryDate)}</span>
              </div>
            )}
            
            {/* Display contact info if available */}
            {item.contactInfo && (
              <div className="text-sm text-muted-foreground">
                <span>Contact: {item.contactInfo.name} • {item.contactInfo.phone}</span>
              </div>
            )}
            
            {/* Display ZIP code if available */}
            {(item.contactInfo?.zipCode || item.deliveryAddress?.zip) && (
              <div className="text-sm text-muted-foreground">
                <span>ZIP: {item.contactInfo?.zipCode || item.deliveryAddress?.zip}</span>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="flex flex-col justify-between items-end gap-2">
            {/* Price display */}
            <div className="text-right">
              {/* Show original price if any discount applied */}
              {(volumeDiscount > 0 || couponDiscount > 0) && (
                <div className="text-sm text-muted-foreground line-through">
                  ${baseItemTotal.toFixed(2)}
                </div>
              )}
              
              {/* Show volume discount if applied */}
              {volumeDiscount > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <TrendingDown className="h-3 w-3" />
                  <span>${volumeDiscount.toFixed(2)} volume discount</span>
                </div>
              )}
              
              {/* Show coupon discount if applied */}
              {item.couponApplied && item.couponAmount && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <InfoIcon className="h-3 w-3" />
                  <span>${item.couponAmount.toFixed(2)} coupon applied</span>
                </div>
              )}
              
              {/* Final price */}
              <div className="text-lg font-bold">
                ${finalTotal.toFixed(2)}
              </div>
            </div>

            {/* Update delivery button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeliveryFormOpen(!isDeliveryFormOpen)}
              className="mt-2"
            >
              {item.deliveryDate ? 'Update Delivery' : 'Add Delivery Details'}
            </Button>
          </div>
        </div>
        
        {/* Delivery Form */}
        {isDeliveryFormOpen && (
          <div className="mt-4 pt-4 border-t">
            <DeliveryForm
              item={item}
              initialData={item.deliveryAddress ? {
                street: item.deliveryAddress.street,
                city: item.deliveryAddress.city,
                state: item.deliveryAddress.state,
                zip: item.deliveryAddress.zip,
                contactPhone: item.contactPhone,
                deliveryTimePreference: item.deliveryTimePreference,
                deliveryInstructions: item.deliveryInstructions
              } : undefined}
              zipCode={item.deliveryAddress?.zip || item.contactInfo?.zipCode}
              onSubmit={(details) => {
                onUpdateDelivery(item.id, {
                  deliveryAddress: {
                    street: details.street,
                    city: details.city,
                    state: details.state,
                    zip: details.zip
                  },
                  contactPhone: details.contactPhone,
                  deliveryTimePreference: details.deliveryTimePreference,
                  deliveryInstructions: details.deliveryInstructions
                });
                setIsDeliveryFormOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default CartItemCard;
