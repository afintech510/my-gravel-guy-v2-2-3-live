
import { supabase } from '@/integrations/supabase/client';
import type { Supplier, SupplierInsert, SupplierUpdate } from '@/types/supplier.types';

export class SupplierService {
  /**
   * Fetch all suppliers from the database
   */
  static async fetchSuppliers(): Promise<Supplier[]> {
    try {
      console.log('Fetching suppliers from database...');
      
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('SupplierService.fetchSuppliers error:', error);
        throw error;
      }

      console.log('Raw supplier data from database:', suppliers);

      if (!suppliers || suppliers.length === 0) {
        console.log('No suppliers found in database');
        return [];
      }

      const transformedSuppliers = suppliers.map(supplier => {
        console.log('Transforming supplier:', supplier);
        
        // Handle address field - could be string, JSON object, or null
        let addressString = '';
        if (supplier.address) {
          if (typeof supplier.address === 'string') {
            addressString = supplier.address;
          } else if (typeof supplier.address === 'object' && !Array.isArray(supplier.address)) {
            // Handle JSON object address format
            const addressObj = supplier.address as Record<string, any>;
            if (addressObj.street) {
              addressString = addressObj.street;
            } else {
              // Handle other potential address formats
              addressString = JSON.stringify(supplier.address);
            }
          } else if (typeof supplier.address === 'object') {
            // Handle other potential address formats
            addressString = JSON.stringify(supplier.address);
          }
        }

        // Handle email field - filter out null, undefined, and '<nil>' values
        const emailValue = supplier.email && supplier.email !== '<nil>' ? supplier.email : '';
        
        // Handle phone field - filter out null, undefined, and '<nil>' values
        const phoneValue = supplier.phone && supplier.phone !== '<nil>' ? supplier.phone : '';

        const transformed = {
          id: supplier.id,
          name: supplier.name || '',
          email: emailValue,
          phone: phoneValue,
          address: addressString,
          notes: '', // Not in suppliers table, keeping for compatibility
          created_at: supplier.created_at,
          updated_at: supplier.updated_at,
          service_areas: Array.isArray(supplier.service_areas) ? supplier.service_areas : [],
          materials: Array.isArray(supplier.materials) ? supplier.materials : []
        };

        console.log('Transformed supplier:', transformed);
        return transformed;
      });

      console.log('All transformed suppliers:', transformedSuppliers);
      return transformedSuppliers;
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
   * Find supplier ID by name
   */
  static async findSupplierIdByName(supplierName: string): Promise<string | null> {
    try {
      console.log('Looking for supplier with name:', supplierName);
      
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', supplierName)
        .eq('active', true)
        .single();

      if (error) {
        console.log('Supplier not found by name:', supplierName, error);
        return null;
      }

      console.log('Found supplier ID:', supplier?.id);
      return supplier?.id || null;
    } catch (error) {
      console.error('SupplierService.findSupplierIdByName error:', error);
      return null;
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
