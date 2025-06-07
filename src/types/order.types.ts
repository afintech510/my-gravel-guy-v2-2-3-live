
import type { Database } from '@/integrations/supabase/types';

// Base order row type from Supabase
export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

// Order status enum matching the database
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled'
  | 'paid';

// Enhanced delivery address interface
export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

// Individual order item interface for display purposes
export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  delivery_date: string;
  delivery_address: DeliveryAddress;
  status: OrderStatus;
  material_category?: string;
  material_size?: string;
  quantity_tons: number;
  quantity_yards?: number;
  total_price: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  delivery_time_preference?: string;
  delivery_instructions?: string;
}

// Grouped order interface for frontend display (multiple rows grouped by order_id)
export interface GroupedOrder {
  order_id: string;
  created_at: string;
  total_price: number;
  status: OrderStatus;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  updated_at?: string;
  customer_name?: string;
  customer_email?: string;
  items: OrderItem[];
}

// Legacy Order interface for backward compatibility
export interface Order extends GroupedOrder {}

// Order filters interface
export interface OrderFilters {
  searchTerm?: string;
  status?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

// Service response interface
export interface OrderServiceResponse {
  orders: GroupedOrder[];
  total: number;
  page: number;
  limit: number;
}

// Helper function to convert OrderRow to OrderItem
export function orderRowToOrderItem(row: OrderRow): OrderItem {
  return {
    id: row.id,
    product_name: row.product_id || 'Unknown Product', // Use product_id as fallback since product_name doesn't exist
    quantity: row.quantity_tons,
    unit_price: row.unit_price,
    delivery_date: row.delivery_date || row.created_at || new Date().toISOString(),
    delivery_address: {
      street: row.delivery_address_street || '',
      city: row.delivery_address_city || '',
      state: row.delivery_address_state || '',
      zip: row.delivery_address_zip || ''
    },
    status: (row.status as OrderStatus) || 'pending',
    material_category: row.material_category || undefined,
    material_size: row.material_size || undefined,
    quantity_tons: row.quantity_tons,
    quantity_yards: row.quantity_yards || undefined,
    total_price: row.total_price,
    contact_name: row.contact_name || undefined,
    contact_phone: row.contact_phone || undefined,
    contact_email: row.contact_email || undefined,
    delivery_time_preference: row.delivery_time_preference || undefined,
    delivery_instructions: row.delivery_instructions || undefined
  };
}

// Helper function to group order rows by order_id
export function groupOrderRows(orderRows: OrderRow[]): GroupedOrder[] {
  const orderMap = new Map<string, GroupedOrder>();

  orderRows.forEach(row => {
    const orderId = row.order_id;
    
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        order_id: orderId,
        created_at: row.created_at || new Date().toISOString(),
        total_price: 0, // Will be calculated from items
        status: (row.status as OrderStatus) || 'pending',
        stripe_session_id: row.stripe_session_id,
        stripe_payment_intent_id: row.stripe_payment_intent_id || undefined,
        updated_at: row.updated_at || undefined,
        customer_name: row.customer_name || undefined,
        customer_email: row.customer_email || undefined,
        items: []
      });
    }

    const order = orderMap.get(orderId)!;
    const orderItem = orderRowToOrderItem(row);
    
    order.items.push(orderItem);
    
    // Update total price (sum of all items)
    order.total_price += orderItem.total_price;
  });

  return Array.from(orderMap.values());
}
