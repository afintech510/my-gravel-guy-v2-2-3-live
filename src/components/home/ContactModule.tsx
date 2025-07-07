import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const ContactModule = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    propertyAddress: '',
    projectType: '',
    approximateArea: '',
    additionalDetails: '',
    preferredContact: 'email'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual email service call when Supabase is connected
      console.log('Form submission:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Quote Request Sent!",
        description: "We'll get back to you within 24 hours with your customized quote.",
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        propertyAddress: '',
        projectType: '',
        approximateArea: '',
        additionalDetails: '',
        preferredContact: 'email'
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get a Free Quote
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill out the form below, and we'll get back to you with a customized quote for your project.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Call Us Directly</h3>
                <p className="text-gray-600">(844) 624-0400</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                <p className="text-gray-600">support@mygravelguy.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Our Service</h3>
                <p className="text-gray-600">Nationwide Delivery Available</p>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="John Doe"
                      required
                      className="mt-1"
                    />
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Property Address */}
                  <div>
                    <Label htmlFor="propertyAddress" className="text-sm font-medium text-gray-700">
                      Property Address
                    </Label>
                    <Input
                      id="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                      placeholder="123 Main St, City, State, Zip"
                      required
                      className="mt-1"
                    />
                  </div>

                  {/* Project Type and Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Project Type
                      </Label>
                      <Select
                        value={formData.projectType}
                        onValueChange={(value) => handleInputChange('projectType', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driveway">Driveway</SelectItem>
                          <SelectItem value="walkway">Walkway</SelectItem>
                          <SelectItem value="patio">Patio</SelectItem>
                          <SelectItem value="landscaping">Landscaping</SelectItem>
                          <SelectItem value="drainage">Drainage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="approximateArea" className="text-sm font-medium text-gray-700">
                        Approximate Area (sq ft)
                      </Label>
                      <Input
                        id="approximateArea"
                        value={formData.approximateArea}
                        onChange={(e) => handleInputChange('approximateArea', e.target.value)}
                        placeholder="e.g., 500"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <Label htmlFor="additionalDetails" className="text-sm font-medium text-gray-700">
                      Additional Details
                    </Label>
                    <Textarea
                      id="additionalDetails"
                      value={formData.additionalDetails}
                      onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                      placeholder="Tell us more about your project..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  {/* Preferred Contact Method */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Preferred Contact Method
                    </Label>
                    <RadioGroup
                      value={formData.preferredContact}
                      onValueChange={(value) => handleInputChange('preferredContact', value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email-contact" />
                        <Label htmlFor="email-contact">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone-contact" />
                        <Label htmlFor="phone-contact">Phone</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2"
                  >
                    {isSubmitting ? 'Sending Request...' : 'Request Quote'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactModule;