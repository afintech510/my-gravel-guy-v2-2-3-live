
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useZipCode } from "@/contexts/ZipCodeContext";
import { Product } from '@/services/productTypes';

interface QuoteFormProductProps {
  selectedProduct?: Product | null;
}

const QuoteFormProduct: React.FC<QuoteFormProductProps> = ({ selectedProduct }) => {
  const { zipCode } = useZipCode();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    zipCode: zipCode || '',
    acceptTerms: false,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast({
        title: "Terms Not Accepted",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Log form submission details
      console.log('Form submitted:', {
        ...formData,
        product: selectedProduct ? selectedProduct.name : 'Not specified'
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Quote request submitted!",
        description: "We'll contact you shortly with a detailed quote.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        zipCode: zipCode || '',
        acceptTerms: false,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, acceptTerms: checked }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 font-montserrat">Request a Quote</h2>
        <p className="text-gray-600 text-sm">
          For larger orders (over 20 tons) or if you have extra time - send us the details and we can quote a better price!
          </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedProduct && (
          <div className="p-3 bg-gray-50 rounded-md mb-4">
            <p className="text-sm text-gray-700">
              Selected Material: <span className="font-medium">{selectedProduct.name}</span>
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email address"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="zipCode" className="text-sm font-medium">
              Delivery ZIP Code
            </label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="Delivery ZIP code"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Project Details
          </label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your project and any specific requirements"
            rows={4}
          />
        </div>

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={handleCheckboxChange}
          />
          <label
            htmlFor="acceptTerms"
            className="text-sm text-gray-600 leading-tight"
          >
            I agree to be contacted about my quote request and accept the{" "}
            <a href="/terms" className="text-primary underline hover:text-primary/80">
              terms of service
            </a>
            .
          </label>
        </div>

        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full"
        >
          {loading ? "Submitting..." : "Request Quote"}
        </Button>

        <p className="text-xs text-center text-gray-500 mt-4">
          We typically respond to quote requests within 24 business hours.
        </p>
      </form>
    </div>
  );
};

export default QuoteFormProduct;
