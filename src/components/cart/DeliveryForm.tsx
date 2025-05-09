import React, { useState, useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const deliverySchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "Valid ZIP code is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
  deliveryTimePreference: z.enum(["morning", "afternoon"]).optional(),
  deliveryInstructions: z.string().optional()
});

export type DeliveryFormData = z.infer<typeof deliverySchema>;

interface DeliveryFormProps {
  initialData?: Partial<DeliveryFormData>;
  zipCode?: string;
  onSubmit: (data: DeliveryFormData) => void;
}

const DeliveryForm = ({ initialData, zipCode, onSubmit }: DeliveryFormProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      street: initialData?.street || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip: initialData?.zip || zipCode || '',
      contactPhone: initialData?.contactPhone || '',
      deliveryTimePreference: initialData?.deliveryTimePreference,
      deliveryInstructions: initialData?.deliveryInstructions || ''
    }
  });

  // Auto-populate city and state when ZIP code changes
  useEffect(() => {
    const zipValue = form.watch('zip');
    
    // Only query if ZIP is at least 5 characters and has changed
    if (zipValue && zipValue.length >= 5 && zipValue !== initialData?.zip && zipValue !== zipCode) {
      const fetchLocationData = async () => {
        const { data, error } = await supabase
          .from('service_zip_codes')
          .select('city, state_id')
          .eq('zip', zipValue)
          .maybeSingle();
          
        if (data && !error) {
          // Auto-fill city and state without overwriting if user has already entered values
          const currentCity = form.getValues('city');
          const currentState = form.getValues('state');
          
          if (!currentCity || currentCity === initialData?.city) {
            form.setValue('city', data.city || '');
          }
          
          if (!currentState || currentState === initialData?.state) {
            form.setValue('state', data.state_id || '');
          }
        }
      };
      
      fetchLocationData();
    }
  }, [form.watch('zip')]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmitForm = (data: DeliveryFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="State" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="deliveryTimePreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Delivery Time (Optional)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preferred time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="deliveryInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Special instructions for delivery driver" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Delivery Location Photo (Optional)</FormLabel>
          <div className="border border-dashed border-gray-300 rounded-md p-4">
            {photoPreview ? (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Delivery location" 
                  className="h-40 w-full object-cover rounded-md" 
                />
                <Button
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className="absolute top-2 right-2 bg-white rounded-full"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Upload a photo of the delivery location</span>
                <input
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500">
            This helps our drivers find the exact location for delivery
          </p>
        </div>
        
        <Button type="submit" className="w-full">
          Save Delivery Information
        </Button>
      </form>
    </Form>
  );
};

export default DeliveryForm;
