import { supabase } from '@/integrations/supabase/client';
import { 
  Lead, 
  LeadInsert, 
  SupplierQuote, 
  SupplierQuoteInsert,
  SupplierQuoteFormData,
  SupplierQuoteFlags,
  generatePriceSummary
} from '@/types/supplierQuote.types';

// Note: The 'leads' and 'supplier_quotes' tables need to be created manually in Supabase.
// Until then, these functions will return empty arrays/null and log warnings.
// The service uses 'any' type assertions to bypass TypeScript's strict table checking.

// ============ LEADS ============

export async function fetchLeads(limit = 50): Promise<Lead[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.warn('Leads table may not exist yet:', error.message);
      return [];
    }
    return (data as Lead[]) || [];
  } catch (err) {
    console.warn('Error fetching leads:', err);
    return [];
  }
}

export async function createLead(lead: LeadInsert): Promise<Lead | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('leads')
      .insert(lead)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating lead:', error);
      return null;
    }
    return data as Lead;
  } catch (err) {
    console.error('Error creating lead:', err);
    return null;
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.warn('Error fetching lead:', error.message);
      return null;
    }
    return data as Lead;
  } catch (err) {
    console.warn('Error fetching lead:', err);
    return null;
  }
}

// ============ LEAD FROM FORM HELPER ============

export interface LeadFromFormData {
  displayName: string;
  email?: string;
  phone?: string;
  material?: string;
  requestedQty?: number;
  requestedUnit?: string;
  jobAddress?: string;
  jobCity?: string;
  jobState?: string;
  jobZip?: string;
  timeline?: string;
  notes?: string;
  siteAccess?: string[];
  // Delivery scheduling fields (from cart saves)
  deliveryDate?: string;
  deliveryTimePreference?: string;
  deliveryInstructions?: string;
}

export async function createLeadFromForm(data: LeadFromFormData): Promise<Lead | null> {
  const lead: LeadInsert = {
    display_name: data.displayName,
    email: data.email,
    phone: data.phone,
    material: data.material,
    requested_qty: data.requestedQty,
    requested_unit: data.requestedUnit || 'tons',
    job_address: data.jobAddress,
    job_city: data.jobCity,
    job_state: data.jobState,
    job_zip: data.jobZip,
    timeline: data.timeline,
    notes: data.notes,
    site_access: data.siteAccess,
    // Delivery scheduling fields
    delivery_date: data.deliveryDate,
    delivery_time_preference: data.deliveryTimePreference,
    delivery_instructions: data.deliveryInstructions,
  };
  console.log('Creating lead from form:', lead);
  return createLead(lead);
}

// ============ UPDATE LEAD ============

export async function updateLead(id: string, updates: Partial<LeadInsert>): Promise<Lead | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating lead:', error);
      return null;
    }
    return data as Lead;
  } catch (err) {
    console.error('Error updating lead:', err);
    return null;
  }
}

// ============ SUPPLIER QUOTES ============

export async function fetchSupplierQuotes(limit = 20): Promise<SupplierQuote[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('supplier_quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.warn('Supplier quotes table may not exist yet:', error.message);
      return [];
    }
    return (data as SupplierQuote[]) || [];
  } catch (err) {
    console.warn('Error fetching supplier quotes:', err);
    return [];
  }
}

export async function fetchQuotesForLead(leadId: string): Promise<SupplierQuote[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('supplier_quotes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.warn('Error fetching quotes for lead:', error.message);
      return [];
    }
    return (data as SupplierQuote[]) || [];
  } catch (err) {
    console.warn('Error fetching quotes for lead:', err);
    return [];
  }
}

export async function getSupplierQuoteById(id: string): Promise<SupplierQuote | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('supplier_quotes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.warn('Error fetching supplier quote:', error.message);
      return null;
    }
    return data as SupplierQuote;
  } catch (err) {
    console.warn('Error fetching supplier quote:', err);
    return null;
  }
}

export async function createSupplierQuote(quote: SupplierQuoteInsert): Promise<SupplierQuote | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('supplier_quotes')
      .insert({
        ...quote,
        product_id: quote.product_id || null,
        material: quote.material,
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating supplier quote:', error);
      return null;
    }
    return data as SupplierQuote;
  } catch (err) {
    console.error('Error creating supplier quote:', err);
    return null;
  }
}

export async function updateSupplierQuote(id: string, quote: Partial<SupplierQuoteInsert>): Promise<SupplierQuote | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('supplier_quotes')
      .update(quote)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating supplier quote:', error);
      return null;
    }
    return data as SupplierQuote;
  } catch (err) {
    console.error('Error updating supplier quote:', err);
    return null;
  }
}

