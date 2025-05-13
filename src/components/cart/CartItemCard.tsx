
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DeliveryForm, { DeliveryFormData } from "./DeliveryForm";
import { CartItem } from "../../contexts/CartContext";
import DeliveryDatePicker from "../products/DeliveryDatePicker";
import { getPriceAdjustmentForZipCode } from "../../services/productService";

interface CartItemCardProps {
  item: CartItem;
  onRemove: (id: string | number) => void;
  onUpdateDelivery: (id: string | number, details: Partial<CartItem>) => void;
}

const CartItemCard = ({ item, onRemove, onUpdateDelivery }: CartItemCardProps) => {
  const { toast } = useToast();
  const [isEditingDelivery, setIsEditingDelivery] = useState(!item.deliveryAddress);
  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  
  const hasDeliveryInfo = !!(
    item.deliveryAddress?.street && 
    item.deliveryAddress?.city && 
    item.deliveryAddress?.state && 
    item.deliveryAddress?.zip && 
    item.contactPhone
  );

  const handleDeliverySubmit = async (data: DeliveryFormData) => {
    setIsUpdatingPrice(true);
    
    try {
      // If ZIP code has changed, get the new price adjustment
      if (data.zip !== item.deliveryAddress?.zip) {
        const priceAdjustment = await getPriceAdjustmentForZipCode(data.zip);
        console.log(`Price adjustment for ${data.zip}: ${priceAdjustment}%`);
        
        // Calculate the new price with adjustment
        const basePrice = item.basePrice || item.price; // Use basePrice if exists, otherwise use current price
        const newPrice = basePrice * (1 + priceAdjustment / 100);
        
        // Update the item with new delivery info and adjusted price
        onUpdateDelivery(item.id, {
          deliveryAddress: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
          contactPhone: data.contactPhone,
          deliveryTimePreference: data.deliveryTimePreference as 'morning' | 'afternoon' | undefined,
          deliveryInstructions: data.deliveryInstructions,
          price: parseFloat(newPrice.toFixed(2)),
          basePrice: basePrice // Store the original base price
        });
        
        toast({
          title: "Delivery information updated",
          description: priceAdjustment !== 0 
            ? `Price adjusted by ${priceAdjustment > 0 ? '+' : ''}${priceAdjustment}% for delivery to ${data.zip}`
            : "Your delivery details have been saved.",
        });
      } else {
        // No ZIP change, just update the delivery info
        onUpdateDelivery(item.id, {
          deliveryAddress: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
          contactPhone: data.contactPhone,
          deliveryTimePreference: data.deliveryTimePreference as 'morning' | 'afternoon' | undefined,
          deliveryInstructions: data.deliveryInstructions
        });
        
        toast({
          title: "Delivery information updated",
          description: "Your delivery details have been saved.",
        });
      }
    } catch (error) {
      console.error("Error updating delivery info:", error);
      toast({
        title: "Error updating delivery information",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPrice(false);
      setIsEditingDelivery(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onUpdateDelivery(item.id, { deliveryDate: date });
      setIsSelectingDate(false);
      toast({
        title: "Delivery date updated",
        description: `Delivery date set to ${format(date, 'MMMM d, yyyy')}`,
      });
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>{item.name}</CardTitle>
          <div className="flex gap-2 mt-1">
            <Badge variant="secondary">
              {item.tons} tons
            </Badge>
            {item.yards && (
              <Badge variant="outline">
                ≈ {item.yards.toFixed(1)} cubic yards
              </Badge>
            )}
            {item.deliveryDate ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 cursor-pointer" onClick={() => setIsSelectingDate(true)}>
                <CalendarDays className="h-3 w-3" />
                {format(item.deliveryDate, 'MMM d, yyyy')}
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 cursor-pointer" onClick={() => setIsSelectingDate(true)}>
                <CalendarDays className="h-3 w-3" />
                Set delivery date
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        {isSelectingDate && (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Select Delivery Date</h4>
            <DeliveryDatePicker 
              selectedDate={item.deliveryDate}
              onDateSelect={handleDateSelect}
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => setIsSelectingDate(false)}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <div className="w-24 h-24 rounded overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2 mb-2">
              <div>Price per ton:</div>
              <div className="text-right font-medium">${item.price.toFixed(2)}</div>
              
              <div>Amount:</div>
              <div className="text-right font-medium">{item.tons} tons</div>
              
              <div>Total:</div>
              <div className="text-right font-bold">${(item.price * item.tons).toFixed(2)}</div>
            </div>
            
            {!isEditingDelivery && hasDeliveryInfo && (
              <div className="text-sm">
                <h4 className="font-medium mb-1">Delivery Address:</h4>
                <p>{item.deliveryAddress?.street}</p>
                <p>{item.deliveryAddress?.city}, {item.deliveryAddress?.state} {item.deliveryAddress?.zip}</p>
                <p className="mt-1">Contact: {item.contactPhone}</p>
                {item.deliveryTimePreference && (
                  <p className="mt-1">Preferred time: {item.deliveryTimePreference === 'morning' ? 'Morning (8am-12pm)' : 'Afternoon (12pm-5pm)'}</p>
                )}
                {item.deliveryInstructions && (
                  <div className="mt-1">
                    <strong>Instructions:</strong> {item.deliveryInstructions}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setIsSelectingDate(true)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {item.deliveryDate ? "Change Date" : "Set Date"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingDelivery(true)}
                  >
                    Edit Delivery Info
                  </Button>
                </div>
              </div>
            )}
            
            {isEditingDelivery && (
              <DeliveryForm 
                initialData={item.deliveryAddress ? {
                  ...item.deliveryAddress,
                  contactPhone: item.contactPhone || '',
                  deliveryTimePreference: item.deliveryTimePreference,
                  deliveryInstructions: item.deliveryInstructions
                } : undefined}
                zipCode={item.contactInfo?.zipCode || item.deliveryAddress?.zip}
                onSubmit={handleDeliverySubmit}
                lockZipCode={false} // Allow ZIP code to be edited
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItemCard;
