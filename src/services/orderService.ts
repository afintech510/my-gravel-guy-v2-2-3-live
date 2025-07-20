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
   * Get unique sales persons from orders
   */
  static async getUniqueSalesPersons(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('sales_person')
        .not('sales_person', 'is', null)
        .neq('sales_person', '');

      if (error) {
        console.error('Error fetching sales persons:', error);
        throw new Error(`Failed to fetch sales persons: ${error.message}`);
      }

      const uniquePersons = Array.from(new Set(
        data?.map(row => row.sales_person).filter(Boolean) || []
      )).sort();

      return uniquePersons;
    } catch (error) {
      console.error('OrderService.getUniqueSalesPersons error:', error);
      throw error;
    }
  }

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

      // Apply quotes/orders filter
      if (filters.quotesOnly) {
        query = query.eq('status', 'Quote');
      } else if (filters.excludeQuotes) {
        query = query.neq('status', 'Quote');
      }

      // Apply search filter - search by order_id or product_id since product_name isn't in orders table
      if (filters.searchTerm) {
        query = query.or(`order_id.ilike.%${filters.searchTerm}%,product_id.ilike.%${filters.searchTerm}%`);
      }

      // Apply fulfillment status filter
      if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'all') {
        query = query.eq('fulfillment_status', filters.fulfillmentStatus);
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
      
      // Resolve product names
      const ordersWithProductNames = await this.resolveProductNames(groupedOrders);

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
      const ordersWithProductNames = await this.resolveProductNames(groupedOrders);
      return ordersWithProductNames[0] || null;
    } catch (error) {
      console.error('OrderService.fetchOrderById error:', error);
      throw error;
    }
  }

  /**
   * Update order fulfillment status
   */
  static async updateOrderFulfillmentStatus(orderId: string, fulfillmentStatus: string): Promise<void> {
    try {
      console.log('Updating order fulfillment status:', { orderId, fulfillmentStatus });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          fulfillment_status: fulfillmentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order fulfillment status:', error);
        throw new Error(`Failed to update order fulfillment status: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderFulfillmentStatus error:', error);
      throw error;
    }
  }

  /**
   * Update order sales person
   */
  static async updateOrderSalesPerson(orderId: string, salesPerson: string): Promise<void> {
    try {
      console.log('Updating order sales person:', { orderId, salesPerson });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          sales_person: salesPerson || null,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order sales person:', error);
        throw new Error(`Failed to update order sales person: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderSalesPerson error:', error);
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
