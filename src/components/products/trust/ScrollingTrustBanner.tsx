import React from 'react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import TrustBadge from './TrustBadge';
import { trustItems, TrustBadgeItem } from './TrustData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ScrollingTrustBannerProps {
  items?: TrustBadgeItem[];
  badgeSize?: 'compact' | 'normal' | 'large';
  showControls?: boolean;
  autoScroll?: boolean;
  title?: string;
  className?: string;
}

const ScrollingTrustBanner: React.FC<ScrollingTrustBannerProps> = ({ 
  items = trustItems,
  badgeSize = 'compact',
  showControls = true,
  autoScroll = true,
  title,
  className
}) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scrolling functionality
  React.useEffect(() => {
    if (!autoScroll) return;
    
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const carousel = carouselRef.current;
        // Only auto-scroll on smaller screens
        if (window.innerWidth < 768) {
          const scrollPosition = carousel.scrollLeft;
          const itemWidth = carousel.offsetWidth;
          const maxScroll = carousel.scrollWidth - itemWidth;
          
          // If at end, go back to start
          if (scrollPosition >= maxScroll - 10) {
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Otherwise scroll to next item
            carousel.scrollTo({ 
              left: scrollPosition + itemWidth / 2, 
              behavior: 'smooth' 
            });
          }
        }
      }
    }, 3000); // Scroll every 3 seconds
    
    return () => clearInterval(interval);
  }, [autoScroll]);

  return (
    <div className={cn("w-full py-4", className)}>
      {title && (
        <div className="flex justify-center mb-4">
          <Badge variant="outline" className="px-3 py-1">
            {title}
          </Badge>
        </div>
      )}
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent ref={carouselRef} className="px-2">
          {items.map((item, index) => (
            <CarouselItem 
              key={index} 
              className="md:basis-1/2 lg:basis-1/3 pl-2 pr-2"
            >
              <TrustBadge
                icon={item.icon}
                title={item.title}
                description={item.description}
                size={badgeSize}
                className="h-full bg-white border rounded-lg shadow-sm"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {showControls && (
          <>
            <CarouselPrevious className="left-1 sm:left-2" />
            <CarouselNext className="right-1 sm:right-2" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default ScrollingTrustBanner;
