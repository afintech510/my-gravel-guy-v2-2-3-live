
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '../../utils/analytics';
import { sendQuoteRequestEmail } from '../../services/quoteEmailService';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  zipCode: z.string().min(5, 'Please enter a valid ZIP code'),
  projectType: z.string().min(1, 'Please select a project type'),
  material: z.string().optional(),
  estimatedTons: z.string().optional(),
  message: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive communications',
  }),
});

const QuoteForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      zipCode: '',
      projectType: '',
      material: '',
      estimatedTons: '',
      message: '',
      consent: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('QuoteForm: Form submitted:', data);
    setIsSubmitting(true);
    
    try {
      // Track quote form submission
      console.log('QuoteForm: Tracking quote form submission');
      trackEvent('form_submit', 'Quote', 'General Quote Form', 1);
      
      // Send quote request with database insertion
      console.log('QuoteForm: Sending quote request with database insertion');
      const result = await sendQuoteRequestEmail({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: `Project Type: ${data.projectType}\n${data.material ? `Material: ${data.material}\n` : ''}${data.estimatedTons ? `Estimated Tons: ${data.estimatedTons}\n` : ''}${data.message || 'No additional details provided'}`,
        zipCode: data.zipCode,
        estimatedTons: data.estimatedTons ? parseInt(data.estimatedTons) : undefined,
        projectType: data.projectType,
        material: data.material,
        sourcePage: 'General Quote Form',
        selectedProduct: null
      });
      
      if (result.success) {
        trackEvent('generate_lead', 'quote_form', 'general_quote');
        toast({
          title: 'Quote request sent!',
          description: `We will get back to you with a custom quote within 24 hours. Reference ID: ${result.orderId}`,
        });
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to send quote request');
      }
    } catch (error) {
      console.error('QuoteForm: Failed to submit quote form:', error);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="driveway">Driveway</SelectItem>
                    <SelectItem value="landscaping">Landscaping</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="drainage">Drainage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="#10 Screenings">#10 Screenings</SelectItem>
                    <SelectItem value="#57 Crushed Stone">#57 Crushed Stone</SelectItem>
                    <SelectItem value="#67 Stone">#67 Stone</SelectItem>
                    <SelectItem value="#8 Stone">#8 Stone</SelectItem>
                    <SelectItem value="Beach Sand">Beach Sand</SelectItem>
                    <SelectItem value="Chocolate Brown Mulch">Chocolate Brown Mulch</SelectItem>
                    <SelectItem value="Clean Fill">Clean Fill</SelectItem>
                    <SelectItem value="Compost">Compost</SelectItem>
                    <SelectItem value="Crushed Concrete">Crushed Concrete</SelectItem>
                    <SelectItem value="Crushed Concrete 1 1/2&quot;">Crushed Concrete 1 1/2"</SelectItem>
                    <SelectItem value="Crushed Concrete 2-3&quot;">Crushed Concrete 2-3"</SelectItem>
                    <SelectItem value="Crushed Concrete 3/4&quot;">Crushed Concrete 3/4"</SelectItem>
                    <SelectItem value="Crushed Gravel 1 1/2&quot;">Crushed Gravel 1 1/2"</SelectItem>
                    <SelectItem value="Crushed Gravel 2-3&quot;">Crushed Gravel 2-3"</SelectItem>
                    <SelectItem value="Crushed Gravel 3/4&quot;">Crushed Gravel 3/4"</SelectItem>
                    <SelectItem value="Crushed Gravel 3/8&quot;">Crushed Gravel 3/8"</SelectItem>
                    <SelectItem value="Crushed Stone 1 1/2&quot;">Crushed Stone 1 1/2"</SelectItem>
                    <SelectItem value="Crushed Stone 2-3&quot;">Crushed Stone 2-3"</SelectItem>
                    <SelectItem value="Crushed Stone 3/4&quot;">Crushed Stone 3/4"</SelectItem>
                    <SelectItem value="Crushed Stone 3/8&quot;">Crushed Stone 3/8"</SelectItem>
                    <SelectItem value="Crushed Stone #57">Crushed Stone #57</SelectItem>
                    <SelectItem value="Crusher Run">Crusher Run</SelectItem>
                    <SelectItem value="Decomposed Granite">Decomposed Granite</SelectItem>
                    <SelectItem value="Dirt Fill">Dirt Fill</SelectItem>
                    <SelectItem value="Drainage Rock">Drainage Rock</SelectItem>
                    <SelectItem value="Driveway Gravel">Driveway Gravel</SelectItem>
                    <SelectItem value="Driveway Gravel 1 1/2&quot;">Driveway Gravel 1 1/2"</SelectItem>
                    <SelectItem value="Driveway Gravel 3/4&quot;">Driveway Gravel 3/4"</SelectItem>
                    <SelectItem value="Driveway Gravel 3/8&quot;">Driveway Gravel 3/8"</SelectItem>
                    <SelectItem value="Jet Black Mulch">Jet Black Mulch</SelectItem>
                    <SelectItem value="Loam">Loam</SelectItem>
                    <SelectItem value="Mason Sand">Mason Sand</SelectItem>
                    <SelectItem value="Natural Brown Mulch">Natural Brown Mulch</SelectItem>
                    <SelectItem value="Natural Gravel">Natural Gravel</SelectItem>
                    <SelectItem value="Natural Pea Gravel 3/8&quot;">Natural Pea Gravel 3/8"</SelectItem>
                    <SelectItem value="Pea Gravel">Pea Gravel</SelectItem>
                    <SelectItem value="Playground Sand">Playground Sand</SelectItem>
                    <SelectItem value="RCA Blend 3/4&quot;">RCA Blend 3/4"</SelectItem>
                    <SelectItem value="Red Mulch">Red Mulch</SelectItem>
                    <SelectItem value="River Rock">River Rock</SelectItem>
                    <SelectItem value="River Rock Large">River Rock Large</SelectItem>
                    <SelectItem value="Road Base">Road Base</SelectItem>
                    <SelectItem value="Topsoil">Topsoil</SelectItem>
                    <SelectItem value="Walkway Gravel">Walkway Gravel</SelectItem>
                    <SelectItem value="Walkway Gravel 3/4&quot;">Walkway Gravel 3/4"</SelectItem>
                    <SelectItem value="Walkway Gravel 3/8&quot;">Walkway Gravel 3/8"</SelectItem>
                    <SelectItem value="Washed Sand">Washed Sand</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
        </div>
        
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
  );
};

export default QuoteForm;
