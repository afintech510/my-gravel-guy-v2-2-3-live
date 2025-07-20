
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupplierService } from '@/services/supplierService';
import InlineSupplierForm from './InlineSupplierForm';
import type { Supplier } from '@/types/supplier.types';

interface SupplierSelectorProps {
  value?: string;
  onValueChange: (supplierId: string) => void;
  disabled?: boolean;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onValueChange,
  disabled = false
}) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const fetchedSuppliers = await SupplierService.fetchSuppliers();
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierCreated = (newSupplier: Supplier) => {
    setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    onValueChange(newSupplier.id);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Loading suppliers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{supplier.name}</span>
                  {supplier.email && (
                    <span className="text-xs text-muted-foreground">{supplier.email}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {showForm && (
        <InlineSupplierForm
          onSupplierCreated={handleSupplierCreated}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default SupplierSelector;
