
import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderFilters, OrderServiceResponse } from '@/types/order.types';

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
          query = query.order('total_price', { ascending: false }); // Changed from total_amount
          break;
        case 'amount_asc':
          query = query.order('total_price', { ascending: true }); // Changed from total_amount
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

      // Transform the data to group by order_id
      const groupedOrders = this.groupOrdersByOrderId(data || []);

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
  static async fetchOrderById(orderId: string): Promise<Order | null> {
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

      const groupedOrders = this.groupOrdersByOrderId(data);
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

  /**
   * Group order rows by order_id to create proper Order objects
   */
  private static groupOrdersByOrderId(orderRows: any[]): Order[] {
    const orderMap = new Map<string, Order>();

    orderRows.forEach(row => {
      const orderId = row.order_id;
      
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          order_id: orderId,
          created_at: row.created_at,
          total_price: row.total_price || (row.quantity * row.unit_price) || 0, // Calculate from item if missing
          status: row.status || 'pending',
          stripe_session_id: row.stripe_session_id,
          stripe_payment_intent_id: row.stripe_payment_intent_id,
          updated_at: row.updated_at,
          items: []
        });
      }

      const order = orderMap.get(orderId)!;
      
      // Add item to order
      order.items.push({
        id: row.id,
        product_name: row.product_name || 'Unknown Product',
        quantity: row.quantity || 0,
        unit_price: row.unit_price || 0,
        delivery_date: row.delivery_date || row.created_at,
        delivery_address: {
          street: row.delivery_street || '',
          city: row.delivery_city || '',
          state: row.delivery_state || '',
          zip: row.delivery_zip || ''
        },
        status: row.item_status || row.status || 'pending'
      });
    });

    return Array.from(orderMap.values());
  }
}
