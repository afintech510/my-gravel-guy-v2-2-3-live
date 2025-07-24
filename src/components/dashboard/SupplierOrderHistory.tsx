import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, ExternalLink, Package, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import FulfillmentStatusBadge from './FulfillmentStatusBadge';
import { OrderService } from '@/services/orderService';

interface SupplierOrderHistoryProps {
  supplierId: string;
}

const SupplierOrderHistory: React.FC<SupplierOrderHistoryProps> = ({ supplierId }) => {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['supplier-orders', supplierId],
    queryFn: async () => {
      const { SupplierService } = await import('@/services/supplierService');
      return SupplierService.getSupplierOrders(supplierId);
    },
    staleTime: 30000,
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading order history: {error.message}</p>
      </div>
    );
  }

  const orderList = orders || [];
  const totalOrders = orderList.length;
  const totalRevenue = orderList.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const totalSupplierCharges = orderList.reduce((sum, order) => sum + (order.supplier_charges || 0), 0);
  const netRevenue = totalRevenue - totalSupplierCharges;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplier Charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSupplierCharges.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {!isLoading && (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Supplier Charges</TableHead>
                    <TableHead>Net Revenue</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No orders found for this supplier
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderList.map((order) => {
                      const supplierCharges = order.supplier_charges || 0;
                      const netRevenue = (order.total_price || 0) - supplierCharges;
                      
                      return (
                        <TableRow key={order.order_id}>
                          <TableCell className="font-mono text-sm">
                            {order.order_id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.billing_name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{order.billing_email || ''}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${order.total_price.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            ${supplierCharges.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className={netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${netRevenue.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <FulfillmentStatusBadge 
                              status={order.fulfillment_status || null}
                              orderId={order.order_id}
                              onStatusUpdate={() => {}}
                              readonly={true}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navigate to order details or open modal
                                window.open(`/dashboard/orders`, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierOrderHistory;