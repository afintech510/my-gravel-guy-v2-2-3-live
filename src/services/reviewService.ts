
import { CustomerReview, ReviewFilter } from "@/types/review.types";
import { supabase } from "@/integrations/supabase/client";

/* 
// Commented out fallback sample data
const sampleReviews: CustomerReview[] = [
  {
    id: "1",
    user_name: "John Smith",
    rating: 5,
    title: "Excellent product!",
    content: "The gravel was perfect for my driveway project. Delivery was on time and professional.",
    verified_purchase: true,
    helpful_votes: 7,
    created_at: "2025-04-10T12:30:00Z",
    product_name: "Gray Gravel - 3/4 inch",
    product_id: "gravel-gray-34"
  },
  {
    id: "2",
    user_name: "Emily Johnson",
    rating: 4,
    title: "Good quality, but delivery took longer than expected",
    content: "The product itself is great, but I had to wait an extra day for delivery. Otherwise, I'm very satisfied.",
    verified_purchase: true,
    helpful_votes: 3,
    created_at: "2025-04-02T15:45:00Z",
    product_name: "River Rock - 1-2 inch",
    product_id: "river-rock-1-2"
  },
  {
    id: "3",
    user_name: "Michael Williams",
    rating: 5,
    title: "Perfect for my garden path",
    content: "These stones were exactly what I needed for my garden renovation. The colors are beautiful.",
    verified_purchase: true,
    helpful_votes: 12,
    created_at: "2025-03-28T09:20:00Z",
    product_name: "Decorative Pebbles - Multi",
    product_id: "pebbles-multi"
  },
  {
    id: "4",
    user_name: "Sarah Miller",
    rating: 3,
    title: "Average product",
    content: "It's okay, but I expected better quality for the price. Some pieces were smaller than advertised.",
    verified_purchase: false,
    helpful_votes: 1,
    created_at: "2025-03-25T18:10:00Z",
    product_name: "Gray Gravel - 3/4 inch",
    product_id: "gravel-gray-34"
  },
  {
    id: "5",
    user_name: "Robert Brown",
    rating: 2,
    title: "Disappointed with quality",
    content: "Too much dust and debris mixed in with the gravel. Had to rinse everything before using.",
    verified_purchase: true,
    helpful_votes: 4,
    created_at: "2025-03-20T11:15:00Z",
    product_name: "Construction Gravel - 1 inch",
    product_id: "gravel-construction-1"
  },
  {
    id: "6",
    user_name: "Jennifer Davis",
    rating: 5,
    title: "Excellent customer service",
    content: "Not only was the product great, but the team was extremely helpful with my questions.",
    verified_purchase: true,
    helpful_votes: 8,
    created_at: "2025-03-15T14:30:00Z",
    product_name: "White Marble Chips",
    product_id: "marble-white",
    admin_response: "Thank you for the kind words, Jennifer! We're always happy to help.",
    admin_response_date: "2025-03-16T09:45:00Z"
  }
];
*/

// Get reviews with filtering, pagination and sorting - using Supabase data
export const fetchReviews = async (
  filter: ReviewFilter = 'all',
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: CustomerReview[], total: number }> => {
  try {
    // Calculate pagination offset once to be reused
    const paginationOffset = (page - 1) * limit;
    
    /* 
    // Commented out sample data implementation
    let filteredReviews = [...sampleReviews];
    
    // Apply filters
    if (filter === 'verified') {
      filteredReviews = filteredReviews.filter(review => review.verified_purchase);
    } else if (filter.includes('star')) {
      const rating = parseInt(filter.charAt(0));
      filteredReviews = filteredReviews.filter(review => review.rating === rating);
    }
    
    // Sort by date descending
    filteredReviews.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Apply pagination
    const end = paginationOffset + limit;
    const paginatedReviews = filteredReviews.slice(paginationOffset, end);
    
    return { 
      reviews: paginatedReviews, 
      total: filteredReviews.length 
    };
    */
    
    // Using Supabase to fetch reviews
    let query = supabase
      .from('customer_reviews')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filter === 'verified') {
      query = query.eq('verified_purchase', true);
    } else if (filter.includes('star')) {
      const rating = parseInt(filter.charAt(0));
      query = query.eq('rating', rating);
    }
    
    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(paginationOffset, paginationOffset + limit - 1);
    
    const { data, count, error } = await query;
    
    if (error) {
      console.error("Error fetching reviews:", error);
      return { reviews: [], total: 0 };
    }
    
    return { 
      reviews: data as CustomerReview[], 
      total: count || 0 
    };
    
  } catch (err) {
    console.error("Unexpected error fetching reviews:", err);
    return { reviews: [], total: 0 };
  }
};

