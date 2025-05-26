
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, CalendarIcon, InfoIcon } from 'lucide-react';
import { CartItem } from '../../contexts/CartContext';
import DeliveryForm from './DeliveryForm';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (productId: string | number) => void;
  onUpdateDelivery: (productId: string | number, details: Partial<CartItem>) => void;
  autoExpandDelivery?: boolean;
}

const CartItemCard = ({ item, onRemove, onUpdateDelivery, autoExpandDelivery = false }: CartItemCardProps) => {
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(autoExpandDelivery);
  
  // Auto-expand if autoExpandDelivery prop is true or if delivery info is incomplete
  useEffect(() => {
    const isIncomplete = !item.deliveryDate || 
                        !item.deliveryAddress?.street || 
                        !item.contactInfo?.name || 
                        !item.contactInfo?.phone || 
                        !item.contactInfo?.email;
    
    if (autoExpandDelivery || isIncomplete) {
      setIsDeliveryFormOpen(true);
    }
  }, [autoExpandDelivery, item]);
  
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
  const itemTotal = item.price * item.tons;
  const discountedTotal = item.couponApplied ? itemTotal - (item.couponAmount || 0) : itemTotal;

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

  // Check if delivery info is complete
  const isDeliveryComplete = item.deliveryDate && 
                           item.deliveryAddress?.street && 
                           item.contactInfo?.name && 
                           item.contactInfo?.phone && 
                           item.contactInfo?.email;

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
              </div>
            </div>
            
            {/* Display delivery status */}
            <div className="flex items-center gap-2 text-sm">
              {isDeliveryComplete ? (
                <div className="flex items-center text-green-600">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Delivery: {formatDate(item.deliveryDate)}</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Complete
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <InfoIcon className="h-4 w-4 mr-1" />
                  <span>Delivery info required</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary */}
          <div className="flex flex-col justify-between items-end gap-2">
            {/* Price display */}
            <div className="text-right">
              {item.couponApplied && item.couponAmount && (
                <>
                  <div className="text-sm text-muted-foreground line-through">
                    ${itemTotal.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <InfoIcon className="h-3 w-3" />
                    <span>${item.couponAmount.toFixed(2)} discount applied</span>
                  </div>
                </>
              )}
              <div className="text-lg font-bold">
                ${discountedTotal.toFixed(2)}
              </div>
            </div>

            {/* Toggle delivery form button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeliveryFormOpen(!isDeliveryFormOpen)}
              className="mt-2"
            >
              {isDeliveryFormOpen ? 'Hide Delivery Form' : 'Update Delivery Info'}
            </Button>
          </div>
        </div>
        
        {/* Enhanced Delivery Form */}
        {isDeliveryFormOpen && (
          <div className="mt-4 pt-4 border-t">
            <DeliveryForm
              item={item}
              onSubmit={(details) => {
                onUpdateDelivery(item.id, {
                  deliveryDate: details.deliveryDate,
                  deliveryAddress: {
                    street: details.street,
                    city: details.city,
                    state: details.state,
                    zip: details.zip
                  },
                  contactInfo: {
                    name: details.name,
                    email: details.email,
                    phone: details.phone,
                    zipCode: details.zip
                  },
                  deliveryTimePreference: details.deliveryTimePreference,
                  deliveryInstructions: details.deliveryInstructions,
                  locationPhotoUrl: details.locationPhotoUrl
                });
                // Only close form if all required fields are filled
                if (details.deliveryDate && details.street && details.name && details.phone && details.email) {
                  setIsDeliveryFormOpen(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default CartItemCard;
