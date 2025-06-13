
import React, { useState, useEffect } from 'react';
import { CustomerReview, ReviewFilter } from '@/types/review.types';
import ReviewCard from './ReviewCard';
import { fetchReviews } from '@/services/reviewService';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card } from '@/components/ui/card';

interface ReviewListProps {
  filter?: ReviewFilter;
  initialReviews?: CustomerReview[];
  totalInitial?: number;
  className?: string;
  compact?: boolean;
  perPage?: number;
}

const ReviewList: React.FC<ReviewListProps> = ({
  filter = 'all',
  initialReviews,
  totalInitial,
  className,
  compact = false,
  perPage = 10
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug logging
  console.log('ReviewList render:', {
    filter,
    initialReviews: initialReviews?.length,
    reviews: reviews.length,
    totalInitial,
    totalReviews,
    isLoading
  });
  
  const totalPages = Math.ceil(totalReviews / perPage);
  
  const loadReviews = async (filterToUse: ReviewFilter, pageToUse: number) => {
    console.log('LoadReviews called:', { filterToUse, pageToUse });
    setIsLoading(true);
    const { reviews: loadedReviews, total } = await fetchReviews(filterToUse, pageToUse, perPage);
    console.log('LoadReviews result:', { loadedReviews: loadedReviews.length, total });
    setReviews(loadedReviews);
    setTotalReviews(total);
    setIsLoading(false);
  };
  
  // Initialize with initial reviews or load fresh data
  useEffect(() => {
    console.log('ReviewList initialization effect:', {
      filter,
      hasInitialReviews: !!initialReviews,
      initialReviewsLength: initialReviews?.length
    });
    
    // Reset page when filter changes
    setCurrentPage(1);
    
    if (initialReviews && totalInitial !== undefined) {
      // Use provided initial data
      console.log('Using initial reviews data');
      setReviews(initialReviews);
      setTotalReviews(totalInitial);
      setIsLoading(false);
    } else {
      // Load fresh data for this filter
      console.log('Loading fresh data for filter:', filter);
      loadReviews(filter, 1);
    }
  }, [filter, initialReviews, totalInitial]);
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadReviews(filter, page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  if (isLoading) {
    return (
      <div className={className}>
        {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
          <Card key={i} className="mb-4 overflow-hidden">
            <div className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <Card className={className}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No reviews found. Be the first to share your experience!</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={className}>
      <div className="space-y-4">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      
      {!compact && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                />
              </PaginationItem>
            )}
            
            {/* Show first page */}
            {currentPage > 2 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(1)}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Ellipsis if needed */}
            {currentPage > 3 && (
              <PaginationItem>
                <PaginationLink className="cursor-default">...</PaginationLink>
              </PaginationItem>
            )}
            
            {/* Current page and adjacent */}
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationLink isActive>
                {currentPage}
              </PaginationLink>
            </PaginationItem>
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {/* Ellipsis if needed */}
            {currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationLink className="cursor-default">...</PaginationLink>
              </PaginationItem>
            )}
            
            {/* Last page */}
            {currentPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ReviewList;
