
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/services/productTypes';
import { trackEvent } from '../../utils/analytics';
import { sendQuoteRequestEmail } from '../../services/quoteEmailService';
import { Loader2 } from 'lucide-react';

interface QuoteFormProductProps {
  selectedProduct?: Product | null;
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  zipCode: z.string().min(5, 'Please enter a valid ZIP code'),
  estimatedTons: z.string().optional(),
  message: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive communications',
  }),
});

const QuoteFormProduct: React.FC<QuoteFormProductProps> = ({ selectedProduct }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      zipCode: '',
      estimatedTons: '',
      message: selectedProduct ? `I'm interested in getting a quote for ${selectedProduct.name}.` : '',
      consent: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('QuoteFormProduct: Form submitted:', data);
    setIsSubmitting(true);
    
    try {
      // Track product-specific quote form submission
      console.log('QuoteFormProduct: Tracking product quote form submission');
      trackEvent('form_submit', 'Quote', `Product Quote - ${selectedProduct?.name || 'Unknown'}`, 1);
      
      // Send quote request email with product information
      console.log('QuoteFormProduct: Sending quote request email');
      const emailSent = await sendQuoteRequestEmail({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: `${data.estimatedTons ? `Estimated Tons: ${data.estimatedTons}\n` : ''}${data.message || 'No additional details provided'}`,
        zipCode: data.zipCode,
        selectedProduct: selectedProduct
      });
      
      if (emailSent) {
        toast({
          title: 'Quote request sent!',
          description: 'We will get back to you with a custom quote within 24 hours.',
        });
        form.reset();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('QuoteFormProduct: Failed to submit quote form:', error);
      toast({
        title: 'Error sending quote request',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Get a Custom Quote</h2>
        {selectedProduct && (
          <p className="text-gray-600">
            Interested in <strong>{selectedProduct.name}</strong>? Get a personalized quote for your project.
          </p>
        )}
        {!selectedProduct && (
          <p className="text-gray-600">
            Get a personalized quote for your material needs.
          </p>
        )}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="estimatedTons"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Tons (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Details (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us more about your project..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    I agree to receive communications about my quote request
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Quote Request...
              </>
            ) : (
              'Get Custom Quote'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default QuoteFormProduct;
