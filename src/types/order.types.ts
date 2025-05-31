
export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  delivery_date: string;
  delivery_address: DeliveryAddress;
  status: 'pending' | 'confirmed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';
}

export interface Order {
  order_id: string;
  created_at: string;
  total_price: number; // Changed from total_amount to match database
  status: 'pending' | 'confirmed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface OrderFilters {
  searchTerm?: string;
  status?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface OrderServiceResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}
