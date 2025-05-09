
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DeliveryForm, { DeliveryFormData } from "./DeliveryForm";
import { CartItem } from "../../contexts/CartContext";

interface CartItemCardProps {
  item: CartItem;
  onRemove: (id: number) => void;
  onUpdateDelivery: (id: number, details: Partial<CartItem>) => void;
}

const CartItemCard = ({ item, onRemove, onUpdateDelivery }: CartItemCardProps) => {
  const { toast } = useToast();
  const [isEditingDelivery, setIsEditingDelivery] = useState(!item.deliveryAddress);
  
  const hasDeliveryInfo = !!(
    item.deliveryAddress?.street && 
    item.deliveryAddress?.city && 
    item.deliveryAddress?.state && 
    item.deliveryAddress?.zip && 
    item.contactPhone
  );

  const handleDeliverySubmit = (data: DeliveryFormData) => {
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
    
    setIsEditingDelivery(false);
    
    toast({
      title: "Delivery information updated",
      description: "Your delivery details have been saved.",
    });
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
            {item.deliveryDate && (
              <Badge variant="outline" className="bg-green-50">
                Delivery: {format(item.deliveryDate, 'MMM d, yyyy')}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setIsEditingDelivery(true)}
                >
                  Edit Delivery Info
                </Button>
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
                zipCode={item.deliveryAddress?.zip}
                onSubmit={handleDeliverySubmit}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItemCard;
