import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, CalendarIcon, InfoIcon, Plus, Minus, MapPinIcon, PhoneIcon, MailIcon, ClockIcon, FileTextIcon } from 'lucide-react';
import { CartItem } from '../../contexts/CartContext';
import { useCart } from '../../contexts/CartContext';
import DeliveryForm from './DeliveryForm';
interface CartItemCardProps {
  item: CartItem;
  onRemove: (cartItemId: string) => void;
  onUpdateDelivery: (cartItemId: string, details: Partial<CartItem>) => void;
  autoExpandDelivery?: boolean;
}
const CartItemCard = ({
  item,
  onRemove,
  onUpdateDelivery,
  autoExpandDelivery = false
}: CartItemCardProps) => {
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
  const {
    updateQuantity,
    depositOption,
    items
  } = useCart();

  // Check if delivery info is complete
  const isDeliveryComplete = item.deliveryDate && item.deliveryAddress?.street && item.contactInfo?.name && item.contactInfo?.phone && item.contactInfo?.email;

  // Auto-expand only if delivery info is incomplete AND autoExpandDelivery is true
  // Once delivery info is complete, don't auto-expand even if autoExpandDelivery is true
  useEffect(() => {
    if (!isDeliveryComplete && autoExpandDelivery) {
      setIsDeliveryFormOpen(true);
    }
  }, [autoExpandDelivery, isDeliveryComplete]);

  // Format date to display in a readable format
  const formatDate = (date?: Date | string) => {
    if (!date) return 'Not selected';
    
    // Handle string dates from database
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Invalid date';
      return parsedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle Date objects
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate total price for this item
  const fullItemTotal = item.price * item.tons;
  
  // If deposit option is selected, show the deposit portion for this item
  const itemTotal = depositOption ? 
    (199 / items.length) : // Split $199 deposit across all items
    fullItemTotal;

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
      const formattedSubcategory = item.materialSubcategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      infoText.push(formattedSubcategory);
    }

    // Add size information if available
    if (item.size || item.specifications?.size) {
      const sizeInfo = item.size || item.specifications?.size;
      infoText.push(`Size: ${sizeInfo}`);
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

  // Handle quantity changes
  const handleQuantityChange = (newTons: number) => {
    if (newTons >= 1) {
      updateQuantity(item.cartItemId, newTons);
    }
  };

  // Helper function to format delivery time preference
  const formatDeliveryTimePreference = (preference?: "anytime" | "morning" | "afternoon") => {
    switch (preference) {
      case 'anytime':
        return 'Anytime (7am-5pm)';
      case 'morning':
        return 'Morning (7am-12pm)';
      case 'afternoon':
        return 'Afternoon (12pm-5pm)';
      default:
        return 'Not specified';
    }
  };
  return <Card className="overflow-hidden border rounded-lg">
      <div className="p-4 sm:p-6 rounded-none">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          {/* Product Info */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-lg">{item.name}</h3>
            </div>
            
            {materialDetails && <p className="text-sm text-muted-foreground">{materialDetails}</p>}
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Quantity: </span>
                <span className="font-medium">{item.tons} tons</span>
                {yards > 0 && <span className="text-muted-foreground ml-1">
                    ({yards.toFixed(1)} cu. yds.)
                  </span>}
              </div>
              
              <div>
                <span className="text-muted-foreground">Price: </span>
                <span className="font-medium">${item.price.toFixed(2)} per ton</span>
              </div>
            </div>
            
            {/* Display delivery status and date */}
            <div className="flex items-center gap-2 text-sm">
              {isDeliveryComplete ? <div className="flex items-center text-primary">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Delivery: {formatDate(item.deliveryDate)}</span>
                  <span className="ml-2 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    Confirmed
                  </span>
                </div> : <div className="flex items-center text-amber-500">
                  <InfoIcon className="h-4 w-4 mr-1" />
                  <span>Delivery info required</span>
                </div>}
            </div>

            {/* Show saved delivery information when complete */}
            {isDeliveryComplete && <div className="mt-3 p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Contact</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">{item.contactInfo?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PhoneIcon className="h-3 w-3" />
                      <span>{item.contactInfo?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MailIcon className="h-3 w-3" />
                      <span>{item.contactInfo?.email}</span>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Delivery Address</h4>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div>{item.deliveryAddress?.street}</div>
                        <div>{item.deliveryAddress?.city}, {item.deliveryAddress?.state} {item.deliveryAddress?.zip}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional delivery preferences */}
                {(item.deliveryTimePreference || item.deliveryInstructions) && <div className="pt-2 border-t border-border space-y-2">
                    {item.deliveryTimePreference && <div className="flex items-center gap-2 text-muted-foreground">
                        <ClockIcon className="h-3 w-3" />
                        <span>Preferred time: {formatDeliveryTimePreference(item.deliveryTimePreference)}</span>
                      </div>}
                    {item.deliveryInstructions && <div className="flex items-start gap-2 text-muted-foreground">
                        <FileTextIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{item.deliveryInstructions}</span>
                      </div>}
                  </div>}
              </div>}
          </div>

          {/* Price and Quantity Controls */}
          <div className="flex flex-col justify-between items-end gap-2">
            {/* Quantity adjusters and price */}
            <div className="flex items-center gap-3">
              {/* Quantity adjustment buttons */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button variant="ghost" size="sm" onClick={() => handleQuantityChange(item.tons - 1)} disabled={item.tons <= 1} className="h-8 w-8 p-0 hover:bg-muted-foreground/20">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="mx-3 text-sm font-medium">{item.tons}</span>
                <Button variant="ghost" size="sm" onClick={() => handleQuantityChange(item.tons + 1)} className="h-8 w-8 p-0 hover:bg-muted-foreground/20">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Price display */}
              <div className="text-right">
                <div className="text-lg font-bold">
                  ${itemTotal.toFixed(2)}
                </div>
                {depositOption && (
                  <div className="text-xs text-muted-foreground">
                    Deposit portion (Full: ${fullItemTotal.toFixed(2)})
                  </div>
                )}
              </div>
            </div>

            {/* Edit delivery info button - only show if delivery is complete */}
            {isDeliveryComplete && <Button variant="outline" size="sm" onClick={() => setIsDeliveryFormOpen(!isDeliveryFormOpen)} className="mt-2">
                {isDeliveryFormOpen ? 'Hide Form' : 'Edit Delivery Info'}
              </Button>}
          </div>
        </div>
        
        {/* Enhanced Delivery Form - only show if incomplete or being edited */}
        {(!isDeliveryComplete || isDeliveryFormOpen) && <div className="mt-4 pt-4 border-t">
            <DeliveryForm item={item} onSubmit={details => {
          onUpdateDelivery(item.cartItemId, {
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
            deliveryInstructions: details.deliveryInstructions
          });
          // Close form after saving
          setIsDeliveryFormOpen(false);
        }} />
          </div>}

        {/* Remove button - moved to bottom center */}
        <div className="flex justify-center mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onRemove(item.cartItemId)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Item
          </Button>
        </div>
      </div>
    </Card>;
};
export default CartItemCard;