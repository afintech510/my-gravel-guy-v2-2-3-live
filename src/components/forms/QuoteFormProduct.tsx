
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/services/productTypes";

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Delivery address is required" }),
  zipCode: z.string().min(5, { message: "Please enter a valid ZIP code" }),
  amount: z.string().min(1, { message: "Please specify the amount needed" }),
  details: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface QuoteFormProductProps {
  product?: Product;
}

const QuoteFormProduct = ({ product }: QuoteFormProductProps) => {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      zipCode: "",
      amount: "",
      details: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // In a real implementation, you would send this to your backend
      console.log("Form submitted:", {
        ...data,
        productRequested: product?.name || "Not specified",
        emailTo: "sales@mygravelguy.com"
      });
      
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Quote Request Submitted",
        description: "We'll get back to you as soon as possible!",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your quote request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mb-12">
      <div className="relative mb-8">
        <div className="absolute -top-10 left-0 right-0 flex justify-center">
          <div className="bg-green-500 text-center px-8 py-2 font-semibold text-white transform skew-x-12">
            QUOTE FORM
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-black">
          FILL OUT BELOW FOR A FREE QUOTE
        </h2>
        <p className="text-gray-600 text-center">
          Fill out the form and our Sales Team will get back to you within 24 hours.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">CONTACT INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
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
                    <FormControl>
                      <Input placeholder="Phone Number" {...field} />
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
                  <FormControl>
                    <Input placeholder="Delivery Address (Street, City, State)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Zip Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Amount Needed (Tons/Yards)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">ADDITIONAL INFORMATION (BE SPECIFIC)</h3>
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Details about the job, aggregate and anything else we'll need to know."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
          >
            SUBMIT
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default QuoteFormProduct;
