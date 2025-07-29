import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Package } from 'lucide-react';
import { OrderItem } from '@/types/order.types';
import { ProductSelector } from './ProductSelector';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/services/productTypes';

interface OrderItemsManagerProps {
  orderItems: OrderItem[];
  onUpdateItem: (itemId: string, updates: Partial<OrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (item: Omit<OrderItem, 'id'>) => void;
  readOnly?: boolean;
}

export const OrderItemsManager: React.FC<OrderItemsManagerProps> = ({
  orderItems,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  readOnly = false
}) => {
  const [showAddProduct, setShowAddProduct] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    const item = orderItems.find(i => i.id === itemId);
    if (item) {
      const newTotal = newQuantity * item.unit_price;
      onUpdateItem(itemId, { 
        quantity: newQuantity,
        // Recalculate if needed - this depends on your business logic
      });
    }
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;
    const item = orderItems.find(i => i.id === itemId);
    if (item) {
      onUpdateItem(itemId, { 
        unit_price: newPrice,
        // Recalculate total if needed
      });
    }
  };

  const handleAddProduct = (product: Product & { unit: string }, quantity: number, customPrice?: number) => {
    const unitPrice = customPrice || product.price;
    const newItem: Omit<OrderItem, 'id'> = {
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      unit: product.unit,
      total_price: quantity * unitPrice,
      delivery_date: new Date().toISOString().split('T')[0], // Default to today
      delivery_address: orderItems[0]?.delivery_address || {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      status: 'pending',
      fulfillment_status: 'New Order',
      // Add other required fields with defaults
      delivery_name: orderItems[0]?.delivery_name || '',
      delivery_email: orderItems[0]?.delivery_email || '',
      delivery_phone: orderItems[0]?.delivery_phone || ''
    };

    onAddItem(newItem);
    setShowAddProduct(false);
  };

  const totalValue = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </div>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderItems.map((item, index) => (
            <div key={item.id} className="space-y-4">
              {index > 0 && <Separator />}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium">Product</Label>
                  <p className="text-sm py-2">{item.product_name}</p>
                </div>
                <div>
                  <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                  <Input
                    id={`quantity-${item.id}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                    min="1"
                    readOnly={readOnly}
                    className={readOnly ? "bg-gray-50 cursor-not-allowed" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor={`price-${item.id}`}>Unit Price</Label>
                  <Input
                    id={`price-${item.id}`}
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    readOnly={readOnly}
                    className={readOnly ? "bg-gray-50 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <Label className="text-sm font-medium">Total</Label>
                    <p className="text-sm font-bold">${(item.quantity * item.unit_price).toFixed(2)}</p>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Unit:</span> {item.unit}
                </div>
                <div>
                  <span className="font-medium">Delivery Date:</span> {item.delivery_date}
                </div>
              </div>
            </div>
          ))}

          {orderItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No items in this order</p>
              {!readOnly && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddProduct(true)}
                  className="mt-4"
                >
                  Add First Product
                </Button>
              )}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Order Value:</span>
                <span className="text-xl font-bold">${totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddProduct && !readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Add Product to Order
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddProduct(false)}
              >
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSelector onAddProduct={handleAddProduct} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};