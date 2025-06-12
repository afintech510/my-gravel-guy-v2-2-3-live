
import type { Supplier, SupplierInsert, SupplierUpdate } from '@/types/supplier.types';

// Mock supplier data since suppliers table doesn't exist in current schema
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'ABC Stone & Gravel Co.',
    email: 'orders@abcstone.com',
    phone: '(555) 123-4567',
    address: '123 Quarry Road, Stone City, TX 75001',
    notes: 'Reliable delivery, bulk orders preferred',
    created_at: new Date().toISOString(),
  },
  {
    id: '2', 
    name: 'Central Texas Materials',
    email: 'dispatch@ctmaterials.com',
    phone: '(555) 987-6543',
    address: '456 Industrial Blvd, Austin, TX 78701',
    notes: 'Fast turnaround, competitive pricing',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Hill Country Aggregates',
    email: 'sales@hcaggregates.com', 
    phone: '(555) 456-7890',
    address: '789 Limestone Lane, Georgetown, TX 78626',
    notes: 'Specialty limestone products',
    created_at: new Date().toISOString(),
  }
];

export class SupplierService {
  /**
   * Fetch all suppliers - using mock data since suppliers table doesn't exist
   */
  static async fetchSuppliers(): Promise<Supplier[]> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return mock data sorted by name
      return mockSuppliers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('SupplierService.fetchSuppliers error:', error);
      throw error;
    }
  }

  /**
   * Create a new supplier - using mock implementation
   */
  static async createSupplier(supplier: SupplierInsert): Promise<Supplier> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newSupplier: Supplier = {
        id: Date.now().toString(), // Simple ID generation for mock
        ...supplier,
        created_at: new Date().toISOString()
      };
      
      // Add to mock data
      mockSuppliers.push(newSupplier);
      
      return newSupplier;
    } catch (error) {
      console.error('SupplierService.createSupplier error:', error);
      throw error;
    }
  }

  /**
   * Update supplier information - using mock implementation
   */
  static async updateSupplier(id: string, updates: SupplierUpdate): Promise<void> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const supplierIndex = mockSuppliers.findIndex(s => s.id === id);
      if (supplierIndex === -1) {
        throw new Error('Supplier not found');
      }
      
      // Update the supplier in mock data
      mockSuppliers[supplierIndex] = {
        ...mockSuppliers[supplierIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('SupplierService.updateSupplier error:', error);
      throw error;
    }
  }
}
