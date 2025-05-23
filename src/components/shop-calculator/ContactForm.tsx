
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
      message: `I'm interested in ordering ${Math.round(productInfo.quantity)} tons of ${productInfo.name}.`,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('Form submitted:', data);
    
    // Here you would typically send this data to your backend
    toast({
      title: 'Message sent!',
      description: 'We'll get back to you as soon as possible.',
    });
    
    form.reset();
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
        <Textarea
          placeholder="Message"
          {...form.register('message')}
          className="w-full min-h-[100px]"
        />
      </div>
      
      <Button type="submit" className="w-full">
        Send Message
      </Button>
    </form>
  );
};

export default ContactForm;
