
export interface CustomerReview {
  id: string;
  product_id?: string;
  product_name?: string;
  user_name: string;
  rating: number;
  title: string;
  content: string;
  verified_purchase: boolean;
  helpful_votes: number;
  created_at: string;
  admin_response?: string;
  admin_response_date?: string;
}

export type ReviewFilter = 'all' | 'verified' | '5star' | '4star' | '3star' | '2star' | '1star';

// Note: For future reference, to implement this properly,
// you'll need to add a customer_reviews table in Supabase with these fields:
// - id (uuid, primary key)
// - product_id (text, references products.id)
// - product_name (text)
// - user_name (text, not null)
// - rating (integer, not null)
// - title (text, not null)
// - content (text, not null)
// - verified_purchase (boolean, default false)
// - helpful_votes (integer, default 0)
// - created_at (timestamp with time zone, default now())
// - admin_response (text)
// - admin_response_date (timestamp with time zone)
