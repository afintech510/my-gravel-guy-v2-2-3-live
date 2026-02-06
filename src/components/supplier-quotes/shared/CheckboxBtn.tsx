import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface CheckboxBtnProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function CheckboxBtn({ label, checked, onChange, disabled }: CheckboxBtnProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all w-full text-left
        ${checked 
          ? 'bg-primary/20 text-foreground border border-primary/50' 
          : 'bg-muted text-foreground border border-border hover:border-primary/30'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {checked ? <CheckSquare className="w-4 h-4 shrink-0 text-primary" /> : <Square className="w-4 h-4 shrink-0" />}
      {label}
    </button>
  );
}
