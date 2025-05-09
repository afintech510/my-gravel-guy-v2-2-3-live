
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DeliveryForm, { DeliveryFormData } from "./DeliveryForm";
import { CartItem } from "../../contexts/CartContext";
import DeliveryDatePicker from "../products/DeliveryDatePicker";
import TonSelector from "../products/TonSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ZipCodeSearch from "../ZipCodeSearch";
import { supabase } from "@/integrations/supabase/client";

interface CartItemCardProps {
  item: CartItem;
  onRemove: (id: number) => void;
  onUpdateDelivery: (id: number, details: Partial<CartItem>) => void;
}

const CartItemCard = ({ item, onRemove, onUpdateDelivery }: CartItemCardProps) => {
  const { toast } = useToast();
  const [isEditingDelivery, setIsEditingDelivery] = useState(!item.deliveryAddress);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onUpdateDelivery(item.id, { deliveryDate: date });
      setIsEditingDate(false);
      
      toast({
        title: "Delivery date updated",
        description: `Your delivery is scheduled for ${format(date, 'MMMM d, yyyy')}`,
      });
    }
  };

  const handleQuantityChange = (tonsStr: string) => {
    const tons = parseInt(tonsStr, 10);
    // Calculate yards based on tonYardRatio if available
    const yards = item.tonYardRatio ? tons / item.tonYardRatio : undefined;
    
    onUpdateDelivery(item.id, { 
      tons: tons,
      yards: yards
    });
    
    setIsEditingQuantity(false);
    
    toast({
      title: "Quantity updated",
      description: `Updated to ${tons} tons${yards ? ` (≈ ${yards.toFixed(1)} cubic yards)` : ''}`,
    });
  };

  const handleZipCodeSelected = async (zipCode: string) => {
    // Find city and state for this ZIP code
    const { data: zipData, error } = await supabase
      .from('service_zip_codes')
      .select('*')
      .eq('zip', zipCode)
      .maybeSingle();

    if (zipData) {
      // Update the delivery address with the new ZIP code and auto-populated city/state
      onUpdateDelivery(item.id, {
        deliveryAddress: {
          ...item.deliveryAddress,
          zip: zipCode,
          city: zipData.city || '',
          state: zipData.state_id || '',
        }
      });
      
      toast({
        title: "Delivery location updated",
        description: `Delivery location set to ${zipData.city}, ${zipData.state_id} ${zipCode}`,
      });
    } else {
      // If the ZIP code is not found in our database, just update the ZIP
      onUpdateDelivery(item.id, {
        deliveryAddress: {
          ...item.deliveryAddress,
          zip: zipCode,
        }
      });
      
      toast({
        title: "Delivery ZIP code updated",
        description: `Delivery ZIP code set to ${zipCode}`,
      });
    }
    
    setIsLocationDialogOpen(false);
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>{item.name}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            <Popover open={isEditingQuantity} onOpenChange={setIsEditingQuantity}>
              <PopoverTrigger asChild>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  {item.tons} tons
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Adjust Amount</h3>
                  <TonSelector 
                    value={item.tons.toString()} 
                    onValueChange={handleQuantityChange}
                    tonYardRatio={item.tonYardRatio}
                  />
                </div>
              </PopoverContent>
            </Popover>
            
            {item.yards && (
              <Badge variant="outline">
                ≈ {item.yards.toFixed(1)} cubic yards
              </Badge>
            )}
            
            <Popover open={isEditingDate} onOpenChange={setIsEditingDate}>
              <PopoverTrigger asChild>
                <Badge variant="outline" className="bg-green-50 cursor-pointer hover:bg-green-100">
                  <Calendar className="h-3 w-3 mr-1" />
                  Delivery: {item.deliveryDate ? format(item.deliveryDate, 'MMM d, yyyy') : 'Select date'}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Change Delivery Date</h3>
                  <DeliveryDatePicker
                    selectedDate={item.deliveryDate}
                    onDateSelect={handleDateChange}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {item.deliveryAddress?.city && (
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => setIsLocationDialogOpen(true)}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Delivered to {item.deliveryAddress.city}
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

      {/* Location Change Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Delivery Location</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enter a new ZIP code for delivery. This might affect pricing based on your location.
            </p>
            <ZipCodeSearch 
              variant="minimal" 
              onZipSelected={handleZipCodeSelected}
              initialZip={item.deliveryAddress?.zip}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CartItemCard;
