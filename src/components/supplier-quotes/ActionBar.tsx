import React from 'react';
import { Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionBarProps {
  onSave: () => void;
  onSaveAndNew: () => void;
  isLoading?: boolean;
  priceSummary: string;
}

export function ActionBar({ onSave, onSaveAndNew, isLoading, priceSummary }: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-sm">Summary:</span>
        <span className="font-medium text-foreground">{priceSummary}</span>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={onSave}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          <Lock className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Quote'}
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
