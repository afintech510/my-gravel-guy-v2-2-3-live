
import { supabase } from '@/integrations/supabase/client';
import type { 
  GroupedOrder, 
  OrderFilters, 
  OrderServiceResponse, 
  OrderRow,
  groupOrderRows 
} from '@/types/order.types';
import { groupOrderRows } from '@/types/order.types';

export class OrderService {
  /**
   * Fetch orders with optional filtering and pagination
   */
  static async fetchOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<OrderServiceResponse> {
    try {
      console.log('Fetching orders with filters:', filters);
      
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (filters.searchTerm) {
        query = query.or(`order_id.ilike.%${filters.searchTerm}%,product_name.ilike.%${filters.searchTerm}%`);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
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
        case 'date_desc':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      // Transform the data using the helper function
      const groupedOrders = groupOrderRows(data as OrderRow[] || []);

      return {
        orders: groupedOrders,
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('OrderService.fetchOrders error:', error);
      throw error;
    }
  }

  /**
   * Fetch a single order by order ID
   */
  static async fetchOrderById(orderId: string): Promise<GroupedOrder | null> {
    try {
      console.log('Fetching order by ID:', orderId);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching order by ID:', error);
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return null;
      }

      const groupedOrders = groupOrderRows(data as OrderRow[]);
      return groupedOrders[0] || null;
    } catch (error) {
      console.error('OrderService.fetchOrderById error:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      console.log('Updating order status:', { orderId, status });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        throw new Error(`Failed to update order status: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderStatus error:', error);
      throw error;
    }
  }
}
