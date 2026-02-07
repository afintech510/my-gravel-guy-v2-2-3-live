import React from 'react';
import { Package, MapPin, Plus, Phone, Mail, Calendar, Clock, FileText, Truck, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './shared/SectionHeader';
import { InputGroup } from './shared/InputGroup';
import { PillSelect } from './shared/PillSelect';
import { ProductAutocomplete } from './ProductAutocomplete';
import { SupplierQuoteFormData, SITE_ACCESS_OPTIONS, Lead } from '@/types/supplierQuote.types';
import { Product } from '@/services/productTypes';

interface ProjectRequirementsCardProps {
  data: SupplierQuoteFormData;
  onChange: (updates: Partial<SupplierQuoteFormData>) => void;
  leads: Lead[];
  onNewLead: () => void;
  onSaveLead: () => void;
  isSavingLead?: boolean;
}

export function ProjectRequirementsCard({ 
  data, 
  onChange, 
  leads, 
  onNewLead,
  onSaveLead,
  isSavingLead = false,
}: ProjectRequirementsCardProps) {
  const handleProductSelect = (product: Product | null, customText?: string) => {
    if (product) {
      onChange({
        product_id: product.id as string,
        material: product.name,
      });
    } else if (customText) {
      onChange({
        product_id: null,
        material: customText,
      });
    }
  };

  const toggleSiteAccess = (id: string) => {
    const current = data.site_access;
    if (current.includes(id)) {
      onChange({ site_access: current.filter(s => s !== id) });
    } else {
      onChange({ site_access: [...current, id] });
    }
  };

  return (
    <Card className="p-5 bg-card border-border">
      <SectionHeader icon={Package} title="Project Requirements">
        <div className="flex items-center gap-2">
          {/* Save Lead Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveLead}
            disabled={!data.lead_id || isSavingLead}
            className="border-border text-foreground hover:bg-muted"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSavingLead ? 'Saving...' : 'Save Lead'}
          </Button>
          
          {/* Lead Selector */}
          <Select
            value={data.lead_id || ''}
            onValueChange={(value) => onChange({ lead_id: value })}
          >
            <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
              <SelectValue placeholder="Select Lead..." />
            </SelectTrigger>
            <SelectContent>
              {leads.length === 0 ? (
                <SelectItem value="none" disabled>No leads yet</SelectItem>
              ) : (
                leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.display_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {/* New Lead Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNewLead}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </SectionHeader>
      
      {/* Material & Quantity Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Package className="h-3.5 w-3.5" />
          Material & Quantity
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <InputGroup label="Material">
              <ProductAutocomplete
                value={data.material}
                productId={data.product_id}
                onSelect={handleProductSelect}
                placeholder="Search products or enter custom..."
              />
            </InputGroup>
          </div>
          
          <InputGroup label="Tons">
            <Input
              type="number"
              value={data.qty_tons}
              onChange={(e) => onChange({ qty_tons: e.target.value })}
              placeholder="0"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </InputGroup>
          
          <InputGroup label="Cu Yds">
            <Input
              type="number"
              value={data.qty_cy}
              onChange={(e) => onChange({ qty_cy: e.target.value })}
              placeholder="0"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </InputGroup>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Spec Requirement">
            <Input
              value={data.spec_requirement}
              onChange={(e) => onChange({ spec_requirement: e.target.value })}
              placeholder="e.g., #57 Stone, 3/4 Clear"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </InputGroup>
          
          <InputGroup label="Application">
            <Input
              value={data.application}
              onChange={(e) => onChange({ application: e.target.value })}
              placeholder="e.g., Driveway, Foundation"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </InputGroup>
        </div>
      </div>
      
      {/* Contact Information Section */}
      <div className="mb-4 pt-4 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" />
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Phone">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={data.contact_phone}
                onChange={(e) => onChange({ contact_phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </InputGroup>
          
          <InputGroup label="Email">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={data.contact_email}
                onChange={(e) => onChange({ contact_email: e.target.value })}
                placeholder="email@example.com"
                className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </InputGroup>
        </div>
      </div>
      
      {/* Delivery Location Section */}
      <div className="mb-4 pt-4 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          Delivery Location
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputGroup label="Street Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={data.delivery_address}
                  onChange={(e) => onChange({ delivery_address: e.target.value })}
                  placeholder="Street address"
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </InputGroup>
            
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={data.delivery_city}
                onChange={(e) => onChange({ delivery_city: e.target.value })}
                placeholder="City"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={data.delivery_state}
                onChange={(e) => onChange({ delivery_state: e.target.value })}
                placeholder="State"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={data.delivery_zip}
                onChange={(e) => onChange({ delivery_zip: e.target.value })}
                placeholder="ZIP"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <InputGroup label="Site Access">
            <PillSelect
              options={[...SITE_ACCESS_OPTIONS]}
              selected={data.site_access}
              onToggle={toggleSiteAccess}
            />
          </InputGroup>
        </div>
      </div>
      
      {/* Delivery Scheduling Section */}
      <div className="mb-4 pt-4 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Truck className="h-3.5 w-3.5" />
          Delivery Scheduling
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputGroup label="Preferred Date">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={data.delivery_date}
                onChange={(e) => onChange({ delivery_date: e.target.value })}
                className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </InputGroup>
          
          <InputGroup label="Preferred Time">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={data.delivery_time}
                onChange={(e) => onChange({ delivery_time: e.target.value })}
                className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </InputGroup>
          
          <InputGroup label="Delivery Instructions">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={data.delivery_instructions}
                onChange={(e) => onChange({ delivery_instructions: e.target.value })}
                placeholder="e.g., Gate code, placement..."
                className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </InputGroup>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="pt-4 border-t border-border">
        <InputGroup label="Project Notes">
          <Textarea
            value={data.project_notes}
            onChange={(e) => onChange({ project_notes: e.target.value })}
            placeholder="Additional project details..."
            className="bg-muted border-border min-h-[80px] text-foreground placeholder:text-muted-foreground"
          />
        </InputGroup>
      </div>
    </Card>
  );
}
