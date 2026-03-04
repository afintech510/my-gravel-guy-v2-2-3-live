
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '../../utils/analytics';
import { sendQuoteRequestEmail } from '../../services/quoteEmailService';
import { US_STATES } from '@/utils/usStates';

interface ContactFormProps {
  productInfo: {
    name: string;
    quantity: number;
    category: string;
  };
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().min(5, 'Please enter a valid ZIP code'),
  message: z.string().optional(),
});

const ContactForm: React.FC<ContactFormProps> = ({ productInfo }) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      message: `I'm interested in ordering ${Math.round(productInfo.quantity)} tons of ${productInfo.name}.`,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('ContactForm: Form submitted:', data);
    
    try {
      // Track shop calculator contact form submission
      trackEvent('form_submit', 'Quote', `Shop Calculator - ${productInfo.name}`, productInfo.quantity);

      // Send quote request with database insertion
      const result = await sendQuoteRequestEmail({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        message: data.message || `I'm interested in ordering ${Math.round(productInfo.quantity)} tons of ${productInfo.name}.`,
        street: data.street,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        estimatedTons: Math.round(productInfo.quantity),
        sourcePage: 'Shop Calculator',
        selectedProduct: { name: productInfo.name }
      });

      if (result.success) {
        trackEvent('generate_lead', 'contact_form', 'shop_calculator');
        toast({
          title: 'Quote request sent!',
          description: `We will get back to you as soon as possible. Reference ID: ${result.orderId}`,
        });
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to send quote request');
      }
    } catch (error) {
      console.error('ContactForm: Failed to submit shop calculator contact form:', error);
      toast({
        title: 'Error sending quote request',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          placeholder="Your Name"
          {...form.register('name')}
          className="w-full"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>
      
      <div>
        <Input
          placeholder="Email Address"
          type="email"
          {...form.register('email')}
          className="w-full"
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>
      
      <div>
        <Input
          placeholder="Phone Number (optional)"
          {...form.register('phone')}
          className="w-full"
        />
      </div>

      <div>
        <Input
          placeholder="Delivery Street Address"
          {...form.register('street')}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Input
            placeholder="City"
            {...form.register('city')}
            className="w-full"
          />
        </div>
        <div>
          <select
            {...form.register('state')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">State</option>
            {US_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div>
          <Input
            placeholder="ZIP Code *"
            {...form.register('zipCode')}
            className="w-full"
          />
          {form.formState.errors.zipCode && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.zipCode.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <Textarea
          placeholder="Message"
          {...form.register('message')}
          className="w-full min-h-[100px]"
        />
      </div>
      
      <Button type="submit" className="w-full">
        Send Quote Request
      </Button>
    </form>
  );
};

export default ContactForm;
