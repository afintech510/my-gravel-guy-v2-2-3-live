
import { supabase } from '@/integrations/supabase/client';
import type { Supplier, SupplierInsert, SupplierUpdate } from '@/types/supplier.types';

export class SupplierService {
  /**
   * Fetch all suppliers
   */
  static async fetchSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error(`Failed to fetch suppliers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('SupplierService.fetchSuppliers error:', error);
      throw error;
    }
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(supplier: SupplierInsert): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplier,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier:', error);
        throw new Error(`Failed to create supplier: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('SupplierService.createSupplier error:', error);
      throw error;
    }
  }

  /**
   * Update supplier information
   */
  static async updateSupplier(id: string, updates: SupplierUpdate): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating supplier:', error);
        throw new Error(`Failed to update supplier: ${error.message}`);
      }
    } catch (error) {
      console.error('SupplierService.updateSupplier error:', error);
      throw error;
    }
  }
}
