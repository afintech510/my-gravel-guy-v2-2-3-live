import React, { useState } from 'react';
import { toast } from 'sonner';

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  material: string;
  quantity: string;
  deliveryZip: string;
  projectDetails: string;
}

interface FormErrors {
  [key: string]: string;
}

const QuoteForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    material: '',
    quantity: '',
    deliveryZip: '',
    projectDetails: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const materials = [
    '#57 Stone',
    'Road Base / ABC',
    'Screenings / Crusher Dust',
    'Mason Sand',
    'Concrete Sand',
    'Playground Stone',
    'Decomposed Granite',
    'Rip Rap',
    'Fill Dirt',
    'Topsoil',
    'Other',
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
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.material) newErrors.material = 'Please select a material';
    if (!formData.quantity.trim()) newErrors.quantity = 'Quantity is required';
    if (!formData.deliveryZip.trim()) {
      newErrors.deliveryZip = 'Delivery ZIP is required';
    } else if (!/^\d{5}$/.test(formData.deliveryZip)) {
      newErrors.deliveryZip = 'Invalid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Quote request submitted successfully!');

    // Reset form
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      material: '',
      quantity: '',
      deliveryZip: '',
      projectDetails: '',
    });
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
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company *"
              className={`w-full bg-[#0F1115] border ${
                errors.company ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.company && (
              <p className="text-red-500 text-xs mt-1">{errors.company}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone *"
              className={`w-full bg-[#0F1115] border ${
                errors.phone ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            className={`w-full bg-[#0F1115] border ${
              errors.material ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
            } rounded-lg px-4 py-3 text-[#F5F7FA] focus:outline-none focus:border-[#BADF24] transition-colors appearance-none cursor-pointer`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23B7C0CC'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5em 1.5em',
            }}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Quantity (tons) *"
              className={`w-full bg-[#0F1115] border ${
                errors.quantity ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              name="deliveryZip"
              value={formData.deliveryZip}
              onChange={handleChange}
              placeholder="Delivery ZIP *"
              maxLength={5}
              className={`w-full bg-[#0F1115] border ${
                errors.deliveryZip ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
              } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`}
            />
            {errors.deliveryZip && (
              <p className="text-red-500 text-xs mt-1">{errors.deliveryZip}</p>
            )}
          </div>
        </div>

        <div>
          <textarea
            name="projectDetails"
            value={formData.projectDetails}
            onChange={handleChange}
            placeholder="Project details (optional)"
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
