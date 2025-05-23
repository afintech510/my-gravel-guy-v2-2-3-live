
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/services/productTypes';
import { useToast } from '@/components/ui/use-toast';
import { MaterialCategory } from './ShopCalculator';

// Define form schema with validation
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(5, { message: 'Please enter a valid phone number' }),
  consent: z.boolean().refine(val => val === true, {
    message: 'You must agree to be contacted'
  })
});

export interface ContactFormProps {
  product?: Product | null;
  productInfo?: {
    name: string;
    quantity: number;
    category: MaterialCategory;
  };
  onApplyDiscount?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ product, productInfo, onApplyDiscount }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      consent: false
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    
    try {
      // Log submission
      console.log('ContactForm: Submitting form data:', {
        ...data,
        product: product?.name || productInfo?.name || 'Not selected'
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      toast({
        title: "Thanks for your information!",
        description: "You've qualified for our discount offer.",
      });
      
      // Apply discount if callback provided
      if (onApplyDiscount) {
        onApplyDiscount();
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4">
            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-gray-600 font-normal">
                    I agree to receive communications about my inquiry
                  </FormLabel>
                </div>
              )}
            />
            {form.formState.errors.consent && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.consent.message}</p>
            )}
          </div>
          
          <div className="mt-4">
            <Button 
              type="submit"
              className="w-full"
              disabled={!form.formState.isValid || !form.getValues().consent || loading}
            >
              {loading ? "Processing..." : "Get $50 OFF Discount"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ContactForm;
