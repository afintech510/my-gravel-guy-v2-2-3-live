
import React from "react";
import { useQuiz } from "../../../contexts/QuizContext";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trackEvent } from "../../../utils/analytics";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  zipCode: z.string().min(5, { message: "Please enter a valid ZIP code" }),
  address: z.string().optional(),
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DeliveryStep: React.FC = () => {
  const { state, setDeliveryInfo, prevStep, nextStep } = useQuiz();
  
  // Initialize form with existing values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: state.deliveryInfo.name || "",
      email: state.deliveryInfo.email || "",
      phone: state.deliveryInfo.phone || "",
      zipCode: state.deliveryInfo.zipCode || "",
      address: state.deliveryInfo.address || "",
      comments: state.deliveryInfo.comments || "",
    },
  });
  
  const onSubmit = (data: FormValues) => {
    console.log('DeliveryStep: Form submitted:', data);
    
    // Track quiz delivery step completion
    try {
      console.log('DeliveryStep: Tracking quiz delivery step completion');
      trackEvent('form_submit', 'Quiz', 'Quiz Delivery Step', 1);
    } catch (error) {
      console.error('DeliveryStep: Failed to track quiz delivery step:', error);
    }
    
    // Ensure all required fields are present by providing empty strings as fallbacks
    const deliveryInfo = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      zipCode: data.zipCode,
      address: data.address || "",
      comments: data.comments || "",
    };
    
    setDeliveryInfo(deliveryInfo);
    nextStep();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Delivery Information</h2>
        <p className="text-gray-600">Please provide your contact and delivery details.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
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
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any specific delivery instructions or questions about your project..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button type="submit">
                  See Recommendations
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryStep;
