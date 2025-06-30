
import React, { useEffect, useState } from 'react';
import { CustomerReview } from '@/types/review.types';
import { fetchProductReviews, fetchReviews } from '@/services/reviewService';
import ReviewList from '../reviews/ReviewList';
import StarRating from '../reviews/StarRating';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadReviews = async () => {
      if (productId === 'all-products') {
        // Fetch all reviews instead of product-specific ones
        const { reviews: allReviews } = await fetchReviews('all', 1, 6);
        setReviews(allReviews);
      } else {
        // Fetch product-specific reviews
        const productReviews = await fetchProductReviews(productId);
        setReviews(productReviews);
      }
      setLoading(false);
    };
    
    loadReviews();
  }, [productId]);
  
  const averageRating = reviews.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">
            Customer Reviews 
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-sm text-gray-600">
                ({reviews.length})
              </span>
            </div>
          )}
        </div>
        
        <Button asChild variant="outline">
          <Link to="/reviews">
            View All Reviews
          </Link>
        </Button>
      </div>
      
      <ReviewList 
        initialReviews={reviews} 
        totalInitial={reviews.length} 
        perPage={6}
        compact
      />
      
      {reviews.length > 0 && (
        <div className="text-center pt-4">
          <Button asChild variant="outline">
            <Link to="/reviews">
              View More Reviews
            </Link>
          </Button>
        </div>
      )}
      
      {reviews.length === 0 && !loading && (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-600 mb-4">
            There are no reviews yet.
          </p>
          <Button asChild>
            <Link to="/reviews">
              View All Reviews
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
