export interface Lead {
  id: string;
  display_name: string;
  phone?: string;
  email?: string;
  material?: string;
  requested_qty?: number;
  requested_unit?: string;
  job_address?: string;
  job_city?: string;
  job_state?: string;
  job_zip?: string;
  target_price?: number;
  timeline?: string;
  site_access?: string[];
  notes?: string;
  // Delivery scheduling fields (from cart saves)
  delivery_date?: string;
  delivery_time_preference?: string;
  delivery_instructions?: string;
  created_at: string;
}

export interface LeadInsert extends Omit<Lead, 'id' | 'created_at'> {}

export interface SupplierQuote {
  id: string;
  lead_id?: string;
  
  // Product Association
  product_id?: string;
  material?: string;
  
  // Supplier
  supplier_name?: string;
  supplier_phone?: string;
  supplier_address?: string;
  supplier_notes?: string;
  
  // Project Requirements
  qty_tons?: number;
  qty_cy?: number;
  spec_requirement?: string;
  application?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  site_access?: string[];
  project_notes?: string;
  
  // Quote Details Flags
  is_all_in?: boolean;
  material_is_unit?: boolean;
  material_is_total?: boolean;
  delivery_included?: boolean;
  delivery_flat?: boolean;
  delivery_hourly?: boolean;
  
  // Quote Details Values
  material_price?: number;
  material_unit?: string;
  delivery_rate?: number;
  delivery_basis?: string;
  all_in_delivered_total?: number;
  max_qty_per_load?: number;
  max_qty_unit?: string;
  lead_time?: string;
  lead_time_notes?: string;
  available_trucks?: string[];
  truck_notes?: string;
  
  // Billing & Payment
  payment_methods?: string[];
  cc_fee_percent?: number;
  bill_by_load_tickets?: boolean;
  payment_notes?: string;
  
  // Computed
  price_summary?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
}

export interface SupplierQuoteInsert extends Omit<SupplierQuote, 'id' | 'created_at'> {}

// Form state types
export interface SupplierQuoteFormData {
  lead_id: string;
  supplier_name: string;
  supplier_phone: string;
  supplier_address: string;
  supplier_notes: string;
  
  product_id: string | null;
  material: string;
  
  spec_requirement: string;
  application: string;
  qty_tons: string;
  qty_cy: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip: string;
  site_access: string[];
  project_notes: string;
  
  // Lead contact info
  contact_phone: string;
  contact_email: string;
  
  // Delivery scheduling
  delivery_date: string;
  delivery_time: string;
  delivery_instructions: string;
  
  material_price: string;
  material_unit: string;
  delivery_rate: string;
  delivery_basis: string;
  all_in_delivered_total: string;
  max_qty_per_load: string;
  max_qty_unit: string;
  lead_time: string;
  lead_time_notes: string;
  available_trucks: string[];
  truck_notes: string;
  
  payment_methods: string[];
  cc_fee_percent: string;
  bill_by_load_tickets: boolean;
  payment_notes: string;
}

export interface SupplierQuoteFlags {
  is_all_in: boolean;
  material_is_unit: boolean;
  material_is_total: boolean;
  delivery_included: boolean;
  delivery_flat: boolean;
  delivery_hourly: boolean;
}

export const INITIAL_FLAGS: SupplierQuoteFlags = {
  is_all_in: false,
  material_is_unit: true,
  material_is_total: false,
  delivery_included: false,
  delivery_flat: true,
  delivery_hourly: false,
};

export const INITIAL_FORM_DATA: SupplierQuoteFormData = {
  lead_id: '',
  supplier_name: '',
  supplier_phone: '',
  supplier_address: '',
  supplier_notes: '',
  
  product_id: null,
  material: '',
  
  spec_requirement: '',
  application: '',
  qty_tons: '',
  qty_cy: '',
  delivery_address: '',
  delivery_city: '',
  delivery_state: '',
  delivery_zip: '',
  site_access: [],
  project_notes: '',
  
  // Lead contact info
  contact_phone: '',
  contact_email: '',
  
  // Delivery scheduling
  delivery_date: '',
  delivery_time: '',
  delivery_instructions: '',
  
  material_price: '',
  material_unit: 'ton',
  delivery_rate: '',
  delivery_basis: 'total',
  all_in_delivered_total: '',
  max_qty_per_load: '',
  max_qty_unit: 'ton',
  lead_time: '',
  lead_time_notes: '',
  available_trucks: [],
  truck_notes: '',
  
  payment_methods: [],
  cc_fee_percent: '0',
  bill_by_load_tickets: false,
  payment_notes: '',
};

