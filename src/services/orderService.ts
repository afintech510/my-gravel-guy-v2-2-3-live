
import { supabase } from '@/integrations/supabase/client';
import type { 
  GroupedOrder, 
  OrderFilters, 
  OrderServiceResponse, 
  OrderRow,
  OrderItem,
  FulfillmentStatus
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

      // Apply quotes/orders filter - include both Quote and cart statuses as quotes
      if (filters.quotesOnly) {
        query = query.or('status.eq.Quote,status.eq.cart');
      } else if (filters.excludeQuotes) {
        query = query.neq('status', 'Quote').neq('status', 'cart');
      }

      // Apply search filter - enhanced search across multiple fields
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        query = query.or(`order_id.ilike.%${searchTerm}%,product_id.ilike.%${searchTerm}%,billing_name.ilike.%${searchTerm}%,billing_email.ilike.%${searchTerm}%,delivery_name.ilike.%${searchTerm}%,delivery_email.ilike.%${searchTerm}%,delivery_phone.ilike.%${searchTerm}%`);
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
  static async updateOrderFulfillmentStatus(orderId: string, fulfillmentStatus: FulfillmentStatus): Promise<void> {
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
  static async updateOrderSalesPerson(orderId: string, salesPerson: string | null): Promise<void> {
    try {
      console.log('Updating order sales person:', { orderId, salesPerson });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          sales_person: salesPerson,
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
   * Update order sales commission
   */
  static async updateOrderSalesCommission(orderId: string, salesCommission: number): Promise<void> {
    try {
      console.log('Updating order sales commission:', { orderId, salesCommission });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          sales_commission: salesCommission,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order sales commission:', error);
        throw new Error(`Failed to update order sales commission: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderSalesCommission error:', error);
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
      
      // Skip update if supplier ID is empty or not provided
      if (!supplierId || supplierId.trim() === '') {
        console.log('Skipping supplier update - no supplier ID provided');
        return;
      }

      // Fetch the supplier name using the supplier ID
      const suppliers = await SupplierService.fetchSuppliers();
      const supplier = suppliers.find(s => s.id === supplierId);
      
      if (!supplier) {
        console.warn('Supplier not found for ID:', supplierId);
        return; // Don't throw error, just skip the update
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

  static async updateOrderQuoteNotes(orderId: string, quoteNotes: string): Promise<void> {
    try {
      console.log('Updating order quote notes:', { orderId, quoteNotes });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          quote_notes: quoteNotes,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating order quote notes:', error);
        throw new Error(`Failed to update order quote notes: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderQuoteNotes error:', error);
      throw error;
    }
  }

  static async updateOrderItem(itemId: string, updates: Partial<OrderItem>): Promise<void> {
    try {
      console.log('Updating order item:', { itemId, updates });
      
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating order item:', error);
        throw new Error(`Failed to update order item: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateOrderItem error:', error);
      throw error;
    }
  }

  static async removeOrderItem(itemId: string): Promise<void> {
    try {
      console.log('Removing order item:', { itemId });
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing order item:', error);
        throw new Error(`Failed to remove order item: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.removeOrderItem error:', error);
      throw error;
    }
  }

  static async addOrderItem(orderId: string, itemData: Omit<OrderItem, 'id'>): Promise<string> {
    try {
      console.log('Adding order item:', { orderId, itemData });
      
      // Check if base orderId already exists to determine unique order_id
      const { data: existingOrders, error: checkError } = await supabase
        .from('orders')
        .select('order_id')
        .like('order_id', `${orderId}%`)
        .order('order_id', { ascending: false });

      if (checkError) {
        console.error('Error checking existing orders:', checkError);
        throw new Error(`Failed to check existing orders: ${checkError.message}`);
      }

      // Generate unique order_id
      let uniqueOrderId = orderId;
      if (existingOrders && existingOrders.length > 0) {
        // Find the highest suffix number
        let maxSuffix = 0;
        existingOrders.forEach(order => {
          if (order.order_id === orderId) {
            maxSuffix = Math.max(maxSuffix, 1);
          } else if (order.order_id.startsWith(`${orderId}-`)) {
            const suffix = parseInt(order.order_id.split('-').pop() || '0');
            if (!isNaN(suffix)) {
              maxSuffix = Math.max(maxSuffix, suffix);
            }
          }
        });
        
        // If base orderId exists, start with suffix
        if (maxSuffix > 0) {
          uniqueOrderId = `${orderId}-${maxSuffix + 1}`;
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_id: uniqueOrderId,
          product_id: itemData.product_name, // Store product ID in product_id field
          quantity: itemData.quantity,
          unit: itemData.unit,
          unit_price: itemData.unit_price,
          total_price: itemData.total_price,
          delivery_date: itemData.delivery_date,
          delivery_street: itemData.delivery_address.street,
          delivery_city: itemData.delivery_address.city,
          delivery_state: itemData.delivery_address.state,
          delivery_zip: itemData.delivery_address.zip,
          delivery_name: itemData.delivery_name,
          delivery_email: itemData.delivery_email,
          delivery_phone: itemData.delivery_phone,
          delivery_instructions: itemData.delivery_instructions,
          delivery_time_preference: itemData.delivery_time_preference,
          status: itemData.status,
          fulfillment_status: itemData.fulfillment_status,
          notes: itemData.notes,
          supplier_id: itemData.supplier_id,
          supplier_charges: itemData.supplier_charges,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding order item:', error);
        throw new Error(`Failed to add order item: ${error.message}`);
      }

      console.log('Order item added successfully with order_id:', uniqueOrderId);
      return data.id;
    } catch (error) {
      console.error('OrderService.addOrderItem error:', error);
      throw error;
    }
  }

  static async updateDeliveryInfo(orderId: string, deliveryData: {
    delivery_name?: string;
    delivery_email?: string;
    delivery_phone?: string;
    delivery_street?: string;
    delivery_city?: string;
    delivery_state?: string;
    delivery_zip?: string;
    delivery_instructions?: string;
    delivery_time_preference?: string;
  }): Promise<void> {
    try {
      console.log('Updating delivery info:', { orderId, deliveryData });
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          ...deliveryData,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error updating delivery info:', error);
        throw new Error(`Failed to update delivery info: ${error.message}`);
      }
    } catch (error) {
      console.error('OrderService.updateDeliveryInfo error:', error);
      throw error;
    }
  }
}
