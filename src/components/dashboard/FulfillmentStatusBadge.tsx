
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FulfillmentStatusBadgeProps {
  status: string | null;
  orderId: string;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  readonly?: boolean;
}

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'Quote Needed':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'Quote Sent':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'New Order':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'Assigned':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'Scheduled':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'Refunded':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const FulfillmentStatusBadge: React.FC<FulfillmentStatusBadgeProps> = ({
  status,
  orderId,
  onStatusUpdate,
  readonly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(orderId, newStatus);
    setIsEditing(false);
  };

  if (readonly || isEditing && readonly) {
    return (
      <Badge className={getStatusColor(status)}>
        {status || 'Not Set'}
      </Badge>
    );
  }

  if (isEditing) {
    return (
      <Select 
        value={status || ''} 
        onValueChange={handleStatusChange}
        onOpenChange={(open) => !open && setIsEditing(false)}
        open={true}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Quote Needed">Quote Needed</SelectItem>
          <SelectItem value="Quote Sent">Quote Sent</SelectItem>
          <SelectItem value="New Order">New Order</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Assigned">Assigned</SelectItem>
          <SelectItem value="Scheduled">Scheduled</SelectItem>
          <SelectItem value="Delivered">Delivered</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
          <SelectItem value="Refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge 
      className={`${readonly ? '' : 'cursor-pointer'} ${getStatusColor(status)}`}
      onClick={readonly ? undefined : () => setIsEditing(true)}
    >
      {status || 'Not Set'}
    </Badge>
  );
};

export default FulfillmentStatusBadge;
