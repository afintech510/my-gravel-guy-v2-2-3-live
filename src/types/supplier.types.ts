
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  service_areas?: string[];
  materials?: string[];
  active?: boolean;
}

export interface SupplierInsert {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  service_areas?: string[];
  materials?: string[];
  active?: boolean;
}

export interface SupplierUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  updated_at?: string;
  service_areas?: string[];
  materials?: string[];
  active?: boolean;
}
