import React from 'react';
import { Package, MapPin, Plus } from 'lucide-react';
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
}

export function ProjectRequirementsCard({ 
  data, 
  onChange, 
  leads, 
  onNewLead 
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
          <Select
            value={data.lead_id || ''}
            onValueChange={(value) => onChange({ lead_id: value })}
          >
            <SelectTrigger className="w-[180px] bg-muted border-border">
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputGroup label="Material">
          <ProductAutocomplete
            value={data.material}
            productId={data.product_id}
            onSelect={handleProductSelect}
            placeholder="Search products or enter custom..."
          />
        </InputGroup>
        
        <InputGroup label="Tons">
          <Input
            type="number"
            value={data.qty_tons}
            onChange={(e) => onChange({ qty_tons: e.target.value })}
            placeholder="0"
            className="bg-muted border-border"
          />
        </InputGroup>
        
        <InputGroup label="Cu Yds">
          <Input
            type="number"
            value={data.qty_cy}
            onChange={(e) => onChange({ qty_cy: e.target.value })}
            placeholder="0"
            className="bg-muted border-border"
          />
        </InputGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="Spec Requirement">
          <Input
            value={data.spec_requirement}
            onChange={(e) => onChange({ spec_requirement: e.target.value })}
            placeholder="e.g., #57 Stone, 3/4 Clear"
            className="bg-muted border-border"
          />
        </InputGroup>
        
        <InputGroup label="Application">
          <Input
            value={data.application}
            onChange={(e) => onChange({ application: e.target.value })}
            placeholder="e.g., Driveway, Foundation"
            className="bg-muted border-border"
          />
        </InputGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <InputGroup label="Delivery Address">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={data.delivery_address}
                onChange={(e) => onChange({ delivery_address: e.target.value })}
                placeholder="Street address"
                className="pl-10 bg-muted border-border"
              />
            </div>
          </InputGroup>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Input
              value={data.delivery_city}
              onChange={(e) => onChange({ delivery_city: e.target.value })}
              placeholder="City"
              className="bg-muted border-border"
            />
            <Input
              value={data.delivery_state}
              onChange={(e) => onChange({ delivery_state: e.target.value })}
              placeholder="State"
              className="bg-muted border-border"
            />
            <Input
              value={data.delivery_zip}
              onChange={(e) => onChange({ delivery_zip: e.target.value })}
              placeholder="ZIP"
              className="bg-muted border-border"
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
      
      <InputGroup label="Project Notes">
        <Textarea
          value={data.project_notes}
          onChange={(e) => onChange({ project_notes: e.target.value })}
          placeholder="Additional project details..."
          className="bg-muted border-border min-h-[80px]"
        />
      </InputGroup>
    </Card>
  );
}
