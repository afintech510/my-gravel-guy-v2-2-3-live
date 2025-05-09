
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  size?: 'compact' | 'normal' | 'large';
  className?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  size = 'normal',
  className 
}) => {
  const sizes = {
    compact: {
      container: "flex items-center p-2 gap-2",
      icon: "h-4 w-4",
      title: "text-sm font-medium",
      description: "hidden",
      iconWrapper: "w-7 h-7"
    },
    normal: {
      container: "flex items-center p-3 gap-3",
      icon: "h-5 w-5",
      title: "text-base font-medium",
      description: "text-xs mt-1",
      iconWrapper: "w-9 h-9"
    },
    large: {
      container: "flex items-center p-4 gap-4",
      icon: "h-6 w-6",
      title: "text-lg font-semibold",
      description: "text-sm mt-1.5",
      iconWrapper: "w-12 h-12"
    }
  };

  const sizeConfig = sizes[size];

  return (
    <div className={cn("group", sizeConfig.container, className)}>
      <div className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20",
        sizeConfig.iconWrapper
      )}>
        <Icon className={cn("text-primary", sizeConfig.icon)} />
      </div>
      <div>
        <h4 className={sizeConfig.title}>{title}</h4>
        {description && size !== 'compact' && (
          <p className={cn("text-gray-600", sizeConfig.description)}>{description}</p>
        )}
      </div>
    </div>
  );
};

export default TrustBadge;
