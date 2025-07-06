
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { CalculatorFormValues, calculatorFormSchema } from './types';
import { trackEvent } from '../../utils/analytics';

interface CalculatorFormProps {
  onSubmit: () => void;
  onZipCodeChange?: (zipCode: string) => void;
}

export const CalculatorForm = ({ onSubmit, onZipCodeChange }: CalculatorFormProps) => {
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      zipCode: '',
      consent: false,
    },
  });

  const handleSubmit = () => {
    console.log('CalculatorForm: Form submitted');
    
    // Track material calculator form submission
    try {
      console.log('CalculatorForm: Tracking material calculator form submission');
      trackEvent('form_submit', 'Quote', 'Material Calculator Form', 1);
    } catch (error) {
      console.error('CalculatorForm: Failed to track material calculator form submission:', error);
    }
    
    onSubmit();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} type="tel" />
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
                <Input {...field} type="email" />
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
              <FormLabel>Delivery ZIP Code</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  maxLength={5} 
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value.length === 5) {
                      onZipCodeChange?.(e.target.value);
                    }
                  }}
                />
              </FormControl>
              {field.value && (
                <p className="text-sm text-muted-foreground mt-1">{field.value}</p>
              )}
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
                <FormLabel className="text-sm text-muted-foreground">
                  I agree to receive communications about my inquiry
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={!form.formState.isValid}
        >
          <Send className="w-4 h-4 mr-2" />
          Get Discounted Price
        </Button>
      </form>
    </Form>
  );
};
