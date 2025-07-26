import React, { useState } from 'react';
import { format } from 'date-fns';
import { formatDateTime, formatLocalDate } from '@/utils/dateUtils';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarRating from './StarRating';
import { Badge } from "@/components/ui/badge";
import { ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CustomerReview } from '@/types/review.types';
import { voteReviewHelpful } from '@/services/reviewService';
import { trackEvent } from '@/utils/analytics';

interface ReviewCardProps {
  review: CustomerReview;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  const { toast } = useToast();
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpful_votes);
  const [hasVoted, setHasVoted] = useState(false);
  
  const formattedDate = formatDateTime(review.created_at, 'MMM d, yyyy');
  
  const handleHelpfulVote = async () => {
    if (hasVoted) return;
    
    const success = await voteReviewHelpful(review.id);
    if (success) {
      setHelpfulVotes(prev => prev + 1);
      setHasVoted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded.",
      });
      
      // Track this event in analytics
      trackEvent('vote_helpful', 'review_interaction', `review_${review.id}`, 1);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3 space-y-1.5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-semibold text-lg">{review.title}</h3>
            <div className="flex gap-2 items-center mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-muted-foreground">
                on {formattedDate}
              </span>
            </div>
          </div>
          <div>
            {review.verified_purchase && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Verified Purchase
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-sm font-medium mb-1">
          by {review.user_name}
        </div>
        <p className="text-gray-700">
          {review.content}
        </p>
        
        {review.admin_response && (
          <div className="mt-4 pl-4 border-l-2 border-primary/20 py-2">
            <div className="text-sm font-medium text-primary mb-1">
              Response from Gravel Guy:
            </div>
            <p className="text-sm text-gray-700">
              {review.admin_response}
            </p>
            {review.admin_response_date && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatLocalDate(review.admin_response_date, 'MMM d, yyyy')}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 border-t">
        <div className="flex justify-between items-center w-full">
          <div>
            {review.product_name && (
              <div className="text-xs text-muted-foreground">
                Review for: <span className="font-medium">{review.product_name}</span>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleHelpfulVote}
            disabled={hasVoted}
            className="text-xs"
          >
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            Helpful ({helpfulVotes})
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReviewCard;
