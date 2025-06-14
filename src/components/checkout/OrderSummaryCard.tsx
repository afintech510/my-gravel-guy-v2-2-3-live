
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, FileTextIcon, UserIcon } from "lucide-react";
import { CartItem } from "../../contexts/CartContext";

interface OrderSummaryCardProps {
  items: CartItem[];
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ items }) => {
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

  // Helper function to get material size info
  const getMaterialSizeInfo = (item: CartItem) => {
    if (item.size) return `Size: ${item.size}`;
    if (item.specifications?.size) return `Size: ${item.specifications.size}`;
    if (item.materialSize) return `Size: ${item.materialSize}`;
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary ({items.length} items)</h2>
        
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="border-b pb-6 last:border-b-0">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      {item.tons} tons {item.yards && `(${item.yards.toFixed(1)} cu. yds.)`}
                    </div>
                    {getMaterialSizeInfo(item) && (
                      <div className="text-xs text-gray-600">
                        {getMaterialSizeInfo(item)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    {item.couponApplied && item.couponAmount && item.couponAmount > 0 ? (
                      <>
                        <div className="text-sm text-gray-500 line-through">
                          ${(item.price * item.tons).toFixed(2)}
                        </div>
                        <div className="font-medium text-green-600">
                          ${((item.price * item.tons) - item.couponAmount).toFixed(2)}
                        </div>
                        <div className="text-xs text-green-600">
                          Saved ${item.couponAmount.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <div>${(item.price * item.tons).toFixed(2)}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {(item.deliveryAddress || item.contactInfo || item.deliveryDate) && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 mb-3">Delivery Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.contactInfo && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700 text-sm">Contact Information</h5>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserIcon className="h-3 w-3" />
                            <span>{item.contactInfo.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <PhoneIcon className="h-3 w-3" />
                            <span>{item.contactInfo.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MailIcon className="h-3 w-3" />
                            <span>{item.contactInfo.email}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.deliveryAddress && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700 text-sm">Delivery Address</h5>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <div>{item.deliveryAddress.street}</div>
                            <div>{item.deliveryAddress.city}, {item.deliveryAddress.state} {item.deliveryAddress.zip}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    {item.deliveryDate && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700 text-sm">Delivery Schedule</h5>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">
                            {new Date(item.deliveryDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          {item.deliveryTimePreference && (
                            <div className="flex items-center gap-2 mt-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>{formatDeliveryTimePreference(item.deliveryTimePreference)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {item.deliveryInstructions && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-700 text-sm">Special Instructions</h5>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FileTextIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{item.deliveryInstructions}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.locationPhotoUrl && (
                    <div className="pt-2 border-t border-gray-200">
                      <h5 className="font-medium text-gray-700 text-sm mb-2">Location Photo</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📷</span>
                        <span>Photo uploaded by customer</span>
                      </div>
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
