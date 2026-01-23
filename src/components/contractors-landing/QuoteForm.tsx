import React, { useState } from 'react';
import { toast } from 'sonner';
import { sendQuoteRequestEmail } from '@/services/quoteEmailService';

interface FormData {
  name: string;
  phone: string;
  email: string;
  deliveryZip: string;
  material: string;
  quantity: string;
  timeframe: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

interface QuoteFormProps {
  onSuccess?: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    deliveryZip: '',
    material: '',
    quantity: '',
    timeframe: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const materials = [
    '#57 Stone',
    '#67 Stone',
    '#8 Stone',
    '#10 Screenings',
    'Road Base / ABC',
    'RCA',
    'Screenings / Crusher Dust',
    'Mason Sand',
    'Concrete Sand',
    'Sand',
    'Playground Stone',
    'Decomposed Granite',
    'Rip Rap',
    'Drainage Rock',
    'Fill Dirt',
    'Structural Fill',
    'Topsoil',
    'Loam',
    'Mulch',
    'Other',
  ];

  const timeframes = [
    'ASAP (1-3 days)',
    'This week',
    'Next week',
    '2-4 weeks',
    '1+ month out',
    'Flexible / Not sure',
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone) || formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.deliveryZip.trim()) {
      newErrors.deliveryZip = 'Delivery ZIP is required';
    } else if (!/^\d{5}$/.test(formData.deliveryZip)) {
      newErrors.deliveryZip = 'Invalid ZIP code';
    }
    if (!formData.material) newErrors.material = 'Please select a material';
    if (!formData.quantity.trim()) newErrors.quantity = 'Amount is required';
    if (!formData.timeframe) newErrors.timeframe = 'Please select a timeframe';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await sendQuoteRequestEmail({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.deliveryZip,
        material: formData.material,
        estimatedTons: parseFloat(formData.quantity) || undefined,
        timeframe: formData.timeframe,
        message: formData.notes || '',
        sourcePage: '/contractors-aggregate-delivery-service',
      });

      if (result.success) {
        setIsSubmitted(true);
        toast.success('Quote request submitted successfully!');
        onSuccess?.();
        
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          deliveryZip: '',
          material: '',
          quantity: '',
          timeframe: '',
          notes: '',
        });
      } else {
        toast.error(result.error || 'Failed to submit quote request');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-[#BADF24]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-[#BADF24]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[#F5F7FA] mb-4">
          Quote Request Received!
        </h3>
        <p className="text-[#B7C0CC] mb-6">
          A sourcing specialist will reach out within 2 business hours with pricing
          and availability.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-[#BADF24] hover:underline font-medium"
        >
          Submit another request
        </button>
      </div>
    );
  }

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B7C0CC'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.5em 1.5em',
  };

  return (
    <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 md:p-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#F5F7FA] mb-2">
          Get a Fast Quote
        </h3>
        <p className="text-[#B7C0CC] text-sm">
          Tell us what you need. We'll get back to you within 2 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name *"
            className={`w-full bg-[#0F1115] border ${
              errors.name ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
            } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone # *"
              className={`w-full bg-[#0F1115] border ${
                errors.phone ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email *"
              className={`w-full bg-[#0F1115] border ${
                errors.email ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Delivery ZIP */}
        <div>
          <input
            type="text"
            name="deliveryZip"
            value={formData.deliveryZip}
            onChange={handleChange}
            placeholder="Delivery ZIP Code *"
            maxLength={5}
            className={`w-full bg-[#0F1115] border ${
              errors.deliveryZip ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
            } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
          />
          {errors.deliveryZip && (
            <p className="text-red-500 text-xs mt-1">{errors.deliveryZip}</p>
          )}
        </div>

        {/* Material */}
        <div>
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            className={`w-full bg-[#0F1115] border ${
              errors.material ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
            } rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:border-[#BADF24] transition-colors appearance-none cursor-pointer`}
            style={selectStyle}
          >
            <option value="" className="bg-[#0F1115]">
              Select Material *
            </option>
            {materials.map((material) => (
              <option key={material} value={material} className="bg-[#0F1115]">
                {material}
              </option>
            ))}
          </select>
          {errors.material && (
            <p className="text-red-500 text-xs mt-1">{errors.material}</p>
          )}
        </div>

        {/* Amount & Timeframe */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Amount (tons) *"
              className={`w-full bg-[#0F1115] border ${
                errors.quantity ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>
          <div>
            <select
              name="timeframe"
              value={formData.timeframe}
              onChange={handleChange}
              className={`w-full bg-[#0F1115] border ${
                errors.timeframe ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:border-[#BADF24] transition-colors appearance-none cursor-pointer`}
              style={selectStyle}
            >
              <option value="" className="bg-[#0F1115]">
                Timeframe *
              </option>
              {timeframes.map((tf) => (
                <option key={tf} value={tf} className="bg-[#0F1115]">
                  {tf}
                </option>
              ))}
            </select>
            {errors.timeframe && (
              <p className="text-red-500 text-xs mt-1">{errors.timeframe}</p>
            )}
          </div>
        </div>

        {/* Notes (optional) */}
        <div>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes (optional)"
            rows={3}
            className="w-full bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#BADF24] text-[#0F1115] py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Get My Quote'
          )}
        </button>

        <p className="text-center text-[#B7C0CC] text-xs">
          Response within 2 hours • No obligation
        </p>
      </form>
    </div>
  );
};

export default QuoteForm;