// Convert form data to insert format
export function formDataToQuoteInsert(
  data: SupplierQuoteFormData,
  flags: SupplierQuoteFlags
): SupplierQuoteInsert {
  return {
    lead_id: data.lead_id || undefined,
    product_id: data.product_id || undefined,
    material: data.material || undefined,
    supplier_name: data.supplier_name || undefined,
    supplier_phone: data.supplier_phone || undefined,
    supplier_address: data.supplier_address || undefined,
    supplier_notes: data.supplier_notes || undefined,
    qty_tons: data.qty_tons ? parseFloat(data.qty_tons) : undefined,
    qty_cy: data.qty_cy ? parseFloat(data.qty_cy) : undefined,
    spec_requirement: data.spec_requirement || undefined,
    application: data.application || undefined,
    delivery_address: data.delivery_address || undefined,
    delivery_city: data.delivery_city || undefined,
    delivery_state: data.delivery_state || undefined,
    delivery_zip: data.delivery_zip || undefined,
    site_access: data.site_access.length > 0 ? data.site_access : undefined,
    project_notes: data.project_notes || undefined,
    is_all_in: flags.is_all_in,
    material_is_unit: flags.material_is_unit,
    material_is_total: flags.material_is_total,
    delivery_included: flags.delivery_included,
    delivery_flat: flags.delivery_flat,
    delivery_hourly: flags.delivery_hourly,
    material_price: data.material_price ? parseFloat(data.material_price) : undefined,
    material_unit: data.material_unit || 'ton',
    delivery_rate: data.delivery_rate ? parseFloat(data.delivery_rate) : undefined,
    delivery_basis: data.delivery_basis || 'total',
    all_in_delivered_total: data.all_in_delivered_total ? parseFloat(data.all_in_delivered_total) : undefined,
    max_qty_per_load: data.max_qty_per_load ? parseFloat(data.max_qty_per_load) : undefined,
    max_qty_unit: data.max_qty_unit || 'ton',
    lead_time: data.lead_time || undefined,
    lead_time_notes: data.lead_time_notes || undefined,
    available_trucks: data.available_trucks.length > 0 ? data.available_trucks : undefined,
    truck_notes: data.truck_notes || undefined,
    payment_methods: data.payment_methods.length > 0 ? data.payment_methods : undefined,
    cc_fee_percent: data.cc_fee_percent ? parseFloat(data.cc_fee_percent) : undefined,
    bill_by_load_tickets: data.bill_by_load_tickets,
    payment_notes: data.payment_notes || undefined,
    price_summary: generatePriceSummary(data, flags),
  };
}

// Convert quote data to form data for editing
export function quoteToFormData(quote: SupplierQuote): { formData: SupplierQuoteFormData; flags: SupplierQuoteFlags } {
  return {
    formData: {
      lead_id: quote.lead_id || '',
      supplier_name: quote.supplier_name || '',
      supplier_phone: quote.supplier_phone || '',
      supplier_address: quote.supplier_address || '',
      supplier_notes: quote.supplier_notes || '',
      product_id: quote.product_id || null,
      material: quote.material || '',
      spec_requirement: quote.spec_requirement || '',
      application: quote.application || '',
      qty_tons: quote.qty_tons?.toString() || '',
      qty_cy: quote.qty_cy?.toString() || '',
      delivery_address: quote.delivery_address || '',
      delivery_city: quote.delivery_city || '',
      delivery_state: quote.delivery_state || '',
      delivery_zip: quote.delivery_zip || '',
      site_access: quote.site_access || [],
      project_notes: quote.project_notes || '',
      // Lead contact info (not stored in quote, but populated from lead)
      contact_phone: '',
      contact_email: '',
      // Delivery scheduling (not stored in quote currently)
      delivery_date: '',
      delivery_time: '',
      delivery_instructions: '',
      material_price: quote.material_price?.toString() || '',
      material_unit: quote.material_unit || 'ton',
      delivery_rate: quote.delivery_rate?.toString() || '',
      delivery_basis: quote.delivery_basis || 'total',
      all_in_delivered_total: quote.all_in_delivered_total?.toString() || '',
      max_qty_per_load: quote.max_qty_per_load?.toString() || '',
      max_qty_unit: quote.max_qty_unit || 'ton',
      lead_time: quote.lead_time || '',
      lead_time_notes: quote.lead_time_notes || '',
      available_trucks: quote.available_trucks || [],
      truck_notes: quote.truck_notes || '',
      payment_methods: quote.payment_methods || [],
      cc_fee_percent: quote.cc_fee_percent?.toString() || '0',
      bill_by_load_tickets: quote.bill_by_load_tickets || false,
      payment_notes: quote.payment_notes || '',
    },
    flags: {
      is_all_in: quote.is_all_in || false,
      material_is_unit: quote.material_is_unit ?? true,
      material_is_total: quote.material_is_total || false,
      delivery_included: quote.delivery_included || false,
      delivery_flat: quote.delivery_flat ?? true,
      delivery_hourly: quote.delivery_hourly || false,
    },
  };
}

// ============ STATS ============

export async function getQuoteStats(): Promise<{ count: number; lastPriceSummary: string | null }> {
  try {
    const { data, error, count } = await (supabase as any)
      .from('supplier_quotes')
      .select('price_summary', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.warn('Error fetching quote stats:', error.message);
      return { count: 0, lastPriceSummary: null };
    }
    
    return {
      count: count || 0,
      lastPriceSummary: data?.[0]?.price_summary || null,
    };
  } catch (err) {
    console.warn('Error fetching quote stats:', err);
    return { count: 0, lastPriceSummary: null };
  }
}
