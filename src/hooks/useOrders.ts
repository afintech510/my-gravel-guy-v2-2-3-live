
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/services/orderService';
import type { Order, OrderFilters } from '@/types/order.types';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

/**
 * Hook for fetching and managing orders
 */
export function useOrders(
  filters: OrderFilters = {},
  page: number = 1,
  limit: number = 10
) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['orders', filters, page, limit],
    queryFn: () => OrderService.fetchOrders(filters, page, limit),
    staleTime: 30000, // 30 seconds
    retry: 2
  });

  // Handle errors using useEffect
  useEffect(() => {
    if (query.error) {
      console.error('Error fetching orders:', query.error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  return query;
}

/**
 * Hook for fetching a single order
 */
export function useOrder(orderId: string) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => OrderService.fetchOrderById(orderId),
    enabled: !!orderId,
    staleTime: 30000,
    retry: 2
  });

  // Handle errors using useEffect
  useEffect(() => {
    if (query.error) {
      console.error('Error fetching order:', query.error);
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  return query;
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      OrderService.updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  });
}
