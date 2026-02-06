import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}

export function SectionHeader({ icon: IconComponent, title, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-border pb-2 gap-2">
      <div className="flex items-center gap-2">
        <IconComponent className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground whitespace-nowrap">{title}</h3>
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
