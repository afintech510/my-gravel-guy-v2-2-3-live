import React from 'react';

interface InputGroupProps {
  label: string;
  helper?: string;
  children: React.ReactNode;
}

export function InputGroup({ label, helper, children }: InputGroupProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
      {children}
      {helper && <p className="text-xs text-muted-foreground/70 mt-1">{helper}</p>}
    </div>
  );
}
