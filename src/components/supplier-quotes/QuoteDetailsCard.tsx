import React from 'react';
import { DollarSign, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './shared/SectionHeader';
import { InputGroup } from './shared/InputGroup';
import { CheckboxBtn } from './shared/CheckboxBtn';
import { PillSelect } from './shared/PillSelect';
import { 
  SupplierQuoteFormData, 
  SupplierQuoteFlags, 
  TRUCK_SIZE_OPTIONS 
} from '@/types/supplierQuote.types';

interface QuoteDetailsCardProps {
  data: SupplierQuoteFormData;
  flags: SupplierQuoteFlags;
  onChange: (updates: Partial<SupplierQuoteFormData>) => void;
  onFlagChange: (key: keyof SupplierQuoteFlags) => void;
}

export function QuoteDetailsCard({ 
  data, 
  flags, 
  onChange, 
  onFlagChange 
}: QuoteDetailsCardProps) {
  const toggleTruck = (id: string) => {
    const current = data.available_trucks;
    if (current.includes(id)) {
      onChange({ available_trucks: current.filter(t => t !== id) });
    } else {
      onChange({ available_trucks: [...current, id] });
    }
  };

  return (
    <Card className="p-5 bg-card border-border">
      <SectionHeader icon={DollarSign} title="Quote Details" />
      
      {/* Toggle Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <CheckboxBtn
          label="Unit Price"
          checked={flags.material_is_unit}
          onChange={() => onFlagChange('material_is_unit')}
        />
        <CheckboxBtn
          label="Total Material"
          checked={flags.material_is_total}
          onChange={() => onFlagChange('material_is_total')}
        />
        <CheckboxBtn
          label="All-in Delivered"
          checked={flags.is_all_in}
          onChange={() => onFlagChange('is_all_in')}
        />
        <CheckboxBtn
          label="Delivery Flat"
          checked={flags.delivery_flat}
          onChange={() => onFlagChange('delivery_flat')}
        />
        <CheckboxBtn
          label="Delivery Hourly"
          checked={flags.delivery_hourly}
          onChange={() => onFlagChange('delivery_hourly')}
        />
        <CheckboxBtn
          label="Delivery Incl."
          checked={flags.delivery_included}
          onChange={() => onFlagChange('delivery_included')}
        />
      </div>
      
      {/* Pricing Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-2">
          <InputGroup label="Material Price">
            <Input
              type="number"
              value={data.material_price}
              onChange={(e) => onChange({ material_price: e.target.value })}
              placeholder="0.00"
              className="bg-muted border-border"
              disabled={flags.is_all_in}
            />
          </InputGroup>
          <InputGroup label="Unit">
            <Select
              value={data.material_unit}
              onValueChange={(value) => onChange({ material_unit: value })}
              disabled={flags.is_all_in}
            >
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ton">per ton</SelectItem>
                <SelectItem value="cy">per CY</SelectItem>
                <SelectItem value="load">per load</SelectItem>
              </SelectContent>
            </Select>
          </InputGroup>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <InputGroup label="Delivery Charge">
            <Input
              type="number"
              value={data.delivery_rate}
              onChange={(e) => onChange({ delivery_rate: e.target.value })}
              placeholder="0.00"
              className="bg-muted border-border"
              disabled={flags.delivery_included || flags.is_all_in}
            />
          </InputGroup>
          <InputGroup label="Basis">
            <Select
              value={data.delivery_basis}
              onValueChange={(value) => onChange({ delivery_basis: value })}
              disabled={flags.delivery_included || flags.is_all_in}
            >
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total</SelectItem>
                <SelectItem value="per_load">Per Load</SelectItem>
                <SelectItem value="per_hour">Per Hour</SelectItem>
              </SelectContent>
            </Select>
          </InputGroup>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="All-In Delivered Total">
          <Input
            type="number"
            value={data.all_in_delivered_total}
            onChange={(e) => onChange({ all_in_delivered_total: e.target.value })}
            placeholder="0.00"
            className="bg-muted border-border"
            disabled={!flags.is_all_in}
          />
        </InputGroup>
        
        <div className="grid grid-cols-2 gap-2">
          <InputGroup label="Max Qty/Load">
            <Input
              type="number"
              value={data.max_qty_per_load}
              onChange={(e) => onChange({ max_qty_per_load: e.target.value })}
              placeholder="0"
              className="bg-muted border-border"
            />
          </InputGroup>
          <InputGroup label="Unit">
            <Select
              value={data.max_qty_unit}
              onValueChange={(value) => onChange({ max_qty_unit: value })}
            >
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ton">tons</SelectItem>
                <SelectItem value="cy">CY</SelectItem>
              </SelectContent>
            </Select>
          </InputGroup>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="Typical Lead Time">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={data.lead_time}
              onChange={(e) => onChange({ lead_time: e.target.value })}
              placeholder="e.g., 2-3 days"
              className="pl-10 bg-muted border-border"
            />
          </div>
        </InputGroup>
        
        <InputGroup label="Lead Time Notes">
          <Input
            value={data.lead_time_notes}
            onChange={(e) => onChange({ lead_time_notes: e.target.value })}
            placeholder="Additional timing details..."
            className="bg-muted border-border"
          />
        </InputGroup>
      </div>
      
      <InputGroup label="Available Trucks">
        <PillSelect
          options={[...TRUCK_SIZE_OPTIONS]}
          selected={data.available_trucks}
          onToggle={toggleTruck}
        />
      </InputGroup>
      
      <InputGroup label="Truck Notes">
        <Textarea
          value={data.truck_notes}
          onChange={(e) => onChange({ truck_notes: e.target.value })}
          placeholder="Additional notes about delivery trucks..."
          className="bg-muted border-border min-h-[60px]"
        />
      </InputGroup>
    </Card>
  );
}
