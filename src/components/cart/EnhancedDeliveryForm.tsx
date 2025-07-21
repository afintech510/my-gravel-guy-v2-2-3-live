
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CartItem } from '@/contexts/CartContext';
import { trackEvent } from '../../utils/analytics';
import { insertCartToDatabase } from '@/services/cartInsertService';
import { sendCartConfirmationEmail } from '@/services/cartEmailService';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedDeliveryFormData {
  // Delivery date - required
  deliveryDate: Date;
  // Contact info - all required
  name: string;
  phone: string;
  email: string;
  // Delivery address - all required
  street: string;
  city: string;
  state: string;
  zip: string;
  // Optional fields
  deliveryTimePreference?: "anytime" | "morning" | "afternoon";
  deliveryInstructions?: string;
  locationPhotoUrl?: string;
  // Communication consent - required
  communicationConsent: boolean;
}

interface EnhancedDeliveryFormProps {
  onSubmit: (data: EnhancedDeliveryFormData) => void;
  item?: CartItem;
}

const formSchema = z.object({
  deliveryDate: z.date({
    required_error: "Please select a delivery date.",
  }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  street: z.string().min(5, 'Please enter a valid street address'),
  city: z.string().min(2, 'Please enter a valid city'),
  state: z.string().min(2, 'Please enter a valid state'),
  zip: z.string().min(5, 'Please enter a valid ZIP code'),
  deliveryTimePreference: z.enum(["anytime", "morning", "afternoon"]).optional(),
  deliveryInstructions: z.string().optional(),
  locationPhotoUrl: z.string().optional(),
  communicationConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive delivery communications',
  }),
});

const EnhancedDeliveryForm: React.FC<EnhancedDeliveryFormProps> = ({ onSubmit, item }) => {
  const { zipCode, zipCodeData } = useZipCode();
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(item?.locationPhotoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Pre-populate with existing data if available
      name: item?.contactInfo?.name || '',
      email: item?.contactInfo?.email || '',
      phone: item?.contactInfo?.phone || '',
      street: item?.deliveryAddress?.street || '',
      city: item?.deliveryAddress?.city || zipCodeData?.city || '',
      state: item?.deliveryAddress?.state || zipCodeData?.state_id || '',
      zip: item?.deliveryAddress?.zip || zipCode || '',
      deliveryDate: item?.deliveryDate || undefined,
      deliveryTimePreference: item?.deliveryTimePreference || 'anytime',
      deliveryInstructions: item?.deliveryInstructions || '',
      locationPhotoUrl: item?.locationPhotoUrl || '',
      communicationConsent: false,
    },
  });

  const handleSubmitForm = async (data: z.infer<typeof formSchema>) => {
    console.log('EnhancedDeliveryForm: Form submitted:', data);
    setIsSubmitting(true);
    
    try {
      // Track delivery information saving
      console.log('EnhancedDeliveryForm: Tracking delivery info submission');
      trackEvent('form_submit', 'Delivery', `Delivery Info - ${item?.name || 'Unknown Product'}`, item?.tons || 0);
      
      // Create properly typed data for onSubmit
      const enhancedDeliveryData: EnhancedDeliveryFormData = {
        deliveryDate: data.deliveryDate,
        name: data.name,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        deliveryTimePreference: data.deliveryTimePreference,
        deliveryInstructions: data.deliveryInstructions,
        locationPhotoUrl: uploadedPhoto || undefined,
        communicationConsent: data.communicationConsent,
      };
      
      // Call the original onSubmit to update the cart state
      onSubmit(enhancedDeliveryData);
      
      // Now create the cart item with complete delivery info for database insert
      if (item) {
        const updatedItem: CartItem = {
          ...item,
          deliveryDate: data.deliveryDate,
          deliveryAddress: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip
          },
          contactInfo: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            zipCode: data.zip
          },
          deliveryTimePreference: data.deliveryTimePreference,
          deliveryInstructions: data.deliveryInstructions,
          locationPhotoUrl: uploadedPhoto || undefined
        };

        // Insert cart to database
        console.log('EnhancedDeliveryForm: Inserting cart to database');
        const { cartId } = await insertCartToDatabase({ items: [updatedItem] });
        
        // Send cart confirmation email
        console.log('EnhancedDeliveryForm: Sending cart confirmation email');
        await sendCartConfirmationEmail({
          items: [updatedItem],
          cartId,
          actionType: 'save'
        });
        
        toast({
          title: "Delivery Information Saved",
          description: "Your delivery details have been saved successfully.",
        });
      }
      
    } catch (error) {
      console.error('EnhancedDeliveryForm: Error saving delivery info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save delivery information. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a service like Supabase Storage
      const url = URL.createObjectURL(file);
      setUploadedPhoto(url);
    }
  };

  const removePhoto = () => {
    setUploadedPhoto(null);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Tomorrow at earliest

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Delivery Information</h3>
        <p className="text-sm text-gray-600">Please provide your delivery details and contact information.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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

          {/* Delivery Address */}
          <div className="space-y-4">
            <h4 className="font-medium">Delivery Address</h4>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <FormField
                control={form.control}
                name="zip"
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
          </div>

          {/* Delivery Date */}
          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Preferred Delivery Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < minDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery Time Preference */}
          <FormField
            control={form.control}
            name="deliveryTimePreference"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Preferred Delivery Time</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anytime" id="anytime" />
                      <Label htmlFor="anytime">Anytime</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning (8AM-12PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <Label htmlFor="afternoon">Afternoon (12PM-5PM)</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery Instructions */}
          <FormField
            control={form.control}
            name="deliveryInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Instructions (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Special instructions for delivery (e.g., gate code, specific location, etc.)"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Location Photo (Optional)</Label>
            <p className="text-sm text-gray-600">Upload a photo of the delivery location to help our drivers.</p>
            
            {!uploadedPhoto ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload a photo
                    </span>
                  </Label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={uploadedPhoto} alt="Delivery location" className="w-full h-48 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Communication Consent */}
          <FormField
            control={form.control}
            name="communicationConsent"
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
                    I agree to receive SMS and email communications about my delivery (required)
                  </FormLabel>
                  <p className="text-xs text-gray-500">
                    We'll send you updates about your delivery status and timing.
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Delivery Information'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EnhancedDeliveryForm;
