
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+1|1)?[-. ]?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Invalid phone number'),
  zipCode: z.string().min(5, 'ZIP code must be 5 digits'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive communications',
  }),
});

interface CalculatorFormProps {
  onSubmit: () => void;
  onZipCodeChange: (zipCode: string) => void;
}

export const CalculatorForm = ({ onSubmit, onZipCodeChange }: CalculatorFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      zipCode: '',
      consent: false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            {...form.register('name')}
            placeholder="Your name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            {...form.register('email')}
            type="email"
            placeholder="your@email.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            {...form.register('phone')}
            placeholder="(555) 123-4567"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            {...form.register('zipCode')}
            placeholder="12345"
            onChange={(e) => {
              form.setValue('zipCode', e.target.value);
              if (e.target.value.length === 5) {
                onZipCodeChange(e.target.value);
              }
            }}
          />
          {form.formState.errors.zipCode && (
            <p className="text-sm text-red-600">{form.formState.errors.zipCode.message}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          {...form.register('consent')}
          id="consent"
        />
        <Label htmlFor="consent" className="text-sm">
          I agree to receive communications about my quote
        </Label>
      </div>
      {form.formState.errors.consent && (
        <p className="text-sm text-red-600">{form.formState.errors.consent.message}</p>
      )}
      
      <Button type="submit" className="w-full">
        Get My Quote
      </Button>
    </form>
  );
};
