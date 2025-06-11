
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter,
  Package,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import type { OrderFilters } from '@/types/order.types';

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800", 
  processing: "bg-orange-100 text-orange-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  paid: "bg-emerald-100 text-emerald-800"
};

export function OrderList() {
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: "",
    status: "all",
    sortBy: "date_desc"
  });
  const [page] = useState(1);
  const limit = 10;

  const { data: orderData, isLoading, error } = useOrders(filters, page, limit);
  const updateOrderStatus = useUpdateOrderStatus();

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus.mutate({ orderId, status: newStatus });
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  };

  const handleStatusFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value as any }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Error loading orders. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const orders = orderData?.orders || [];

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search orders or products..."
            value={filters.searchTerm || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.status} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="amount_desc">Highest Amount</SelectItem>
            <SelectItem value="amount_asc">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrders.includes(order.order_id);
          
          return (
            <Card key={order.order_id}>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrderExpansion(order.order_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    
                    <div>
                      <CardTitle className="text-lg">{order.order_id}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.created_at), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${order.total_price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} tons × ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
                            </p>
                          </div>
                          <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Delivery Date:</p>
                            <p className="text-sm">{format(new Date(item.delivery_date), "MMM dd, yyyy")}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Delivery Address:</p>
                            <p className="text-sm">
                              {item.delivery_address.street}<br />
                              {item.delivery_address.city}, {item.delivery_address.state} {item.delivery_address.zip}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Select onValueChange={(status) => handleStatusUpdate(order.order_id, status)}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Update Status" />
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
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {orders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
