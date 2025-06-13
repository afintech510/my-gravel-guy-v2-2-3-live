
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
  const [reviews, setReviews] = useState<CustomerReview[]>(initialReviews || []);
  const [currentFilter, setCurrentFilter] = useState<ReviewFilter>(filter);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(totalInitial || 0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug logging
  console.log('ReviewList render:', {
    filter,
    currentFilter,
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
  
  // Handle filter changes from props
  useEffect(() => {
    console.log('Filter effect triggered:', { filter, currentFilter });
    if (filter !== currentFilter) {
      setCurrentFilter(filter);
      setCurrentPage(1);
      
      // If we have initial reviews for this filter, use them
      if (filter === 'all' && initialReviews && initialReviews.length > 0) {
        console.log('Using initial reviews for all filter');
        setReviews(initialReviews);
        setTotalReviews(totalInitial || 0);
      } else {
        // Load reviews for the new filter
        console.log('Loading reviews for filter:', filter);
        loadReviews(filter, 1);
      }
    }
  }, [filter, initialReviews, totalInitial]);
  
  // Handle page changes
  useEffect(() => {
    console.log('Page effect triggered:', { currentFilter, currentPage });
    // Only load if we're not on page 1 or if we don't have initial data
    if (currentPage > 1 || (currentFilter !== 'all' || !initialReviews)) {
      if (currentPage > 1 || currentFilter !== filter) {
        console.log('Loading reviews for page change');
        loadReviews(currentFilter, currentPage);
      }
    }
  }, [currentPage]);
  
  // Initialize with initial reviews if available
  useEffect(() => {
    console.log('Initial setup effect:', { initialReviews: initialReviews?.length, filter });
    if (initialReviews && initialReviews.length > 0 && filter === 'all') {
      console.log('Setting up initial reviews');
      setReviews(initialReviews);
      setTotalReviews(totalInitial || 0);
      setIsLoading(false);
    } else if (!initialReviews && filter === currentFilter) {
      console.log('No initial reviews, loading for current filter');
      loadReviews(currentFilter, currentPage);
    }
  }, []); // Only run on mount
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
