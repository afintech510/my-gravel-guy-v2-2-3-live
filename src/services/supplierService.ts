
import { supabase } from '@/integrations/supabase/client';
import type { Supplier, SupplierInsert, SupplierUpdate } from '@/types/supplier.types';

export class SupplierService {
  /**
   * Fetch all suppliers from the database
   */
  static async fetchSuppliers(): Promise<Supplier[]> {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('SupplierService.fetchSuppliers error:', error);
        throw error;
      }

      return suppliers?.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: typeof supplier.address === 'string' 
          ? supplier.address 
          : (supplier.address as { street?: string })?.street || '',
        notes: '', // Not in suppliers table, keeping for compatibility
        created_at: supplier.created_at,
        updated_at: supplier.updated_at,
        service_areas: supplier.service_areas || [],
        materials: supplier.materials || []
      })) || [];
    } catch (error) {
      console.error('SupplierService.fetchSuppliers error:', error);
      throw error;
    }
  }

  /**
   * Create a new supplier in the database
   */
  static async createSupplier(supplier: SupplierInsert): Promise<Supplier> {
    try {
      const supplierData = {
        name: supplier.name,
        email: supplier.email || null,
        phone: supplier.phone || null,
        address: supplier.address ? { street: supplier.address } : null,
        service_areas: supplier.service_areas || [],
        materials: supplier.materials || [],
        active: true
      };

      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) {
        console.error('SupplierService.createSupplier error:', error);
        throw error;
      }

      return {
        id: newSupplier.id,
        name: newSupplier.name,
        email: newSupplier.email || '',
        phone: newSupplier.phone || '',
        address: typeof newSupplier.address === 'string' 
          ? newSupplier.address 
          : (newSupplier.address as { street?: string })?.street || '',
        notes: '',
        created_at: newSupplier.created_at,
        updated_at: newSupplier.updated_at,
        service_areas: newSupplier.service_areas || [],
        materials: newSupplier.materials || []
      };
    } catch (error) {
      console.error('SupplierService.createSupplier error:', error);
      throw error;
    }
  }

  /**
   * Update supplier information in the database
   */
  static async updateSupplier(id: string, updates: SupplierUpdate): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.phone !== undefined) updateData.phone = updates.phone || null;
      if (updates.address !== undefined) {
        updateData.address = updates.address ? { street: updates.address } : null;
      }
      if (updates.service_areas !== undefined) updateData.service_areas = updates.service_areas;
      if (updates.materials !== undefined) updateData.materials = updates.materials;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('SupplierService.updateSupplier error:', error);
        throw error;
      }
    } catch (error) {
      console.error('SupplierService.updateSupplier error:', error);
      throw error;
    }
  }
}
