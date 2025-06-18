
import { supabase } from '@/integrations/supabase/client';
import type { 
  GroupedOrder, 
  OrderFilters, 
  OrderServiceResponse, 
  OrderRow
} from '@/types/order.types';
import { groupOrderRows } from '@/types/order.types';
import { SupplierService } from './supplierService';
import { getProductById } from '@/services/products/productQueries';

export class OrderService {
  /**
   * Resolve product IDs to product names for order items
   */
  static async resolveProductNames(orders: GroupedOrder[]): Promise<GroupedOrder[]> {
    const resolvedOrders = await Promise.all(
      orders.map(async (order) => {
        const resolvedItems = await Promise.all(
          order.items.map(async (item) => {
            try {
              const product = await getProductById(item.product_name); // product_name actually contains product_id
              return {
                ...item,
                product_name: product?.name || item.product_name || 'Unknown Product'
              };
            } catch (error) {
              console.error('Error resolving product name for ID:', item.product_name, error);
              return {
                ...item,
                product_name: item.product_name || 'Unknown Product'
              };
            }
          })
        );

        return {
          ...order,
          items: resolvedItems
        };
      })
    );

    return resolvedOrders;
  }

  /**
   * Fetch orders with optional filtering and pagination
   * Now respects RLS policies - users see only their own orders, admins see all
   */
  static async fetchOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<OrderServiceResponse> {
    try {
      console.log('Fetching orders with filters (RLS enabled):', filters);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication required to access orders');
      }

      if (!user) {
        console.log('No authenticated user, returning empty results');
        return {
          orders: [],
          total: 0,
          page,
          limit
        };
      }

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      // Apply search filter - search by order_id or product_id since product_name isn't in orders table
      if (filters.searchTerm) {
        query = query.or(`order_id.ilike.%${filters.searchTerm}%,product_id.ilike.%${filters.searchTerm}%`);
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
        console.error('Error fetching orders (RLS may be blocking access):', error);
        // If RLS is blocking access, it might be because user doesn't have permission
        if (error.code === 'PGRST116' || error.message.includes('permission')) {
          console.log('RLS policy blocked access - user may not have orders or admin access');
          return {
            orders: [],
            total: 0,
            page,
            limit
          };
        }
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      // Transform the data using the helper function
      const groupedOrders = groupOrderRows(data as OrderRow[] || []);
      
      // Resolve product names
      const ordersWithProductNames = await this.resolveProductNames(groupedOrders);

      console.log(`Retrieved ${ordersWithProductNames.length} orders for user (RLS applied)`);

      return {
        orders: ordersWithProductNames,
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
   * Now respects RLS policies - users can only see their own orders
   */
  static async fetchOrderById(orderId: string): Promise<GroupedOrder | null> {
    try {
      console.log('Fetching order by ID (RLS enabled):', orderId);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication required to access orders');
      }

      if (!user) {
        console.log('No authenticated user, cannot fetch order');
        return null;
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId);

      if (error) {
        console.error('Error fetching order by ID:', error);
        // If RLS blocks access, the order might not belong to the user
        if (error.code === 'PGRST116' || error.message.includes('permission')) {
          console.log('RLS policy blocked access - order may not belong to user');
          return null;
        }
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('No order found with ID:', orderId);
        return null;
      }

      const groupedOrders = groupOrderRows(data as OrderRow[]);
      const ordersWithProductNames = await this.resolveProductNames(groupedOrders);
      return ordersWithProductNames[0] || null;
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

  static async updateOrderNotes(orderId: string, notes: string): Promise<void> {
    try {
      console.log('Updating order notes:', { orderId, notes });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order notes:', error);
        throw new Error(`Failed to update order notes: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderNotes error:', error);
      throw error;
    }
  }

  static async updateOrderSupplier(orderId: string, supplierId: string, supplierCharges?: number): Promise<void> {
    try {
      console.log('Updating order supplier:', { orderId, supplierId, supplierCharges });
      
      // Fetch the supplier name using the supplier ID
      const suppliers = await SupplierService.fetchSuppliers();
      const supplier = suppliers.find(s => s.id === supplierId);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const updateData: any = {
        supplier_id: supplier.name, // Save supplier name instead of ID
        updated_at: new Date().toISOString()
      };

      if (supplierCharges !== undefined) {
        updateData.supplier_charges = supplierCharges;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order supplier:', error);
        throw new Error(`Failed to update order supplier: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderSupplier error:', error);
      throw error;
    }
  }
}
