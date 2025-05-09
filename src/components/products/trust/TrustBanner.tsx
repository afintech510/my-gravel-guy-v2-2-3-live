
import React from 'react';
import { useMediaQuery } from "@/hooks/use-mobile";
import ScrollingTrustBanner from './ScrollingTrustBanner';
import TrustGrid from './TrustGrid';
import { trustItems, TrustBadgeItem } from './TrustData';
import { cn } from '@/lib/utils';

interface TrustBannerProps {
  items?: TrustBadgeItem[];
  title?: string;
  forceScrolling?: boolean;
  forceGrid?: boolean;
  badgeSize?: 'compact' | 'normal' | 'large';
  columns?: 1 | 2 | 3 | 4 | 6;
  className?: string;
}

const TrustBanner: React.FC<TrustBannerProps> = ({
  items = trustItems,
  title = "Why Choose My Gravel Guy",
  forceScrolling = false,
  forceGrid = false,
  badgeSize = 'normal',
  columns = 3,
  className
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Determine which component to show
  const showScrolling = forceScrolling || (!forceGrid && isMobile);
  
  return (
    <div className={cn("my-8", className)}>
      {showScrolling ? (
        <ScrollingTrustBanner 
          items={items}
          badgeSize={badgeSize === 'large' ? 'normal' : badgeSize}
          title={title}
        />
      ) : (
        <TrustGrid
          items={items}
          badgeSize={badgeSize}
          columns={columns}
          title={title}
        />
      )}
    </div>
  );
};

export default TrustBanner;
