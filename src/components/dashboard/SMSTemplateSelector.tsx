
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SMSTemplate } from '@/hooks/useOrderSMS';

interface SMSTemplateSelectorProps {
  templates: SMSTemplate[];
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  disabled?: boolean;
}

const SMSTemplateSelector: React.FC<SMSTemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <Label>Message Template</Label>
      <Select 
        value={selectedTemplate} 
        onValueChange={onTemplateChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SMSTemplateSelector;
