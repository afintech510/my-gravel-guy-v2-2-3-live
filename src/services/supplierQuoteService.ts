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
