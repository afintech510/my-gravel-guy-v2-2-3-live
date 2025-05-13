
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StarRating from './StarRating';
import { submitReview } from '@/services/reviewService';

interface ReviewFormProps {
  productId?: string;
  productName?: string;
  onSubmitSuccess?: () => void;
}

type FormData = {
  name: string;
  title: string;
  content: string;
};

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId,
  productName,
  onSubmitSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      title: '',
      content: ''
    }
  });
  
  const onSubmit = async (data: FormData) => {
    if (rating === 0) {
      toast({
        title: "Please add a rating",
        description: "Select between 1-5 stars for your review",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const reviewData = {
      user_name: data.name,
      title: data.title,
      content: data.content,
      rating,
      product_id: productId,
      product_name: productName,
      verified_purchase: Boolean(productId), // Assuming it's verified if product ID is provided
    };
    
    const result = await submitReview(reviewData);
    
    setIsSubmitting(false);
    
    if (result) {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      form.reset();
      setRating(0);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } else {
      toast({
        title: "Submission failed",
        description: "There was a problem submitting your review. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Rating</FormLabel>
              <StarRating 
                rating={rating} 
                interactive={true} 
                onRatingChange={setRating} 
                size="lg"
              />
              {rating === 0 && (
                <p className="text-sm text-destructive">Please select a rating</p>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Your name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Review title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Great product!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              rules={{ 
                required: "Review content is required",
                minLength: {
                  value: 20,
                  message: "Please write at least 20 characters"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your experience with this product..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Min. 20 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ReviewForm;
