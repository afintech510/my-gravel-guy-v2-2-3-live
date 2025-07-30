import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductSelector } from './ProductSelector';
import { Trash2, Package, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderService } from '@/services/orderService';
import { OrderItem } from '@/types/order.types';
import { Product } from '@/services/productTypes';
import { format } from 'date-fns';

interface OrderItemsManagerProps {
  orderId: string;
  orderItems: OrderItem[];
  onOrderItemsChange: (items: OrderItem[]) => void;
  isEditable?: boolean;
}

export function OrderItemsManager({ 
  orderId, 
  orderItems, 
  onOrderItemsChange, 
  isEditable = true 
}: OrderItemsManagerProps) {
  const { toast } = useToast();
  const [localItems, setLocalItems] = useState<OrderItem[]>(orderItems);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync local items with prop changes
  useEffect(() => {
    setLocalItems(orderItems);
  }, [orderItems]);

  // Debounced update function
  const debouncedUpdate = useCallback(async (itemId: string, updates: Partial<OrderItem>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        setIsUpdating(true);
        
        // Update database if not a temporary item
        if (!itemId.startsWith('temp-')) {
          await OrderService.updateOrderItem(itemId, updates);
        }
        
        // Update parent component
        const updatedItems = localItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        onOrderItemsChange(updatedItems);
      } catch (error) {
        console.error('Error updating order item:', error);
        toast({
          title: "Error updating item",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    }, 500);
  }, [localItems, onOrderItemsChange, toast]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const updatedItems = localItems.map(item => {
      if (item.id === itemId) {
        const newItem = { ...item, quantity };
        newItem.total_price = newItem.unit_price * quantity;
        return newItem;
      }
      return item;
    });
    setLocalItems(updatedItems);
    debouncedUpdate(itemId, { quantity, total_price: quantity * (localItems.find(item => item.id === itemId)?.unit_price || 0) });
  };

  const handlePriceChange = (itemId: string, unitPrice: number) => {
    const updatedItems = localItems.map(item => {
      if (item.id === itemId) {
        const newItem = { ...item, unit_price: unitPrice };
        newItem.total_price = unitPrice * newItem.quantity;
        return newItem;
      }
      return item;
    });
    setLocalItems(updatedItems);
    debouncedUpdate(itemId, { unit_price: unitPrice, total_price: unitPrice * (localItems.find(item => item.id === itemId)?.quantity || 0) });
  };

  const handleAddProduct = async (product: Product & { unit: string }, quantity: number, customPrice?: number) => {
    try {
      const unitPrice = customPrice || product.price;
      const newItemData: Omit<OrderItem, 'id'> = {
        product_name: product.id.toString(), // Store product ID for database
        quantity,
        unit: product.unit,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
        delivery_date: orderItems[0]?.delivery_date || '',
        delivery_address: orderItems[0]?.delivery_address || {
          street: '',
          city: '',
          state: '',
          zip: ''
        },
        delivery_name: orderItems[0]?.delivery_name || '',
        delivery_email: orderItems[0]?.delivery_email || '',
        delivery_phone: orderItems[0]?.delivery_phone || '',
        delivery_instructions: orderItems[0]?.delivery_instructions || '',
        delivery_time_preference: orderItems[0]?.delivery_time_preference || '',
        status: orderItems[0]?.status || 'pending',
        fulfillment_status: orderItems[0]?.fulfillment_status || 'Pending',
        notes: '',
        supplier_id: orderItems[0]?.supplier_id || null,
        supplier_charges: orderItems[0]?.supplier_charges || null
      };

      // Add to database
      const itemId = await OrderService.addOrderItem(orderId, newItemData);
      
      // Create new item with real database ID and display name
      const newItem: OrderItem = {
        ...newItemData,
        id: itemId,
        product_name: product.name // Display name for UI
      };

      const updatedItems = [...localItems, newItem];
      setLocalItems(updatedItems);
      onOrderItemsChange(updatedItems);

      toast({
        title: "Product added",
        description: `${product.name} has been added to the order.`,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error adding product",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const item = localItems.find(i => i.id === itemId);
      
      // For "general-quote" items, clear product info instead of deleting
      if (item?.product_name === 'general-quote' || item?.unit_price === 0) {
        const clearedItem = {
          ...item,
          product_name: 'general-quote',
          quantity: 0,
          unit_price: 0,
          total_price: 0,
          unit: 'quote'
        };
        
        // Update in database
        if (!itemId.startsWith('temp-')) {
          await OrderService.updateOrderItem(itemId, {
            product_name: 'general-quote',
            quantity: 0,
            unit_price: 0,
            total_price: 0,
            unit: 'quote'
          });
        }
        
        const updatedItems = localItems.map(i => i.id === itemId ? clearedItem : i);
        setLocalItems(updatedItems);
        onOrderItemsChange(updatedItems);

        toast({
          title: "Product cleared",
          description: "Product information has been cleared. You can now select a new product.",
        });
      } else {
        // For real product items, remove completely
        if (!itemId.startsWith('temp-')) {
          await OrderService.removeOrderItem(itemId);
        }
        
        const updatedItems = localItems.filter(item => item.id !== itemId);
        setLocalItems(updatedItems);
        onOrderItemsChange(updatedItems);

        toast({
          title: "Item removed",
          description: "Order item has been removed.",
        });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error removing item",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalAmount = localItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      {isEditable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSelector onAddProduct={handleAddProduct} />
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items in this order. {isEditable && 'Add products using the selector above.'}
            </div>
          ) : (
            <div className="space-y-4">
              {localItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.delivery_date && format(new Date(item.delivery_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {isEditable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                        readOnly={!isEditable}
                        className={!isEditable ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                      <Input
                        id={`unit-${item.id}`}
                        value={item.unit}
                        readOnly
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`price-${item.id}`}>Unit Price</Label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                        readOnly={!isEditable}
                        className={!isEditable ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`total-${item.id}`}>Total Price</Label>
                      <Input
                        id={`total-${item.id}`}
                        value={`$${item.total_price.toFixed(2)}`}
                        readOnly
                        className="bg-gray-50 cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>

                  {item.delivery_address && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Delivery:</strong> {item.delivery_address.street}, {item.delivery_address.city}, {item.delivery_address.state} {item.delivery_address.zip}
                    </div>
                  )}
                </div>
              ))}

              {/* Total Amount */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}