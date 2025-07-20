
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/services/orderService';
import { OrderFilters, GroupedOrder } from '@/types/order.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderTableFilters from './OrderTableFilters';
import OrderStatusBadge from './OrderStatusBadge';
import OrderDetailModal from './OrderDetailModal';
import { format } from 'date-fns';

interface OrdersTableProps {
  statusFilter?: 'orders' | 'quotes' | 'all';
  title?: string;
}

const OrdersTable = ({ statusFilter = 'all', title }: OrdersTableProps) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: '',
    status: 'all',
    sortBy: 'date_desc'
  });
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [selectedOrder, setSelectedOrder] = useState<GroupedOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const limit = 20;

  // Apply status filter based on prop
  const modifiedFilters = {
    ...filters,
    ...(statusFilter === 'orders' && { excludeQuotes: true }),
    ...(statusFilter === 'quotes' && { quotesOnly: true }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', modifiedFilters, page, dateRange, statusFilter],
    queryFn: () => OrderService.fetchOrders(modifiedFilters, page, limit),
    staleTime: 30000, // 30 seconds
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      await refetch();
      toast({
        title: "Status Updated",
        description: `Order ${orderId} status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (order: GroupedOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleOrderUpdate = () => {
    refetch();
  };

  const formatAddress = (order: any) => {
    const items = order.items || [];
    if (items.length === 0) return 'N/A';
    
    const address = items[0].delivery_address;
    if (!address) return 'N/A';
    
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  };

  const getProductName = (order: any) => {
    const items = order.items || [];
    if (items.length === 0) return 'N/A';
    
    if (items.length === 1) {
      return items[0].product_name || items[0].product_id || 'Unknown Product';
    }
    
    return `${items[0].product_name || 'Unknown'} +${items.length - 1} more`;
  };

  const getTotalQuantity = (order: any) => {
    const items = order.items || [];
    return items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  };

  const getUnit = (order: any) => {
    const items = order.items || [];
    if (items.length === 0) return '';
    return items[0].unit || 'tons';
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading {statusFilter}: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const orders = data?.orders || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="space-y-6">
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
      )}

      {/* Filters */}
      <OrderTableFilters 
        filters={filters}
        onFiltersChange={setFilters}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Billing Name</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Product(s)</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      No {statusFilter === 'quotes' ? 'quotes' : statusFilter === 'orders' ? 'orders' : 'records'} found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow 
                      key={order.order_id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-mono text-sm">
                        {order.order_id}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <OrderStatusBadge 
                          status={order.status}
                          orderId={order.order_id}
                          onStatusUpdate={handleStatusUpdate}
                          readonly={true}
                        />
                      </TableCell>
                      <TableCell>
                        {order.items?.[0]?.delivery_date 
                          ? format(new Date(order.items[0].delivery_date), 'MMM d, yyyy')
                          : 'Not set'
                        }
                      </TableCell>
                      <TableCell>{order.billing_name || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {formatAddress(order)}
                      </TableCell>
                      <TableCell>{getProductName(order)}</TableCell>
                      <TableCell>
                        {getTotalQuantity(order)} {getUnit(order)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${order.total_price.toFixed(2)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRowClick(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.total || 0)} of {data?.total || 0} {statusFilter === 'quotes' ? 'quotes' : statusFilter === 'orders' ? 'orders' : 'records'}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Order Detail Modal */}
          <OrderDetailModal
            order={selectedOrder}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onOrderUpdate={handleOrderUpdate}
          />
        </>
      )}
    </div>
  );
};

export default OrdersTable;
