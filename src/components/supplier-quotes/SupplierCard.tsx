import React from 'react';
import { Truck, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './shared/SectionHeader';
import { InputGroup } from './shared/InputGroup';
import { SupplierQuoteFormData } from '@/types/supplierQuote.types';

interface SupplierCardProps {
  data: SupplierQuoteFormData;
  onChange: (updates: Partial<SupplierQuoteFormData>) => void;
}

export function SupplierCard({ data, onChange }: SupplierCardProps) {
  return (
    <Card className="p-5 bg-card border-border">
      <SectionHeader icon={Truck} title="Supplier" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="Supplier Name">
          <Input
            value={data.supplier_name}
            onChange={(e) => onChange({ supplier_name: e.target.value })}
            placeholder="Company name"
            className="bg-muted border-border"
          />
        </InputGroup>
        
        <InputGroup label="Phone">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={data.supplier_phone}
              onChange={(e) => onChange({ supplier_phone: e.target.value })}
              placeholder="(555) 555-5555"
              className="pl-10 bg-muted border-border"
            />
          </div>
        </InputGroup>
      </div>
      
      <InputGroup label="Address">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={data.supplier_address}
            onChange={(e) => onChange({ supplier_address: e.target.value })}
            placeholder="Search address..."
            className="pl-10 bg-muted border-border"
          />
        </div>
      </InputGroup>
      
      <InputGroup label="Supplier Notes">
        <Textarea
          value={data.supplier_notes}
          onChange={(e) => onChange({ supplier_notes: e.target.value })}
          placeholder="Additional notes about this supplier..."
          className="bg-muted border-border min-h-[80px]"
        />
      </InputGroup>
    </Card>
  );
}
