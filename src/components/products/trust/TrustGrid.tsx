
import React from 'react';
import TrustBadge from './TrustBadge';
import { trustItems, TrustBadgeItem } from './TrustData';
import { cn } from '@/lib/utils';

interface TrustGridProps {
  items?: TrustBadgeItem[];
  badgeSize?: 'compact' | 'normal' | 'large';
  columns?: 1 | 2 | 3 | 4 | 6;
  title?: string;
  className?: string;
}

const TrustGrid: React.FC<TrustGridProps> = ({ 
  items = trustItems,
  badgeSize = 'normal',
  columns = 3,
  title,
  className
}) => {
  // Determine grid columns based on prop
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }[columns];

  return (
    <div className={cn("w-full rounded-lg border bg-muted p-6", className)}>
      {title && (
        <h2 className="text-2xl font-semibold text-center mb-8">{title}</h2>
      )}
      <div className={cn("grid gap-4", gridColsClass)}>
        {items.map((item, index) => (
          <TrustBadge
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            size={badgeSize}
            className="bg-card rounded-lg shadow-sm border"
          />
        ))}
      </div>
    </div>
  );
};

export default TrustGrid;
