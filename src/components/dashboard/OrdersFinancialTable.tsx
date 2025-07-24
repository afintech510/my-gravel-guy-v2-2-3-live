import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import FulfillmentStatusBadge from './FulfillmentStatusBadge';
import { financialAnalysisService } from '@/services/financialAnalysisService';

interface OrdersFinancialTableProps {
  startDate: string;
  endDate: string;
}

export function OrdersFinancialTable({ startDate, endDate }: OrdersFinancialTableProps) {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders-financial-details', startDate, endDate],
    queryFn: () => financialAnalysisService.getOrdersForFinancialAnalysis(startDate, endDate),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Details in Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Details in Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            Error loading order details: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Details in Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Individual orders included in the financial calculation
        </p>
      </CardHeader>
      <CardContent>
        {orders && orders.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Supplier Charges</TableHead>
                  <TableHead className="text-right">Net Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales Person</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const netRevenue = order.total_price - (order.supplier_charges || 0);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_id}
                      </TableCell>
                      <TableCell>
                        {order.delivery_name || order.billing_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${order.total_price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(order.supplier_charges || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${netRevenue.toLocaleString()}
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
                        {order.sales_person ? (
                          <Badge variant="outline">{order.sales_person}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No orders found for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}