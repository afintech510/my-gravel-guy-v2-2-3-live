
import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showRating = false,
  className,
  interactive = false,
  onRatingChange
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const handleClick = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };
  
  const renderStar = (position: number) => {
    const displayRating = hoverRating || rating;
    const isActive = position <= Math.floor(displayRating);
    const isHalf = !isActive && Math.ceil(displayRating) === position && displayRating % 1 !== 0;
    
    return (
      <div 
        key={position}
        className={cn(
          "cursor-default",
          interactive && "cursor-pointer",
        )}
        onClick={() => handleClick(position)}
        onMouseEnter={interactive ? () => setHoverRating(position) : undefined}
        onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
      >
        {isHalf ? (
          <StarHalf className={cn(
            starSizes[size],
            "text-yellow-400 fill-yellow-400"
          )} />
        ) : (
          <Star className={cn(
            starSizes[size],
            isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          )} />
        )}
      </div>
    );
  };
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i + 1))}
      </div>
      
      {showRating && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