// Get reviews for a specific product
export const fetchProductReviews = async (
  productId: string,
  limit: number = 3
): Promise<CustomerReview[]> => {
  try {
    /* 
    // Commented out sample data implementation
    let productReviews = sampleReviews.filter(review => review.product_id === productId);
    
    // Sort by date descending
    productReviews.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Apply limit
    return productReviews.slice(0, limit);
    */
    
    // Using Supabase to fetch product reviews
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
    
  } catch (err) {
    console.error("Unexpected error fetching product reviews:", err);
    return [];
  }
};

// Submit a new review
export const submitReview = async (review: Omit<CustomerReview, 'id' | 'created_at' | 'helpful_votes'>): Promise<CustomerReview | null> => {
  try {
    /* 
    // Commented out mock review implementation
    // Generate a mock response for the submitted review
    const newReview: CustomerReview = {
      id: `mock-${Math.random().toString(36).substring(2, 9)}`,
      user_name: review.user_name,
      rating: review.rating,
      title: review.title,
      content: review.content,
      verified_purchase: review.verified_purchase || false,
      helpful_votes: 0,
      created_at: new Date().toISOString(),
      product_id: review.product_id,
      product_name: review.product_name,
    };
    
    console.log("Review submitted (mock):", newReview);
    
    // In a real implementation, this would be added to the database
    // For now we'll just return the mock review
    return newReview;
    */
    
    // Using Supabase to submit a new review
    // Insert the new review
    const { data, error } = await supabase
      .from('customer_reviews')
      .insert({
        product_id: review.product_id,
        product_name: review.product_name,
        user_name: review.user_name,
        title: review.title,
        content: review.content,
        rating: review.rating,
        verified_purchase: review.verified_purchase || false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error submitting review:", error);
      return null;
    }
    
    return data as CustomerReview;
    
  } catch (err) {
    console.error("Unexpected error submitting review:", err);
    return null;
  }
};

// Vote a review as helpful
export const voteReviewHelpful = async (reviewId: string): Promise<boolean> => {
  try {
    /* 
    // Commented out mock implementation
    console.log(`Voted review ${reviewId} as helpful (mock)`);
    
    // In a real implementation, this would update the database
    // For now we'll just return success
    return true;
    */
    
    // Using Supabase to update helpful votes
    // First get current helpful_votes count
    const { data: review, error: fetchError } = await supabase
      .from('customer_reviews')
      .select('helpful_votes')
      .eq('id', reviewId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching review for voting:", fetchError);
      return false;
    }
    
    // Increment helpful_votes
    const { error: updateError } = await supabase
      .from('customer_reviews')
      .update({ helpful_votes: (review.helpful_votes || 0) + 1 })
      .eq('id', reviewId);
    
    if (updateError) {
      console.error("Error updating helpful votes:", updateError);
      return false;
    }
    
    return true;
    
  } catch (err) {
    console.error("Unexpected error voting on review:", err);
    return false;
  }
};

// Insert sample reviews into the database (admin function)
export const insertSampleReviews = async (): Promise<boolean> => {
  try {
    const sampleReviews = [
      {
        user_name: "bobby",
        rating: 5,
        title: "On time and looks top notch",
        content: "I must say these guys make it easy. they confirm the material with a photo before the truck is dispatched. Thank you !",
        verified_purchase: true,
        helpful_votes: 0,
        created_at: "2025-05-27T14:30:00Z",
        product_name: "Driveway Gravel",
        product_id: "driveway-gravel"
      },
      {
        user_name: "Lisa Chen",
        rating: 5,
        title: "Great quality stone",
        content: "Perfect for my landscaping project. Fast delivery and exactly what I ordered.",
        verified_purchase: true,
        helpful_votes: 2,
        created_at: "2025-05-29T10:15:00Z",
        product_name: "River Rock - 1-2 inch",
        product_id: "river-rock-1-2"
      },
      {
        user_name: "Mark Thompson",
        rating: 4,
        title: "Good product, minor delivery delay",
        content: "The gravel quality is excellent. Delivery was about an hour late but driver was courteous.",
        verified_purchase: true,
        helpful_votes: 1,
        created_at: "2025-05-30T16:45:00Z",
        product_name: "Gray Gravel - 3/4 inch",
        product_id: "gravel-gray-34"
      },
      {
        user_name: "Rachel Green",
        rating: 5,
        title: "Amazing customer service",
        content: "Called with questions and they walked me through everything. Highly recommend!",
        verified_purchase: true,
        helpful_votes: 5,
        created_at: "2025-06-02T11:20:00Z",
        product_name: "Decorative Pebbles - Multi",
        product_id: "pebbles-multi"
      },
      {
        user_name: "David Wilson",
        rating: 4,
        title: "Solid choice for driveway",
        content: "Used this for my new driveway. Looks professional and drains well.",
        verified_purchase: true,
        helpful_votes: 3,
        created_at: "2025-06-03T13:30:00Z",
        product_name: "Construction Gravel - 1 inch",
        product_id: "gravel-construction-1"
      },
      {
        user_name: "Amanda Lee",
        rating: 3,
        title: "Decent but had some dust",
        content: "Product is okay but came with more dust than expected. Had to wash it down first.",
        verified_purchase: true,
        helpful_votes: 1,
        created_at: "2025-06-04T09:45:00Z",
        product_name: "White Marble Chips",
        product_id: "marble-white"
      },
      {
        user_name: "Steve Martinez",
        rating: 5,
        title: "Exactly as advertised",
        content: "Perfect size and color. Makes my garden beds look fantastic.",
        verified_purchase: true,
        helpful_votes: 4,
        created_at: "2025-06-05T15:10:00Z",
        product_name: "River Rock - 1-2 inch",
        product_id: "river-rock-1-2"
      },
      {
        user_name: "Karen Brown",
        rating: 4,
        title: "Great for walkway project",
        content: "Easy to work with and looks clean. Would definitely order again.",
        verified_purchase: true,
        helpful_votes: 2,
        created_at: "2025-06-06T12:00:00Z",
        product_name: "Decorative Pebbles - Multi",
        product_id: "pebbles-multi"
      },
      {
        user_name: "Tom Anderson",
        rating: 5,
        title: "Professional delivery service",
        content: "Driver was on time and placed material exactly where I needed it. Top notch service.",
        verified_purchase: true,
        helpful_votes: 6,
        created_at: "2025-06-07T08:30:00Z",
        product_name: "Gray Gravel - 3/4 inch",
        product_id: "gravel-gray-34"
      },
      {
        user_name: "Michelle Taylor",
        rating: 4,
        title: "Good value for the price",
        content: "Quality is solid and pricing was competitive. Happy with my purchase.",
        verified_purchase: true,
        helpful_votes: 1,
        created_at: "2025-06-10T14:20:00Z",
        product_name: "Construction Gravel - 1 inch",
        product_id: "gravel-construction-1"
      },
      {
        user_name: "Chris Johnson",
        rating: 3,
        title: "Average experience",
        content: "Product is fine but nothing special. Delivery was smooth though.",
        verified_purchase: false,
        helpful_votes: 0,
        created_at: "2025-06-11T17:45:00Z",
        product_name: "White Marble Chips",
        product_id: "marble-white"
      },
      {
        user_name: "Nicole Davis",
        rating: 5,
        title: "Perfect for my patio project",
        content: "Beautiful stones that really made my outdoor space pop. Very satisfied!",
        verified_purchase: true,
        helpful_votes: 3,
        created_at: "2025-06-12T11:15:00Z",
        product_name: "Decorative Pebbles - Multi",
        product_id: "pebbles-multi"
      }
    ];

    const { data, error } = await supabase
      .from('customer_reviews')
      .insert(sampleReviews);

    if (error) {
      console.error("Error inserting sample reviews:", error);
      return false;
    }

    console.log("Sample reviews inserted successfully");
    return true;
  } catch (err) {
    console.error("Unexpected error inserting sample reviews:", err);
    return false;
  }
};
