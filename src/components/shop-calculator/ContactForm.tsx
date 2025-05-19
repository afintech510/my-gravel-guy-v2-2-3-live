
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type ContactFormProps = {
  form: UseFormReturn<{
    name?: string;
    email?: string;
    phone?: string;
    consent?: boolean;
  }, any, undefined>;
  onApplyDiscount: () => void;
};

const ContactForm: React.FC<ContactFormProps> = ({ form, onApplyDiscount }) => {
  return (
    <Form {...form}>
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
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={onApplyDiscount}
            type="button"
            className="w-full"
            disabled={!form.formState.isValid}
          >
            Get $50 OFF Discount
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default ContactForm;
