import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/services/orderService';
import { OrderFilters, GroupedOrder, FulfillmentStatus } from '@/types/order.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Eye, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderTableFilters from './OrderTableFilters';
import FulfillmentStatusBadge from './FulfillmentStatusBadge';
import SalesPersonSelector from './SalesPersonSelector';
import OrderDetailModal from './OrderDetailModal';
import { format } from 'date-fns';
import { createGoogleMapsSearchUrl } from '@/utils/googleMapsUtils';

interface OrdersTableProps {
  statusFilter?: 'orders' | 'quotes' | 'all';
  title?: string;
}

const OrdersTable = ({ statusFilter = 'all', title }: OrdersTableProps) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: '',
    fulfillmentStatus: 'all',
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

  // Apply status filter based on prop - make sure this creates a new object
  const modifiedFilters = React.useMemo(() => {
    const baseFilters = { ...filters };
    
    if (statusFilter === 'orders') {
      baseFilters.excludeQuotes = true;
      // Remove quotesOnly if it exists
      delete baseFilters.quotesOnly;
    } else if (statusFilter === 'quotes') {
      baseFilters.quotesOnly = true;
      // Remove excludeQuotes if it exists
      delete baseFilters.excludeQuotes;
    }
    
    return baseFilters;
  }, [filters, statusFilter]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', modifiedFilters, page, dateRange, statusFilter],
    queryFn: () => OrderService.fetchOrders(modifiedFilters, page, limit),
    staleTime: 30000, // 30 seconds
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, dateRange]);

  const handleFulfillmentStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await OrderService.updateOrderFulfillmentStatus(orderId, newStatus as FulfillmentStatus);
      await refetch();
      toast({
        title: "Fulfillment Status Updated",
        description: `Order ${orderId} fulfillment status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating fulfillment status:', error);
      toast({
        title: "Error",
        description: "Failed to update fulfillment status",
        variant: "destructive",
      });
    }
  };

  const handleSalesPersonUpdate = async (orderId: string, newPerson: string) => {
    try {
      await OrderService.updateOrderSalesPerson(orderId, newPerson);
      await refetch();
      toast({
        title: "Sales Person Updated",
        description: `Order ${orderId} sales person updated to ${newPerson || 'Not Assigned'}`,
      });
    } catch (error) {
      console.error('Error updating sales person:', error);
      toast({
        title: "Error",
        description: "Failed to update sales person",
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
    if (items.length === 0) return { street: 'N/A', cityStateZip: '' };
    
    const address = items[0].delivery_address;
    if (!address) return { street: 'N/A', cityStateZip: '' };
    
    const street = address.street || '';
    const cityStateZip = `${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim();
    
    return { street, cityStateZip };
  };

  const renderClickableAddress = (order: any) => {
    const { street, cityStateZip } = formatAddress(order);
    
    if (street === 'N/A') {
      return <span className="text-gray-500 text-sm">N/A</span>;
    }

    const fullAddress = `${street}, ${cityStateZip}`;
    const googleMapsUrl = createGoogleMapsSearchUrl(fullAddress);

    return (
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate">
          <div className="text-sm truncate">{street}</div>
          <div className="text-sm text-gray-500 truncate">{cityStateZip}</div>
        </div>
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    );
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
                  <TableHead>Fulfillment Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Billing Name</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Product(s)</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Sales Person</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-500">
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
                      <TableCell>
                        <div 
                          onClick={(e) => {
                            console.log('Fulfillment status cell clicked - stopping propagation');
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <FulfillmentStatusBadge 
                            status={order.fulfillment_status || null}
                            orderId={order.order_id}
                            onStatusUpdate={handleFulfillmentStatusUpdate}
                            readonly={false}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.items?.[0]?.delivery_date 
                          ? format(new Date(order.items[0].delivery_date), 'MMM d, yyyy')
                          : 'Not set'
                        }
                      </TableCell>
                      <TableCell>{order.billing_name || 'N/A'}</TableCell>
                      <TableCell>
                        {renderClickableAddress(order)}
                      </TableCell>
                      <TableCell>{getProductName(order)}</TableCell>
                      <TableCell>
                        {getTotalQuantity(order)} {getUnit(order)}
                      </TableCell>
                      <TableCell>
                        <div 
                          onClick={(e) => {
                            console.log('Sales person cell clicked - stopping propagation');
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="isolate"
                        >
                          <SalesPersonSelector
                            currentPerson={order.sales_person || null}
                            orderId={order.order_id}
                            onPersonUpdate={handleSalesPersonUpdate}
                            readonly={false}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${order.total_price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div 
                          onClick={(e) => {
                            console.log('Actions cell clicked - stopping propagation');
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRowClick(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
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
