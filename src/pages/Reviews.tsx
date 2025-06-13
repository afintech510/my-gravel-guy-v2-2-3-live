
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarRating from '@/components/reviews/StarRating';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import { fetchReviews, insertSampleReviews } from '@/services/reviewService';
import { ReviewFilter, CustomerReview } from '@/types/review.types';
import { useToast } from '@/hooks/use-toast';

const Reviews = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [total, setTotal] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<ReviewFilter>('all');
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  
  // Debug logging
  console.log('Reviews page render:', {
    loading,
    reviews: reviews.length,
    total,
    currentFilter,
    averageRating
  });
  
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Loading initial data...');
      setLoading(true);
      const { reviews: initialReviews, total: totalReviews } = await fetchReviews('all', 1, 10);
      console.log('Initial data loaded:', { reviews: initialReviews.length, total: totalReviews });
      setReviews(initialReviews);
      setTotal(totalReviews);
      
      // Calculate average rating and rating distribution
      if (initialReviews.length > 0) {
        const sum = initialReviews.reduce((acc, review) => acc + review.rating, 0);
        setAverageRating(sum / initialReviews.length);
        
        // Get distribution of ratings
        const counts = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
        initialReviews.forEach(review => {
          const rating = review.rating.toString();
          counts[rating] = (counts[rating] || 0) + 1;
        });
        setRatingCounts(counts);
      }
      
      setLoading(false);
    };
    
    loadInitialData();
  }, []);
  
  const handleFilterChange = (filter: ReviewFilter) => {
    console.log('Filter change requested:', filter);
    setCurrentFilter(filter);
  };
  
  const handleReviewSubmitted = () => {
    // Refresh the reviews list
    const loadReviews = async () => {
      const { reviews: refreshedReviews, total: totalReviews } = await fetchReviews(currentFilter, 1, 10);
      setReviews(refreshedReviews);
      setTotal(totalReviews);
    };
    
    loadReviews();
  };
  
  const handleImportSampleReviews = async () => {
    setImporting(true);
    try {
      const success = await insertSampleReviews();
      if (success) {
        toast({
          title: "Success",
          description: "Sample reviews imported successfully!",
        });
        // Refresh the reviews list
        const { reviews: refreshedReviews, total: totalReviews } = await fetchReviews('all', 1, 10);
        setReviews(refreshedReviews);
        setTotal(totalReviews);
        
        // Recalculate stats
        if (refreshedReviews.length > 0) {
          const sum = refreshedReviews.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(sum / refreshedReviews.length);
          
          const counts = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
          refreshedReviews.forEach(review => {
            const rating = review.rating.toString();
            counts[rating] = (counts[rating] || 0) + 1;
          });
          setRatingCounts(counts);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to import sample reviews. Please try again.",
        });
      }
    } catch (error) {
      console.error('Error importing reviews:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while importing reviews.",
      });
    } finally {
      setImporting(false);
    }
  };
  
  // Calculate percentage for each rating
  const calculatePercentage = (rating: string) => {
    if (total === 0) return 0;
    const count = ratingCounts[rating] || 0;
    return Math.round((count / total) * 100);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Helmet>
        <title>Customer Reviews | Gravel Guy</title>
        <meta name="description" content="Read reviews from customers who have purchased from Gravel Guy. Find out what people are saying about our products and service." />
      </Helmet>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Customer Reviews</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what our customers have to say about their experience with our products and services.
          </p>
          
          {/* Temporary Admin Button */}
          <div className="mt-4">
            <Button 
              onClick={handleImportSampleReviews}
              disabled={importing}
              variant="outline"
              size="sm"
            >
              {importing ? 'Importing...' : 'Import Sample Reviews (Admin)'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Review Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Review Summary</h2>
                
                <div className="flex items-center gap-2 mb-6">
                  <StarRating rating={averageRating} size="lg" />
                  <span className="text-2xl font-bold">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    out of 5
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Based on {total} reviews
                </p>
                
                {/* Rating distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="w-12 text-sm font-medium">
                        {rating} stars
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${calculatePercentage(rating.toString())}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm text-gray-600">
                        {calculatePercentage(rating.toString())}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Comment out the submit review form
            <div className="mt-6">
              <ReviewForm onSubmitSuccess={handleReviewSubmitted} />
            </div>
              */}
          </div>
          
          {/* Reviews List */}
          <div className="md:col-span-2">
            <Tabs defaultValue="all" onValueChange={(value) => handleFilterChange(value as ReviewFilter)}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Reviews</TabsTrigger>
                <TabsTrigger value="verified">Verified Purchases</TabsTrigger>
                <TabsTrigger value="5star">5 Star</TabsTrigger>
                <TabsTrigger value="4star">4 Star</TabsTrigger>
                <TabsTrigger value="3star">3 Star</TabsTrigger>
                <TabsTrigger value="2star">2 Star</TabsTrigger>
                <TabsTrigger value="1star">1 Star</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <ReviewList 
                  filter="all"
                  initialReviews={currentFilter === 'all' ? reviews : undefined}
                  totalInitial={currentFilter === 'all' ? total : undefined}
                />
              </TabsContent>
              <TabsContent value="verified">
                <ReviewList filter="verified" />
              </TabsContent>
              <TabsContent value="5star">
                <ReviewList filter="5star" />
              </TabsContent>
              <TabsContent value="4star">
                <ReviewList filter="4star" />
              </TabsContent>
              <TabsContent value="3star">
                <ReviewList filter="3star" />
              </TabsContent>
              <TabsContent value="2star">
                <ReviewList filter="2star" />
              </TabsContent>
              <TabsContent value="1star">
                <ReviewList filter="1star" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
