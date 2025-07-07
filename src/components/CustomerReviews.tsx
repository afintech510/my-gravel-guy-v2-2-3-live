import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { fetchReviews } from '@/services/reviewService';
import { CustomerReview } from '@/types/review.types';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerReviews = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        // First try to get 5-star reviews, limited to 3
        const { reviews: fiveStarReviews } = await fetchReviews('5star', 1, 3);
        
        if (fiveStarReviews.length >= 3) {
          setReviews(fiveStarReviews.slice(0, 3));
        } else {
          // If not enough 5-star reviews, get the most recent highly-rated reviews
          const { reviews: allReviews } = await fetchReviews('all', 1, 10);
          // Filter for 4+ star reviews and take the top 3
          const highRatedReviews = allReviews
            .filter(review => review.rating >= 4)
            .slice(0, 3);
          setReviews(highRatedReviews);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-5 h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 text-lg">
              Don't just take our word for it. Here's what our satisfied customers have to say.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="w-5 h-5" />
                  ))}
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-lg">
            Don't just take our word for it. Here's what our satisfied customers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.length > 0 ? reviews.map((review, index) => (
            <div key={review.id || index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <StarRating rating={review.rating} />
              <blockquote className="text-gray-700 mb-6 italic">
                "{review.content}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {getInitials(review.user_name)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {review.user_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.product_name || 'Verified Customer'}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No reviews available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;