// ManagedQuoteModule - Lead form for spec-matched quotes
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Send, CheckCircle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MarketMaterialData, Product } from './types';
import { getMaterialDisplayName } from '@/services/marketMaterialService';
import { trackMarketQuoteSubmit } from '@/utils/analytics';
import { createLeadFromForm } from '@/services/supplierQuoteService';

interface ManagedQuoteModuleProps {
  pageData: MarketMaterialData;
  product: Product;
  canonicalMarketSlug: string;
}

interface QuoteFormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  estimatedTons: string;
  projectDescription: string;
  specReference: string;
  deliveryZip: string;
}

export default function ManagedQuoteModule({ 
  pageData, 
  product,
  canonicalMarketSlug 
}: ManagedQuoteModuleProps) {
  const { toast } = useToast();
  const materialName = getMaterialDisplayName(pageData, product);
  
  const [formState, setFormState] = useState<QuoteFormState>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    estimatedTons: '',
    projectDescription: '',
    specReference: '',
    deliveryZip: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: keyof QuoteFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formState.contactName.trim() &&
      (formState.email.trim() || formState.phone.trim()) &&
      formState.deliveryZip.length >= 5
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      // Track quote submission
      trackMarketQuoteSubmit(
        canonicalMarketSlug,
        product.slug || '',
        !!formState.specReference.trim()
      );

      // Create lead in the leads table
      const displayName = formState.companyName 
        ? `${formState.companyName} - ${formState.contactName}`
        : formState.contactName;
      
      await createLeadFromForm({
        displayName,
        email: formState.email || undefined,
        phone: formState.phone || undefined,
        material: materialName,
        requestedQty: formState.estimatedTons ? parseFloat(formState.estimatedTons) : undefined,
        requestedUnit: 'tons',
        jobZip: formState.deliveryZip,
        notes: [
          formState.specReference ? `Spec: ${formState.specReference}` : '',
          formState.projectDescription || '',
          `Source: Market Page - ${canonicalMarketSlug}/${product.slug}`
        ].filter(Boolean).join('\n'),
      });
      
      setIsSubmitted(true);
      toast({
        title: 'Quote Request Submitted',
        description: 'Our team will contact you within 24 hours.',
      });
    } catch (error) {
      console.error('Quote submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quote request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Quote Request Received!</h3>
          <p className="text-muted-foreground">
            Our team will review your request and contact you within 24 hours with a custom quote for {materialName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Request a Managed Quote
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Need spec-matched materials or custom pricing? Our team will work with you.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="companyName" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="Your company"
                value={formState.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                placeholder="Your name"
                value={formState.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quoteEmail">Email</Label>
              <Input
                id="quoteEmail"
                type="email"
                placeholder="email@company.com"
                value={formState.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quotePhone">Phone</Label>
              <Input
                id="quotePhone"
                type="tel"
                placeholder="(555) 555-5555"
                value={formState.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedTons">Estimated Tons</Label>
              <Input
                id="estimatedTons"
                placeholder="e.g., 100"
                value={formState.estimatedTons}
                onChange={(e) => handleInputChange('estimatedTons', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quoteDeliveryZip">Delivery ZIP *</Label>
              <Input
                id="quoteDeliveryZip"
                placeholder="12345"
                maxLength={5}
                value={formState.deliveryZip}
                onChange={(e) => handleInputChange('deliveryZip', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specReference">Spec Reference (Optional)</Label>
            <Input
              id="specReference"
              placeholder="e.g., ASTM C33, DOT Grade A, etc."
              value={formState.specReference}
              onChange={(e) => handleInputChange('specReference', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              If you have specific material specifications, include them here.
            </p>
          </div>

          <div>
            <Label htmlFor="projectDescription">Project Description</Label>
            <Textarea
              id="projectDescription"
              placeholder="Tell us about your project, timeline, or any special requirements..."
              value={formState.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Quote Request
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We typically respond within 24 hours for managed quotes.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
