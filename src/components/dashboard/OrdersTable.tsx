
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrdersStatsWidget } from './OrdersStatsWidget';
import { QuotesStatsWidget } from './QuotesStatsWidget';
import OrderDetailModal from './OrderDetailModal';
import OrderStatusBadge from './OrderStatusBadge';
import FulfillmentStatusBadge from './FulfillmentStatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Eye, Calendar, Package, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Order, OrderRow } from '@/types/order.types';
import { cn } from '@/lib/utils';
import OrderTableFilters from './OrderTableFilters';
import { OrderFilters, FulfillmentStatus } from '@/types/order.types';

interface OrdersTableProps {
  statusFilter?: 'orders' | 'quotes';
}

const OrdersTable: React.FC<OrdersTableProps> = ({ statusFilter = 'orders' }) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: '',
    fulfillmentStatus: 'all',
    sortBy: 'date_desc'
  });
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  
  const { toast } = useToast();
  const itemsPerPage = 25;

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', statusFilter, filters, dateRange, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*');

      // Apply status filter
      if (statusFilter === 'orders') {
        query = query.neq('status', 'Quote');
      } else if (statusFilter === 'quotes') {
        query = query.eq('status', 'Quote');
      }

      // Apply search filter
      if (filters.searchTerm) {
        query = query.or(`
          id.ilike.%${filters.searchTerm}%,
          order_id.ilike.%${filters.searchTerm}%,
          delivery_name.ilike.%${filters.searchTerm}%,
          delivery_email.ilike.%${filters.searchTerm}%,
          delivery_phone.ilike.%${filters.searchTerm}%,
          billing_name.ilike.%${filters.searchTerm}%,
          billing_email.ilike.%${filters.searchTerm}%
        `);
      }

      // Apply fulfillment status filter
      if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') {
        query = query.eq('fulfillment_status', filters.fulfillmentStatus);
      }

      // Apply date range filter
      if (dateRange.from) {
        query = query.gte('delivery_date', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('delivery_date', dateRange.to.toISOString());
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'date_asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'amount_desc':
          query = query.order('total_price', { ascending: false });
          break;
        case 'amount_asc':
          query = query.order('total_price', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return {
        orders: data || [],
        totalCount: count || 0
      };
    },
  });

  const totalPages = useMemo(() => {
    if (!ordersData?.totalCount) return 0;
    return Math.ceil(ordersData.totalCount / itemsPerPage);
  }, [ordersData?.totalCount]);

  const handleViewOrder = (order: OrderRow) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const formatAddress = (order: any) => {
    const parts = [
      order.delivery_street,
      order.delivery_city,
      order.delivery_state,
      order.delivery_zip
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const getGoogleMapsUrl = (order: any) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(order))}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Quote':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {statusFilter === 'orders' && <OrdersStatsWidget />}
        {statusFilter === 'quotes' && <QuotesStatsWidget />}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <span className="ml-2 text-foreground">Loading {statusFilter}...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {statusFilter === 'orders' && <OrdersStatsWidget />}
        {statusFilter === 'quotes' && <QuotesStatsWidget />}
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <span className="text-destructive">Error loading {statusFilter}. Please try again.</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusFilter === 'orders' && <OrdersStatsWidget />}
      {statusFilter === 'quotes' && <QuotesStatsWidget />}
      
      <OrderTableFilters 
        filters={filters}
        onFiltersChange={setFilters}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {statusFilter === 'orders' ? <Package className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            <span className="text-foreground">
              {statusFilter === 'orders' ? 'Orders' : 'Quotes'} ({ordersData?.totalCount || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Fulfillment</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Delivery</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Address</th>
                  <th className="text-left py-3 px-4 text-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersData?.orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-b border-border hover:bg-accent transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-mono text-sm">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{order.delivery_name || order.billing_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{order.delivery_email || order.billing_email || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{order.delivery_phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge 
                        status={order.status as any} 
                        orderId={order.id} 
                        onStatusUpdate={() => {}} 
                        readonly={true} 
                      />
                    </td>
                    <td className="py-3 px-4">
                      <FulfillmentStatusBadge 
                        status={order.fulfillment_status} 
                        orderId={order.id} 
                        onStatusUpdate={() => {}} 
                        readonly={true} 
                      />
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      ${order.total_price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-foreground font-medium">
                          {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.created_at && formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-sm text-foreground">{order.delivery_street || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.delivery_city}, {order.delivery_state} {order.delivery_zip}
                        </div>
                        <a 
                          href={getGoogleMapsUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          View on Maps
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order as OrderRow)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ordersData?.orders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">No {statusFilter} found</div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailModal
        order={selectedOrder as any}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderUpdate={() => {}}
      />
    </div>
  );
};

export default OrdersTable;
