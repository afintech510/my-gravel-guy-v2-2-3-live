
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, MapPin, Calendar, RefreshCw, XCircle } from "lucide-react";
import { useProductNameResolver } from "@/hooks/useProductNameResolver";

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date: string | null;
  delivery_address_street: string | null;
  delivery_address_city: string | null;
  delivery_address_state: string | null;
  delivery_address_zip: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  delivery_time_preference: string | null;
  delivery_instructions: string | null;
  status: string;
}

interface OrderDetailsCardProps {
  orderItems: OrderItem[];
}

const formatDeliveryTimePreference = (preference: string | null) => {
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

export const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({ orderItems }) => {
  const productIdsForResolution = orderItems?.map(item => ({
    productId: item.product_name,
    fallbackName: typeof item.product_name === "string" ? item.product_name : undefined
  }));

  const {
    names: resolvedProductNames,
    loading: resolvingProducts,
    error: nameResolutionError
  } = useProductNameResolver(productIdsForResolution);

  if (orderItems.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Details
        </h2>
        
        {resolvingProducts && (
          <div className="mb-4 text-blue-600 flex gap-2 items-center text-sm">
            <span className="animate-spin mr-2">
              <RefreshCw className="h-4 w-4" />
            </span>
            Resolving product names...
          </div>
        )}
        
        {nameResolutionError && (
          <div className="mb-4 text-red-600 flex gap-2 items-center text-sm">
            <XCircle className="h-4 w-4" />
            {nameResolutionError}
          </div>
        )}

        <div className="space-y-6">
          {orderItems.map((item, index) => (
            <div key={item.id} className="border-b pb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-lg">
                    {resolvedProductNames?.[item.product_name] ||
                      item.product_name ||
                      <span className="text-gray-400 italic">Unresolved Product</span>}
                  </h3>
                  <p className="text-gray-600">Quantity: {item.quantity} tons</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${item.total_price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'processed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              {(item.delivery_address_street || item.delivery_date) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.delivery_address_street && (
                      <div>
                        <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Delivery Address
                        </h5>
                        <div className="text-sm text-gray-600">
                          <div>{item.delivery_address_street}</div>
                          <div>
                            {item.delivery_address_city}, {item.delivery_address_state} {item.delivery_address_zip}
                          </div>
                        </div>
                      </div>
                    )}

                    {item.delivery_date && (
                      <div>
                        <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Delivery Schedule
                        </h5>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">
                            {new Date(item.delivery_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div>{formatDeliveryTimePreference(item.delivery_time_preference)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.delivery_instructions && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-sm mb-1">Special Instructions</h5>
                      <p className="text-sm text-gray-600">{item.delivery_instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
