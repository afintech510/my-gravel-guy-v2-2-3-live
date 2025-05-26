
import React, { useState } from 'react';
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
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { findZipCodeMatch } from "../../utils/zipCode";
import { useToast } from "@/hooks/use-toast";
import { CartItem, useCart } from "../../contexts/CartContext";

const deliverySchema = z.object({
  deliveryDate: z.date({
    required_error: "Delivery date is required"
  }),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
  contactEmail: z.string().email("Valid email address is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "Valid ZIP code is required"),
  deliveryTimePreference: z.enum(["morning", "afternoon"]).optional(),
  deliveryInstructions: z.string().optional()
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface QuickDeliveryFormProps {
  items: CartItem[];
  onDeliveryConfirmed: () => void;
}

const QuickDeliveryForm = ({ items, onDeliveryConfirmed }: QuickDeliveryFormProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoadingZipData, setIsLoadingZipData] = useState(false);
  const { toast } = useToast();
  const { updateDeliveryDetails } = useCart();
  
  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      deliveryInstructions: ''
    }
  });

  // Watch for zip code changes to auto-populate city and state
  const watchedZip = form.watch('zip');

  React.useEffect(() => {
    const fetchLocationData = async (zipCode: string) => {
      if (zipCode.length === 5) {
        setIsLoadingZipData(true);
        try {
          const zipData = await findZipCodeMatch(zipCode);
          if (zipData) {
            form.setValue('city', zipData.city);
            form.setValue('state', zipData.state_id);
          }
        } catch (error) {
          console.error("Error finding ZIP data:", error);
        } finally {
          setIsLoadingZipData(false);
        }
      }
    };

    if (watchedZip && watchedZip.length === 5 && 
        (!form.getValues('city') || !form.getValues('state'))) {
      fetchLocationData(watchedZip);
    }
  }, [watchedZip, form]);

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

  const onSubmit = (data: DeliveryFormData) => {
    // Update all cart items with delivery information
    items.forEach(item => {
      updateDeliveryDetails(item.id, {
        deliveryDate: data.deliveryDate,
        deliveryAddress: {
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip
        },
        contactPhone: data.contactPhone,
        deliveryTimePreference: data.deliveryTimePreference,
        deliveryInstructions: data.deliveryInstructions,
        contactInfo: {
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
          zipCode: data.zip
        }
      });
    });

    onDeliveryConfirmed();
    toast({
      title: "Delivery Information Saved",
      description: "Your delivery details have been confirmed.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Delivery Date */}
        <FormField
          control={form.control}
          name="deliveryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Delivery Date *</FormLabel>
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
                    onSelect={field.onChange}
                    disabled={(date) => date < addDays(new Date(), 1)}
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
          <h3 className="text-lg font-semibold">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactName"
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
              name="contactEmail"
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
            name="contactPhone"
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
          <h3 className="text-lg font-semibold">Delivery Address</h3>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ZIP" 
                      {...field} 
                      className={isLoadingZipData ? "bg-gray-50" : ""}
                    />
                  </FormControl>
                  {isLoadingZipData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Looking up location...
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Delivery Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delivery Preferences</h3>
          
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
                    placeholder="Special instructions for delivery driver, gate codes, etc." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Photo Upload */}
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
                <span className="mt-2 text-sm text-gray-500">Upload a photo of the delivery location or expected gravel</span>
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
            Help our drivers find the exact location or show us the type of gravel you're expecting
          </p>
        </div>
        
        <Button type="submit" className="w-full" size="lg">
          Confirm Delivery Information
        </Button>
      </form>
    </Form>
  );
};

export default QuickDeliveryForm;