// Option types for pills
export const SITE_ACCESS_OPTIONS = [
  { id: 'small', label: 'Small' },
  { id: 'tri_axle', label: 'Tri-Axle' },
  { id: 'semi_trailer', label: 'Semi/Trailer' },
] as const;

export const TRUCK_SIZE_OPTIONS = [
  { id: 'small_upto_10', label: 'Small ≤10t' },
  { id: 'med_10_19', label: 'Med 10-19t' },
  { id: 'tri_axle_20_22', label: 'Tri 20-22t' },
  { id: 'quad_23_25', label: 'Quad 23-25t' },
  { id: 'semi_25_27', label: 'Semi 25-27t' },
  { id: 'semi_28_30', label: 'Semi 28-30t' },
  { id: 'live_bottom_32_35', label: 'Live 32-35t' },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  'CC', 'Wire', 'ACH', 'NET10', 'NET30', 'Venmo', 'Zelle', 'Paypal', 'CashApp'
] as const;

// Helper function
export function generatePriceSummary(
  data: SupplierQuoteFormData,
  flags: SupplierQuoteFlags
): string {
  if (flags.is_all_in && data.all_in_delivered_total) {
    return `Delivered Total $${data.all_in_delivered_total}`;
  }

  const parts: string[] = [];
  
  // Material Part
  if (data.material_price) {
    if (flags.material_is_total) {
      parts.push(`$${data.material_price} Total Mat`);
    } else {
      parts.push(`$${data.material_price}/${data.material_unit}`);
    }
  }

  // Delivery Part
  if (flags.delivery_included) {
    parts.push(`Del. Incl.`);
  } else if (data.delivery_rate) {
    if (flags.delivery_hourly) {
      parts.push(`$${data.delivery_rate}/hr`);
    } else {
      parts.push(`$${data.delivery_rate} Del.`);
    }
  }

  // Max Load Part
  if (data.max_qty_per_load) {
    parts.push(`Max ${data.max_qty_per_load} ${data.max_qty_unit}`);
  }

  if (parts.length === 0) return "Draft Quote";
  return parts.join(" • ");
}

// Quote totals calculator
export interface QuoteTotals {
  totalCost: number;
  pricePerTon: number;
  totalTons: number;
}

export function calculateQuoteTotals(
  data: SupplierQuoteFormData | SupplierQuote,
  flags?: SupplierQuoteFlags
): QuoteTotals {
  // Handle both form data (strings) and quote data (numbers)
  const isFormData = typeof (data as SupplierQuoteFormData).qty_tons === 'string';
  
  const tons = isFormData 
    ? parseFloat((data as SupplierQuoteFormData).qty_tons) || 0
    : (data as SupplierQuote).qty_tons || 0;
  
  const materialPrice = isFormData
    ? parseFloat((data as SupplierQuoteFormData).material_price) || 0
    : (data as SupplierQuote).material_price || 0;
  
  const deliveryRate = isFormData
    ? parseFloat((data as SupplierQuoteFormData).delivery_rate) || 0
    : (data as SupplierQuote).delivery_rate || 0;
  
  const allInTotal = isFormData
    ? parseFloat((data as SupplierQuoteFormData).all_in_delivered_total) || 0
    : (data as SupplierQuote).all_in_delivered_total || 0;
  
  const ccFeePercent = isFormData
    ? parseFloat((data as SupplierQuoteFormData).cc_fee_percent) || 0
    : (data as SupplierQuote).cc_fee_percent || 0;

  // Get flags - either from param or from quote data
  const effectiveFlags = flags || {
    is_all_in: (data as SupplierQuote).is_all_in || false,
    material_is_unit: (data as SupplierQuote).material_is_unit ?? true,
    material_is_total: (data as SupplierQuote).material_is_total || false,
    delivery_included: (data as SupplierQuote).delivery_included || false,
    delivery_flat: (data as SupplierQuote).delivery_flat ?? true,
    delivery_hourly: (data as SupplierQuote).delivery_hourly || false,
  };

  let totalCost = 0;
  
  if (effectiveFlags.is_all_in) {
    totalCost = allInTotal;
  } else {
    // Calculate material cost
    const materialCost = effectiveFlags.material_is_total 
      ? materialPrice 
      : materialPrice * tons;
    
    // Calculate delivery cost (only if not included)
    const deliveryCost = effectiveFlags.delivery_included ? 0 : deliveryRate;
    
    // Subtotal
    const subtotal = materialCost + deliveryCost;
    
    // Add CC fee if applicable
    const ccFee = (ccFeePercent / 100) * subtotal;
    totalCost = subtotal + ccFee;
  }
  
  const pricePerTon = tons > 0 ? totalCost / tons : 0;
  
  return { totalCost, pricePerTon, totalTons: tons };
}
