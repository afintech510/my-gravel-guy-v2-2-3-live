
import { CustomerReview, ReviewFilter } from "@/types/review.types";

// Sample data for demo purposes until the Supabase table is created
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

export const fetchReviews = async (
  filter: ReviewFilter = 'all',
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: CustomerReview[], total: number }> => {
  // Apply filters to our sample data
  let filteredReviews = [...sampleReviews];
  
  if (filter === 'verified') {
    filteredReviews = filteredReviews.filter(review => review.verified_purchase);
  } else if (filter.includes('star')) {
    const rating = parseInt(filter.charAt(0));
    filteredReviews = filteredReviews.filter(review => review.rating === rating);
  }
  
  // Sort by newest first
  filteredReviews.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Apply pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedReviews = filteredReviews.slice(start, end);
  
  return { 
    reviews: paginatedReviews, 
    total: filteredReviews.length 
  };
};

export const fetchProductReviews = async (
  productId: string,
  limit: number = 3
): Promise<CustomerReview[]> => {
  // Filter reviews by product ID
  const productReviews = sampleReviews
    .filter(review => review.product_id === productId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
  
  return productReviews;
};

export const submitReview = async (review: Omit<CustomerReview, 'id' | 'created_at' | 'helpful_votes'>): Promise<CustomerReview | null> => {
  // Simulate submitting a review
  const newReview: CustomerReview = {
    ...review,
    id: `new-${Date.now()}`,
    created_at: new Date().toISOString(),
    helpful_votes: 0
  };
  
  // In a real implementation, we'd save this to Supabase
  console.log("New review submitted:", newReview);
  
  return newReview;
};

export const voteReviewHelpful = async (reviewId: string): Promise<boolean> => {
  // Simulate updating the helpful votes count
  console.log(`Voted review ${reviewId} as helpful`);
  return true;
};
