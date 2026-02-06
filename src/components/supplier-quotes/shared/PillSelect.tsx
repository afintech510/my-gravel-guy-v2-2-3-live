import React from 'react';

interface PillOption {
  id: string;
  label: string;
}

interface PillSelectProps {
  options: readonly PillOption[] | PillOption[];
  selected: string[];
  onToggle: (id: string) => void;
  variant?: 'primary' | 'success';
}

export function PillSelect({ options, selected, onToggle, variant = 'primary' }: PillSelectProps) {
  const getVariantClasses = (isSelected: boolean) => {
    if (variant === 'success') {
      return isSelected
        ? 'bg-green-900/40 border-green-600 text-foreground font-medium'
        : 'bg-muted border-border text-foreground hover:border-green-600/50';
    }
    return isSelected
      ? 'bg-primary border-primary text-primary-foreground'
      : 'bg-muted border-border text-foreground hover:border-primary/50';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onToggle(opt.id)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${getVariantClasses(
            selected.includes(opt.id)
          )}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Simple string-based variant for payment methods
interface StringPillSelectProps {
  options: readonly string[] | string[];
  selected: string[];
  onToggle: (value: string) => void;
  variant?: 'primary' | 'success';
}

export function StringPillSelect({ options, selected, onToggle, variant = 'success' }: StringPillSelectProps) {
  const getVariantClasses = (isSelected: boolean) => {
    if (variant === 'success') {
      return isSelected
        ? 'bg-green-900/40 border-green-600 text-foreground font-medium'
        : 'bg-muted border-border text-foreground hover:border-green-600/50';
    }
    return isSelected
      ? 'bg-primary border-primary text-primary-foreground'
      : 'bg-muted border-border text-foreground hover:border-primary/50';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${getVariantClasses(
            selected.includes(opt)
          )}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
