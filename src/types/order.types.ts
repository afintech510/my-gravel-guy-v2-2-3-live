import type { Database } from '@/integrations/supabase/types';

// Base order row type from Supabase - using the actual schema
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
  | 'paid'
  | 'test'; // Added test status

// Fulfillment status enum matching the database
export type FulfillmentStatus = 
  | 'Quote Needed'
  | 'Quote Sent' 
  | 'New Order'
  | 'Pending'
  | 'Assigned'
  | 'Scheduled'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'
  | 'On Hold'
  | 'Call to Schedule'
  | 'Archived'
  | 'Converted to Order';

// Enhanced delivery address interface
export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

// Individual order item interface for display purposes - updated to match actual schema
export interface OrderItem {
  id: string;
  product_name: string; // This will be derived from product_id
  quantity: number; // Maps to quantity field in database
  unit_price: number;
  delivery_date: string;
  delivery_address: DeliveryAddress;
  status: OrderStatus;
  fulfillment_status?: FulfillmentStatus; // Added fulfillment status
  sales_person?: string; // Added sales person
  unit: string; // Added to match schema
  total_price: number;
  delivery_name?: string;
  delivery_phone?: string;
  delivery_email?: string;
  delivery_time_preference?: string;
  delivery_instructions?: string;
  notes?: string; // Internal notes
  quote_notes?: string; // Quote notes for email templates
  supplier_id?: string; // Added missing property
  supplier_charges?: number; // Added missing property
}

// Grouped order interface for frontend display (multiple rows grouped by order_id)
export interface GroupedOrder {
  order_id: string;
  created_at: string;
  total_price: number;
  status: OrderStatus;
  fulfillment_status?: FulfillmentStatus; // Added fulfillment status
  sales_person?: string; // Added sales person
  sales_commission?: number; // Added sales commission
  quote_notes?: string; // Added quote notes
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  updated_at?: string;
  billing_name?: string;
  billing_email?: string;
  items: OrderItem[];
}

// Legacy Order interface for backward compatibility
export interface Order extends GroupedOrder {}

// Order filters interface - updated to use fulfillment_status
export interface OrderFilters {
  searchTerm?: string;
  fulfillmentStatus?: FulfillmentStatus | 'all'; // Changed from status to fulfillmentStatus
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  quotesOnly?: boolean;
  excludeQuotes?: boolean;
}

// Service response interface
export interface OrderServiceResponse {
  orders: GroupedOrder[];
  total: number;
  page: number;
  limit: number;
}

// Helper function to convert OrderRow to OrderItem - updated for actual schema
export function orderRowToOrderItem(row: OrderRow): OrderItem {
  return {
    id: row.id,
    product_name: row.product_id || 'Unknown Product', // Use product_id as fallback since product_name doesn't exist in schema
    quantity: row.quantity || 1,
    unit_price: row.unit_price,
    delivery_date: row.delivery_date || row.created_at || new Date().toISOString(),
    delivery_address: {
      street: row.delivery_street || '',
      city: row.delivery_city || '',
      state: row.delivery_state || '',
      zip: row.delivery_zip || ''
    },
    status: (row.status as OrderStatus) || 'pending',
    fulfillment_status: row.fulfillment_status || undefined, // Added fulfillment status
    sales_person: row.sales_person || undefined, // Added sales person
    unit: row.unit,
    total_price: row.total_price,
    delivery_name: row.delivery_name || undefined,
    delivery_phone: row.delivery_phone || undefined,
    delivery_email: row.delivery_email || undefined,
    delivery_time_preference: row.delivery_time_preference || undefined,
    delivery_instructions: row.delivery_instructions || undefined,
    notes: row.notes || undefined, // Internal notes
    quote_notes: row.quote_notes || undefined, // Quote notes for email templates
    supplier_id: row.supplier_id || undefined, // Added missing property mapping
    supplier_charges: row.supplier_charges || undefined // Added missing property mapping
  };
}

// Helper function to group order rows by order_id
export function groupOrderRows(orderRows: OrderRow[], useBaseOrderId: boolean = false): GroupedOrder[] {
  const orderMap = new Map<string, GroupedOrder>();

  // Helper function to extract base order ID (remove suffixes like -1, -2, etc.)
  const extractBaseOrderId = (orderId: string): string => {
    if (!useBaseOrderId) return orderId;
    
    // Split by dash and check if last part is a number
    const parts = orderId.split('-');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      // If last part is just a number, remove it to get base order ID
      if (/^\d+$/.test(lastPart)) {
        return parts.slice(0, -1).join('-');
      }
    }
    return orderId;
  };

  orderRows.forEach(row => {
    const displayOrderId = useBaseOrderId ? extractBaseOrderId(row.order_id) : row.order_id;
    const groupingKey = displayOrderId;
    
    if (!orderMap.has(groupingKey)) {
      orderMap.set(groupingKey, {
        order_id: displayOrderId,
        created_at: row.created_at || new Date().toISOString(),
        total_price: 0, // Will be calculated from items
        status: (row.status as OrderStatus) || 'pending',
        fulfillment_status: row.fulfillment_status || undefined, // Added fulfillment status
        sales_person: row.sales_person || undefined, // Added sales person
        sales_commission: (row as any).sales_commission || undefined, // Added sales commission
        quote_notes: (row as any).quote_notes || undefined, // Added quote notes
        stripe_session_id: row.stripe_session_id,
        stripe_payment_intent_id: row.stripe_payment_intent_id || undefined,
        updated_at: row.updated_at || undefined,
        billing_name: row.billing_name || undefined,
        billing_email: row.billing_email || undefined,
        items: []
      });
    }

    const order = orderMap.get(groupingKey)!;
    const orderItem = orderRowToOrderItem(row);
    
    // Validate consistency: check if customer info matches
    const existingCustomer = order.billing_name;
    const currentCustomer = row.billing_name;
    
    if (existingCustomer && currentCustomer && existingCustomer !== currentCustomer) {
      console.warn('Customer data inconsistency detected in groupOrderRows:', {
        orderId: displayOrderId,
        existingCustomer,
        currentCustomer,
        currentRowId: row.order_id
      });
    }
    
    order.items.push(orderItem);
    
    // Update total price (sum of all items)
    order.total_price += orderItem.total_price;
  });

  return Array.from(orderMap.values());
}
