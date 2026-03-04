
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
import { sendQuoteRequestEmail } from '@/services/quoteEmailService';
import { trackEvent } from '@/utils/analytics';
import { US_STATES } from '@/utils/usStates';

const ContactModule = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZip: '',
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
    
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.deliveryZip) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting contact form:', formData);
      
      // Prepare data for quote email service
      const messageLines = [];
      if (formData.projectType) messageLines.push(`Project Type: ${formData.projectType}`);
      if (formData.approximateArea) messageLines.push(`Approximate Area: ${formData.approximateArea} sq ft`);
      messageLines.push(`Preferred Contact: ${formData.preferredContact}`);
      if (formData.additionalDetails) messageLines.push(`\nAdditional Details:\n${formData.additionalDetails}`);

      const quoteFormData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber,
        message: messageLines.join('\n'),
        street: formData.deliveryStreet,
        city: formData.deliveryCity,
        state: formData.deliveryState,
        zipCode: formData.deliveryZip,
        sourcePage: 'home-contact-module'
      };
      
      trackEvent('form_submit', 'Quote', 'Home Contact Form', 1);

      // Send quote request email using the quote service
      const result = await sendQuoteRequestEmail(quoteFormData);
      
      if (result.success) {
        toast({
          title: "Quote Request Sent!",
          description: result.orderId
            ? `We'll get back to you within 24 hours with your customized quote. Reference ID: ${result.orderId}`
            : "We'll get back to you within 24 hours with your customized quote.",
        });
        trackEvent('generate_lead', 'contact_form', 'home_page_contact');

        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phoneNumber: '',
          deliveryStreet: '',
          deliveryCity: '',
          deliveryState: '',
          deliveryZip: '',
          projectType: '',
          approximateArea: '',
          additionalDetails: '',
          preferredContact: 'email'
        });
      } else {
        throw new Error(result.error || 'Failed to send quote request');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      toast({
        title: "Error",
        description: "There was a problem sending your request. Please try again or call us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get a Free Quote
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                <h3 className="font-semibold text-foreground mb-1">Call Us Directly</h3>
                <p className="text-muted-foreground">(844) 624-0400</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                <p className="text-muted-foreground">support@mygravelguy.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Our Service</h3>
                <p className="text-muted-foreground">Nationwide Delivery Available</p>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border border-border">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
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
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
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
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
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

                  {/* Delivery Address */}
                  <div>
                    <Label htmlFor="deliveryStreet" className="text-sm font-medium text-foreground">
                      Delivery Street Address
                    </Label>
                    <Input
                      id="deliveryStreet"
                      value={formData.deliveryStreet}
                      onChange={(e) => handleInputChange('deliveryStreet', e.target.value)}
                      placeholder="123 Main St"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="deliveryCity" className="text-sm font-medium text-foreground">
                        City
                      </Label>
                      <Input
                        id="deliveryCity"
                        value={formData.deliveryCity}
                        onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                        placeholder="City"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        State
                      </Label>
                      <Select
                        value={formData.deliveryState}
                        onValueChange={(value) => handleInputChange('deliveryState', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((st) => (
                            <SelectItem key={st} value={st}>{st}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deliveryZip" className="text-sm font-medium text-foreground">
                        ZIP *
                      </Label>
                      <Input
                        id="deliveryZip"
                        value={formData.deliveryZip}
                        onChange={(e) => handleInputChange('deliveryZip', e.target.value)}
                        placeholder="ZIP Code"
                        maxLength={5}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Project Type and Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-foreground">
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
                      <Label htmlFor="approximateArea" className="text-sm font-medium text-foreground">
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
                    <Label htmlFor="additionalDetails" className="text-sm font-medium text-foreground">
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
                    <Label className="text-sm font-medium text-foreground mb-2 block">
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
