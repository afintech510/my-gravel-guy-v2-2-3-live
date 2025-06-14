
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  zipCode: z.string().min(5, { message: "Please enter a valid ZIP code" }),
  projectType: z.enum(["residential", "commercial"], {
    required_error: "Please select a project type",
  }),
  timeline: z.enum(["asap", "within_month", "within_year", "planning"], {
    required_error: "Please select a timeline",
  }),
  details: z.string().optional(),
  smsConsent: z.boolean().default(false),
  emailConsent: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const QuoteForm = () => {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: "residential",
      timeline: "asap",
      smsConsent: false,
      emailConsent: false,
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    toast({
      title: "Quote Request Submitted",
      description: "We'll get back to you as soon as possible!",
    });
    form.reset();
  };

  return (
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
                  <Input placeholder="Barney Rubble" {...field} />
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
                  <Input type="email" placeholder="rubble@mygravelguy.com" {...field} />
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
                  <Input placeholder="555-123-4567" {...field} />
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
                  <Input placeholder="90210" maxLength={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Project Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="residential" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Residential Project
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="commercial" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Commercial Project
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeline"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Timeline</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="asap" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      As Soon As Possible
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="within_month" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Within a Month
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="within_year" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Within a Year
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="planning" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Just Planning
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Details (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us more about your project..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Communication Consent Section */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-900">Communication Preferences</h4>
          <p className="text-sm text-gray-600">
            Please indicate how you'd like us to communicate with you about your quote and delivery.
          </p>
          
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="emailConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I consent to receive email communications about my quote, order confirmations, and important updates.
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smsConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I consent to receive SMS/text messages for delivery updates and order coordination. 
                      Message & data rates may apply. Reply STOP to opt out.
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <p className="text-xs text-gray-500">
            Learn more about our communication practices on our{" "}
            <Link to="/sms-consent" className="text-blue-600 hover:underline">
              SMS Consent page
            </Link>
            . You can opt out of communications at any time.
          </p>
        </div>

        <Button type="submit" className="w-full">
          Request Quote
        </Button>
      </form>
    </Form>
  );
};

export default QuoteForm;
