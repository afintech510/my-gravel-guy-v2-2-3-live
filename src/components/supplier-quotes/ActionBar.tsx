import React from 'react';
import { Lock, Plus, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  SupplierQuoteFormData, 
  SupplierQuoteFlags, 
  calculateQuoteTotals 
} from '@/types/supplierQuote.types';

interface ActionBarProps {
  onSave: () => void;
  onSaveAndNew: () => void;
  onCancelEdit?: () => void;
  isLoading?: boolean;
  priceSummary: string;
  formData?: SupplierQuoteFormData;
  flags?: SupplierQuoteFlags;
  isEditing?: boolean;
}

export function ActionBar({ 
  onSave, 
  onSaveAndNew, 
  onCancelEdit,
  isLoading, 
  priceSummary, 
  formData, 
  flags,
  isEditing 
}: ActionBarProps) {
  // Calculate totals if form data is provided
  let summaryDisplay = priceSummary;
  
  if (formData && flags) {
    const totals = calculateQuoteTotals(formData, flags);
    const unitLabel = formData.material_unit === 'cy' ? '/cy' : '/ton';
    const unitsLabel = formData.material_unit === 'cy' ? 'cy' : 'tons';
    
    if (totals.totalTons > 0 && totals.totalCost > 0) {
      summaryDisplay = `$${totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total • $${totals.pricePerTon.toFixed(2)}${unitLabel} • ${totals.totalTons} ${unitsLabel}`;
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-4">
        {isEditing && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-600 font-medium">Editing Quote</span>
            {onCancelEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancelEdit}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">Summary:</span>
          <span className="font-medium text-foreground">{summaryDisplay}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={onSave}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          {isEditing ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              {isLoading ? 'Updating...' : 'Update Quote'}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Quote'}
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={onSaveAndNew}
          disabled={isLoading}
          className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Save & New
        </Button>
      </div>
    </div>
  );
}
