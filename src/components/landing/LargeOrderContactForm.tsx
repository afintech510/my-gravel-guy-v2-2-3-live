import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import { sendQuoteRequestEmail } from '@/services/quoteEmailService';

interface LargeOrderContactFormProps {
  productName: string;
  zipCode?: string;
}

const LargeOrderContactForm = ({ productName, zipCode }: LargeOrderContactFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendQuoteRequestEmail({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim() || `Large order inquiry — 100+ tons of ${productName}`,
        zipCode: zipCode || '',
        material: productName,
        estimatedTons: 100,
        sourcePage: '/57-crushed-stone (Large Order)',
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Failed to send request. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle className="h-12 w-12 text-primary mx-auto" />
        <h4 className="text-lg font-semibold">Quote Request Received!</h4>
        <p className="text-muted-foreground">
          We'll get back to you within 2 hours with competitive pricing for your large order.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lo-name">Name *</Label>
          <Input
            id="lo-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lo-phone">Phone *</Label>
          <Input
            id="lo-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lo-email">Email *</Label>
        <Input
          id="lo-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lo-message">Details (optional)</Label>
        <Textarea
          id="lo-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`I need 100+ tons of ${productName} delivered to...`}
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Large Order Quote
          </>
        )}
      </Button>
    </form>
  );
};

export default LargeOrderContactForm;
