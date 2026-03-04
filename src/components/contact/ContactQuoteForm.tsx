import React, { useState } from 'react';
import { toast } from 'sonner';
import { sendQuoteRequestEmail } from '@/services/quoteEmailService';
import { createLeadFromForm } from '@/services/supplierQuoteService';
import { Check } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

interface FormData {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  deliveryZip: string;
  projectType: string;
  materials: string[];
  quantity: string;
  timing: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

const ContactQuoteForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    deliveryZip: '',
    projectType: '',
    materials: [],
    quantity: '',
    timing: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const projectTypes = [
    'Driveway',
    'Construction / Site Work',
    'Drainage',
    'Landscaping',
    'Municipal / Commercial',
    'Other',
  ];

  const materialOptions = [
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

  const timingOptions = [
    'ASAP',
    'This Week',
    '1–2 Weeks',
    'Flexible / Budget Driven',
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

  const handleMaterialToggle = (material: string) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter((m) => m !== material)
        : [...prev.materials, material],
    }));
    if (errors.materials) {
      setErrors((prev) => ({ ...prev, materials: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone) || formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.deliveryZip.trim()) {
      newErrors.deliveryZip = 'Delivery ZIP is required';
    } else if (!/^\d{5}$/.test(formData.deliveryZip)) {
      newErrors.deliveryZip = 'Invalid ZIP code';
    }
    if (!formData.projectType) newErrors.projectType = 'Please select a project type';
    if (formData.materials.length === 0) newErrors.materials = 'Please select at least one material';
    if (!formData.quantity.trim()) newErrors.quantity = 'Please provide an estimate';
    if (!formData.timing) newErrors.timing = 'Please select a timeframe';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const messageContent = [
        formData.companyName ? `Company: ${formData.companyName}` : null,
        `Project Type: ${formData.projectType}`,
        `Materials: ${formData.materials.join(', ')}`,
        `Quantity: ${formData.quantity}`,
        `Timing: ${formData.timing}`,
        formData.notes ? `Notes: ${formData.notes}` : null,
      ].filter(Boolean).join('\n');

      // Create lead in leads table (non-blocking)
      try {
        await createLeadFromForm({
          displayName: formData.name,
          email: formData.email,
          phone: formData.phone,
          material: formData.materials.join(', '),
          requestedQty: parseFloat(formData.quantity) || undefined,
          requestedUnit: 'tons',
          jobZip: formData.deliveryZip,
          timeline: formData.timing,
          notes: `${formData.projectType}\n${formData.notes || ''}`.trim(),
        });
        console.log('Lead created from contact form');
      } catch (leadErr) {
        console.warn('Failed to create lead from contact form:', leadErr);
      }

      const result = await sendQuoteRequestEmail({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        zipCode: formData.deliveryZip,
        material: formData.materials.join(', '),
        estimatedTons: parseFloat(formData.quantity) || undefined,
        timeframe: formData.timing,
        message: messageContent,
        sourcePage: '/contact',
      });

      if (result.success) {
        setIsSubmitted(true);
        toast.success('Quote request submitted successfully!');
        trackEvent('form_submit', 'Quote', 'Contact Page Quote', 1);
        trackEvent('generate_lead', 'contact_form', 'contact_page_quote');
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

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B7C0CC'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1.5em 1.5em',
  };

  if (isSubmitted) {
    return (
      <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-[#BADF24]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-[#BADF24]" />
        </div>
        <h3 className="text-2xl font-bold text-[#F5F7FA] mb-4">
          Quote Request Received!
        </h3>
        <p className="text-[#B7C0CC] mb-6">
          A sourcing specialist will reach out within 2 business hours with pricing
          and availability.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              name: '',
              companyName: '',
              email: '',
              phone: '',
              deliveryZip: '',
              projectType: '',
              materials: [],
              quantity: '',
              timing: '',
              notes: '',
            });
          }}
          className="text-[#BADF24] hover:underline font-medium"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name *"
              className={`w-full bg-[#0F1115] border ${
                errors.name ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Company Name (optional)"
              className="w-full bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors"
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address *"
              className={`w-full bg-[#0F1115] border ${
                errors.email ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number *"
              className={`w-full bg-[#0F1115] border ${
                errors.phone ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
          {errors.deliveryZip && <p className="text-red-500 text-xs mt-1">{errors.deliveryZip}</p>}
        </div>

        {/* Project Type */}
        <div>
          <select
            name="projectType"
            value={formData.projectType}
            onChange={handleChange}
            className={`w-full bg-[#0F1115] border ${
              errors.projectType ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
            } rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:border-[#BADF24] transition-colors appearance-none cursor-pointer`}
            style={selectStyle}
          >
            <option value="" className="bg-[#0F1115]">Project Type *</option>
            {projectTypes.map((type) => (
              <option key={type} value={type} className="bg-[#0F1115]">{type}</option>
            ))}
          </select>
          {errors.projectType && <p className="text-red-500 text-xs mt-1">{errors.projectType}</p>}
        </div>

        {/* Material Type */}
        <div>
          <select
            name="material"
            value={formData.materials[0] || ''}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, materials: e.target.value ? [e.target.value] : [] }));
              if (errors.materials) {
                setErrors((prev) => ({ ...prev, materials: '' }));
              }
            }}
            className={`w-full bg-[#0F1115] border ${
              errors.materials ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
            } rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:border-[#BADF24] transition-colors appearance-none cursor-pointer`}
            style={selectStyle}
          >
            <option value="" className="bg-[#0F1115]">Material Type *</option>
            {materialOptions.map((material) => (
              <option key={material} value={material} className="bg-[#0F1115]">{material}</option>
            ))}
          </select>
          {errors.materials && <p className="text-red-500 text-xs mt-1">{errors.materials}</p>}
        </div>

        {/* Quantity & Timing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Est. Qty (tons) *"
              className={`w-full bg-[#0F1115] border ${
                errors.quantity ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>
          <div>
            <select
              name="timing"
              value={formData.timing}
              onChange={handleChange}
              className={`w-full bg-[#0F1115] border ${
                errors.timing ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:border-[#BADF24] transition-colors appearance-none cursor-pointer`}
              style={selectStyle}
            >
              <option value="" className="bg-[#0F1115]">Timeframe *</option>
              {timingOptions.map((t) => (
                <option key={t} value={t} className="bg-[#0F1115]">{t}</option>
              ))}
            </select>
            {errors.timing && <p className="text-red-500 text-xs mt-1">{errors.timing}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes / Details (optional)"
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
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Get My Delivered Quote'
          )}
        </button>

        <p className="text-center text-[#B7C0CC] text-xs">
          Fast response. No spam. Real pricing from vetted local suppliers.
        </p>
      </form>
    </div>
  );
};

export default ContactQuoteForm;
