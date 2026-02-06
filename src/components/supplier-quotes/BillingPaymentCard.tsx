import React from 'react';
import { CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './shared/SectionHeader';
import { InputGroup } from './shared/InputGroup';
import { CheckboxBtn } from './shared/CheckboxBtn';
import { StringPillSelect } from './shared/PillSelect';
import { SupplierQuoteFormData, PAYMENT_METHOD_OPTIONS } from '@/types/supplierQuote.types';

interface BillingPaymentCardProps {
  data: SupplierQuoteFormData;
  onChange: (updates: Partial<SupplierQuoteFormData>) => void;
}

export function BillingPaymentCard({ data, onChange }: BillingPaymentCardProps) {
  const togglePaymentMethod = (method: string) => {
    const current = data.payment_methods;
    if (current.includes(method)) {
      onChange({ payment_methods: current.filter(m => m !== method) });
    } else {
      onChange({ payment_methods: [...current, method] });
    }
  };

  return (
    <Card className="p-5 bg-card border-border">
      <SectionHeader icon={CreditCard} title="Billing & Payment" />
      
      <InputGroup label="Accepted Payment Methods">
        <StringPillSelect
          options={[...PAYMENT_METHOD_OPTIONS]}
          selected={data.payment_methods}
          onToggle={togglePaymentMethod}
          variant="success"
        />
      </InputGroup>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="CC Fee (%)">
          <Input
            type="number"
            value={data.cc_fee_percent}
            onChange={(e) => onChange({ cc_fee_percent: e.target.value })}
            placeholder="0"
            step="0.5"
            min="0"
            max="5"
            className="bg-muted border-border"
          />
        </InputGroup>
        
        <InputGroup label="Billing Option">
          <CheckboxBtn
            label="Bill according to Load Tickets"
            checked={data.bill_by_load_tickets}
            onChange={() => onChange({ bill_by_load_tickets: !data.bill_by_load_tickets })}
          />
        </InputGroup>
      </div>
      
      <InputGroup label="Payment Notes">
        <Textarea
          value={data.payment_notes}
          onChange={(e) => onChange({ payment_notes: e.target.value })}
          placeholder="Additional payment terms or notes..."
          className="bg-muted border-border min-h-[80px]"
        />
      </InputGroup>
    </Card>
  );
}
