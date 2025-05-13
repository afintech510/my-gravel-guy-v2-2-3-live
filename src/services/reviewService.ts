
import { supabase } from "@/integrations/supabase/client";
import { CustomerReview, ReviewFilter } from "@/types/review.types";

export const fetchReviews = async (
  filter: ReviewFilter = 'all',
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: CustomerReview[], total: number }> => {
  let query = supabase
    .from('customer_reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  // Apply filters
  if (filter === 'verified') {
    query = query.eq('verified_purchase', true);
  } else if (filter.includes('star')) {
    const rating = parseInt(filter.charAt(0));
    query = query.eq('rating', rating);
  }
  
  // Apply pagination
  query = query.range((page - 1) * limit, page * limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error("Error fetching reviews:", error);
    return { reviews: [], total: 0 };
  }
  
  return { 
    reviews: data as CustomerReview[], 
    total: count || 0 
  };
};

export const fetchProductReviews = async (
  productId: string,
  limit: number = 3
): Promise<CustomerReview[]> => {
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching product reviews:", error);
    return [];
  }
  
  return data as CustomerReview[];
};

export const submitReview = async (review: Omit<CustomerReview, 'id' | 'created_at' | 'helpful_votes'>): Promise<CustomerReview | null> => {
  const { data, error } = await supabase
    .from('customer_reviews')
    .insert([
      { 
        ...review,
        helpful_votes: 0
      }
    ])
    .select()
    .single();
  
  if (error) {
    console.error("Error submitting review:", error);
    return null;
  }
  
  return data as CustomerReview;
};

export const voteReviewHelpful = async (reviewId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('helpful_votes')
    .eq('id', reviewId)
    .single();
  
  if (error || !data) {
    console.error("Error fetching review:", error);
    return false;
  }
  
  const currentVotes = data.helpful_votes || 0;
  
  const { error: updateError } = await supabase
    .from('customer_reviews')
    .update({ helpful_votes: currentVotes + 1 })
    .eq('id', reviewId);
  
  if (updateError) {
    console.error("Error updating helpful votes:", updateError);
    return false;
  }
  
  return true;
};
