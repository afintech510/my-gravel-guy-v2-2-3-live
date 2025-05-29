import React, { useState, useEffect, useRef } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Calendar as CalendarIcon } from "lucide-react";
import { findZipCodeMatch } from "../../utils/zipCode";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "../../contexts/CartContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useZipCode } from "@/contexts/ZipCodeContext";

const enhancedDeliverySchema = z.object({
  // Delivery date - required
  deliveryDate: z.date({
    required_error: "Delivery date is required",
  }),
  // Contact info - all required
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  // Delivery address - all required
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "Valid ZIP code is required"),
  // Optional fields
  deliveryTimePreference: z.enum(["anytime", "morning", "afternoon"]).optional(),
  deliveryInstructions: z.string().optional(),
  locationPhotoUrl: z.string().optional()
});

export type EnhancedDeliveryFormData = z.infer<typeof enhancedDeliverySchema>;

interface EnhancedDeliveryFormProps {
  item?: CartItem;
  onSubmit: (data: EnhancedDeliveryFormData) => void;
}

const EnhancedDeliveryForm = ({ item, onSubmit }: EnhancedDeliveryFormProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoadingZipData, setIsLoadingZipData] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { setZipCode } = useZipCode();
  
  // Use ref to track the last processed ZIP code to prevent infinite loops
  const lastProcessedZipRef = useRef<string>('');
  
  const form = useForm<EnhancedDeliveryFormData>({
    resolver: zodResolver(enhancedDeliverySchema),
    defaultValues: {
      deliveryDate: item?.deliveryDate,
      name: item?.contactInfo?.name || '',
      phone: item?.contactInfo?.phone || '',
      email: item?.contactInfo?.email || '',
      street: item?.deliveryAddress?.street || '',
      city: item?.deliveryAddress?.city || '',
      state: item?.deliveryAddress?.state || '',
      zip: item?.deliveryAddress?.zip || '',
      deliveryTimePreference: item?.deliveryTimePreference,
      deliveryInstructions: item?.deliveryInstructions || "anytime"
    }
  });

  // Watch for zip code changes to auto-populate city and state
  const watchedZip = form.watch('zip');

  // Auto-populate city and state when zip changes AND update pricing context
  useEffect(() => {
    const fetchLocationData = async (zipCode: string) => {
      // Prevent processing the same ZIP code multiple times
      if (zipCode === lastProcessedZipRef.current) {
        return;
      }
      
      if (zipCode.length === 5) {
        setIsLoadingZipData(true);
        lastProcessedZipRef.current = zipCode; // Mark this ZIP as processed
        
        try {
          const zipData = await findZipCodeMatch(zipCode);
          if (zipData) {
            form.setValue('city', zipData.city);
            form.setValue('state', zipData.state_id);
            
            // Update the ZIP code context to trigger price updates
            setZipCode(zipCode, zipData);
            
            /*toast({
              title: "Location found",
              description: `${zipData.city}, ${zipData.state_id} detected for ZIP code ${zipCode}`,
            });*/
          } else {
            // Even if we don't find ZIP data, update the context for pricing
            setZipCode(zipCode);
          }
        } catch (error) {
          console.error("Error finding ZIP data:", error);
          // Still update ZIP code context for pricing even if lookup fails
          setZipCode(zipCode);
        } finally {
          setIsLoadingZipData(false);
        }
      } else {
        // Reset the processed ZIP when input is not 5 digits
        lastProcessedZipRef.current = '';
      }
    };

    if (watchedZip && watchedZip.length === 5 && watchedZip !== lastProcessedZipRef.current) {
      fetchLocationData(watchedZip);
    }
  }, [watchedZip, form, toast, setZipCode]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
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

  const handleSubmitForm = (data: EnhancedDeliveryFormData) => {
    const formData = {
      ...data,
      locationPhotoUrl: photoPreview || undefined
    };
    onSubmit(formData);
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">Delivery Information</h3>
        <p className="text-sm text-muted-foreground">
          Please fill out all required fields (*) to complete your order
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
          {/* Delivery Date */}
          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Delivery Date *</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                          <span>Pick a delivery date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < minDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Contact Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
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
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Delivery Address */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Delivery Address</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
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
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="12345" 
                        {...field} 
                        className={isLoadingZipData ? "bg-gray-50" : ""}
                      />
                    </FormControl>
                    {isLoadingZipData && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Looking up location and updating prices...
                      </p>
                    )}
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
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City" 
                        {...field} 
                        className={isLoadingZipData ? "bg-gray-50" : ""}
                      />
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
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="State" 
                        {...field}
                        className={isLoadingZipData ? "bg-gray-50" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Optional Delivery Preferences */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Delivery Preferences (Optional)</h4>
            
            <FormField
              control={form.control}
              name="deliveryTimePreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Delivery Time</FormLabel>
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
                      <SelectItem value="anytime">Anytime (7pm - 5pm)</SelectItem>
                      <SelectItem value="morning">Morning (7am - 12pm)</SelectItem>
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
                  <FormLabel>Delivery Instructions</FormLabel>
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
            
            {/* Photo Upload */}
            <div className="space-y-2">
              <FormLabel>Delivery Location Photo</FormLabel>
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
                    <span className="mt-2 text-sm text-gray-500 text-center">
                      Upload a photo of the delivery location or the gravel you're expecting
                    </span>
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
                This helps our drivers find the exact location or understand your expectations
              </p>
            </div>
          </div>
          
          <Button type="submit" className="w-full" size="lg">
            Confirm Delivery Information
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EnhancedDeliveryForm;
