
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderStatus } from '@/types/order.types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  orderId: string;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'in_transit':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'in_transit':
      return 'In Transit';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  orderId,
  onStatusUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(orderId, newStatus);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Select 
        value={status} 
        onValueChange={handleStatusChange}
        onOpenChange={(open) => !open && setIsEditing(false)}
        open={true}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="in_transit">In Transit</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge 
      className={`cursor-pointer ${getStatusColor(status)}`}
      onClick={() => setIsEditing(true)}
    >
      {getStatusLabel(status)}
    </Badge>
  );
};

export default OrderStatusBadge;
