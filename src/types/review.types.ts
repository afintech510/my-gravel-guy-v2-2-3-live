
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
