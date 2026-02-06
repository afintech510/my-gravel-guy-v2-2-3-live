import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, User, Phone, Mail, Package, MapPin } from 'lucide-react';
import { LeadInsert } from '@/types/supplierQuote.types';

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: LeadInsert) => void;
}

export function NewLeadModal({ open, onOpenChange, onSave }: NewLeadModalProps) {
  const [formData, setFormData] = useState<LeadInsert>({
    display_name: '',
    phone: '',
    email: '',
    material: '',
    requested_qty: undefined,
    requested_unit: 'tons',
    job_address: '',
    job_city: '',
    job_state: '',
    job_zip: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.display_name.trim()) {
      onSave(formData);
      setFormData({
        display_name: '',
        phone: '',
        email: '',
        material: '',
        requested_qty: undefined,
        requested_unit: 'tons',
        job_address: '',
        job_city: '',
        job_state: '',
        job_zip: '',
        notes: '',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            New Lead
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name / Company *
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="John Doe or ABC Corp"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Material Needed
              </Label>
              <Input
                id="material"
                value={formData.material || ''}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="e.g., #57 Limestone"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requested_qty">Quantity</Label>
              <div className="flex gap-2">
                <Input
                  id="requested_qty"
                  type="number"
                  value={formData.requested_qty || ''}
                  onChange={(e) => setFormData({ ...formData, requested_qty: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
                <select
                  value={formData.requested_unit || 'tons'}
                  onChange={(e) => setFormData({ ...formData, requested_unit: e.target.value })}
                  className="w-20 rounded-md bg-muted border border-border px-2 text-sm text-foreground"
                >
                  <option value="tons">tons</option>
                  <option value="cy">CY</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="job_address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Job Site Address
            </Label>
            <Input
              id="job_address"
              value={formData.job_address || ''}
              onChange={(e) => setFormData({ ...formData, job_address: e.target.value })}
              placeholder="Street address"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={formData.job_city || ''}
                onChange={(e) => setFormData({ ...formData, job_city: e.target.value })}
                placeholder="City"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={formData.job_state || ''}
                onChange={(e) => setFormData({ ...formData, job_state: e.target.value })}
                placeholder="State"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={formData.job_zip || ''}
                onChange={(e) => setFormData({ ...formData, job_zip: e.target.value })}
                placeholder="ZIP"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional lead notes..."
              className="bg-muted border-border min-h-[60px] text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
