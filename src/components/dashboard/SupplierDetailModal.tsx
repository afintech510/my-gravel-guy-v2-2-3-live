import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, User, Package, History, BarChart3, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Supplier, SupplierInsert, SupplierUpdate } from '@/types/supplier.types';
import { SupplierService } from '@/services/supplierService';
import SupplierOrderHistory from './SupplierOrderHistory';
import { format } from 'date-fns';

interface SupplierDetailModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSupplierUpdate: () => void;
  mode: 'view' | 'edit' | 'create';
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onSupplierUpdate,
  mode
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    service_areas: [] as string[],
    materials: [] as string[],
    active: true
  });

  // Initialize form data when supplier or mode changes
  React.useEffect(() => {
    if (supplier && (mode === 'view' || mode === 'edit')) {
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
        service_areas: supplier.service_areas || [],
        materials: supplier.materials || [],
        active: supplier.active !== false
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        service_areas: [],
        materials: [],
        active: true
      });
    }
    setIsEditing(mode === 'edit' || mode === 'create');
  }, [supplier, mode]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a supplier name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (mode === 'create') {
        const supplierData: SupplierInsert = {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          service_areas: formData.service_areas,
          materials: formData.materials
        };

        await SupplierService.createSupplier(supplierData);
        toast({
          title: "Supplier Created",
          description: "Supplier has been created successfully",
        });
      } else if (supplier) {
        const updateData: SupplierUpdate = {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          service_areas: formData.service_areas,
          materials: formData.materials,
          updated_at: new Date().toISOString()
        };

        await SupplierService.updateSupplier(supplier.id, updateData);
        toast({
          title: "Supplier Updated",
          description: "Supplier has been updated successfully",
        });
      }

      onSupplierUpdate();
      if (mode === 'create') {
        onClose();
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'create') {
      onClose();
    } else {
      setIsEditing(false);
      // Reset form data to original values
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          notes: supplier.notes || '',
          service_areas: supplier.service_areas || [],
          materials: supplier.materials || [],
          active: supplier.active !== false
        });
      }
    }
  };

  const addServiceArea = (area: string) => {
    if (area.trim() && !formData.service_areas.includes(area.trim())) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, area.trim()]
      }));
    }
  };

  const removeServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== area)
    }));
  };

  const addMaterial = (material: string) => {
    if (material.trim() && !formData.materials.includes(material.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, material.trim()]
      }));
    }
  };

  const removeMaterial = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m !== material)
    }));
  };

  const modalTitle = mode === 'create' ? 'Add New Supplier' : 
                   mode === 'edit' ? `Edit Supplier - ${supplier?.name}` : 
                   `Supplier Details - ${supplier?.name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {modalTitle}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {mode !== 'create' && (
                <Badge variant={formData.active ? "default" : "secondary"}>
                  {formData.active ? "Active" : "Inactive"}
                </Badge>
              )}
              {!isEditing && mode !== 'create' && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            {mode !== 'create' && supplier && (
              <>
                <TabsTrigger value="orders">Order History</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Supplier name"
                      />
                    ) : (
                      <p className="text-sm mt-1">{formData.name || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="supplier@example.com"
                      />
                    ) : (
                      <p className="text-sm mt-1">
                        {formData.email ? (
                          <a href={`mailto:${formData.email}`} className="text-blue-600 hover:underline">
                            {formData.email}
                          </a>
                        ) : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <p className="text-sm mt-1">
                        {formData.phone ? (
                          <a href={`tel:${formData.phone}`} className="text-blue-600 hover:underline">
                            {formData.phone}
                          </a>
                        ) : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street address, city, state, zip"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm mt-1 whitespace-pre-wrap">{formData.address || 'N/A'}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Service Areas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.service_areas.map((area, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {area}
                          {isEditing && (
                            <button
                              onClick={() => removeServiceArea(area)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Input
                        placeholder="Add service area (press Enter)"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addServiceArea(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <Label>Materials</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.materials.map((material, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {material}
                          {isEditing && (
                            <button
                              onClick={() => removeMaterial(material)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <Input
                        placeholder="Add material (press Enter)"
                        className="mt-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addMaterial(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this supplier"
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm mt-1 whitespace-pre-wrap">{formData.notes || 'No notes'}</p>
                    )}
                  </div>

                  {mode !== 'create' && supplier && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {format(new Date(supplier.created_at), 'MMM d, yyyy h:mm a')}</p>
                      {supplier.updated_at && (
                        <p>Updated: {format(new Date(supplier.updated_at), 'MMM d, yyyy h:mm a')}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {mode !== 'create' && supplier && (
            <>
              <TabsContent value="orders" className="space-y-4">
                <SupplierOrderHistory supplierId={supplier.id} />
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Supplier analytics coming soon...
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Communication Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Communication history coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDetailModal;