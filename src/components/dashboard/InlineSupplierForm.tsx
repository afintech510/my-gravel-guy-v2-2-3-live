
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/ui/tag-input';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { SupplierService } from '@/services/supplierService';
import type { Supplier, SupplierInsert } from '@/types/supplier.types';

interface InlineSupplierFormProps {
  onSupplierCreated: (supplier: Supplier) => void;
  onCancel: () => void;
}

const InlineSupplierForm: React.FC<InlineSupplierFormProps> = ({
  onSupplierCreated,
  onCancel
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSupplier, setNewSupplier] = useState<SupplierInsert>({
    name: '',
    email: '',
    phone: '',
    address: '',
    service_areas: [],
    materials: []
  });

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a supplier name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const createdSupplier = await SupplierService.createSupplier(newSupplier);
      
      onSupplierCreated(createdSupplier);
      
      setNewSupplier({
        name: '',
        email: '',
        phone: '',
        address: '',
        service_areas: [],
        materials: []
      });
      
      toast({
        title: "Supplier Created",
        description: `${createdSupplier.name} has been added successfully`,
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Error",
        description: "Failed to create supplier",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Add New Supplier
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-md bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Name *</Label>
            <Input
              id="supplier-name"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter supplier name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              type="email"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input
              id="supplier-phone"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-address">Address</Label>
            <Textarea
              id="supplier-address"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter address"
              rows={2}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Service Areas</Label>
            <TagInput
              value={newSupplier.service_areas || []}
              onChange={(areas) => setNewSupplier(prev => ({ ...prev, service_areas: areas }))}
              placeholder="Type service area and press Enter"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Materials</Label>
            <TagInput
              value={newSupplier.materials || []}
              onChange={(materials) => setNewSupplier(prev => ({ ...prev, materials }))}
              placeholder="Type material and press Enter"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSupplier}
            disabled={isCreating || !newSupplier.name.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Supplier'
            )}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default InlineSupplierForm;
