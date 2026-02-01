import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ChevronDown, Upload, X } from 'lucide-react';
import { 
  createSpecMaterialQuote, 
  uploadSpecFile, 
  sendSpecQuoteEmails,
  type SpecMaterialQuoteData 
} from '@/services/specMaterialQuoteService';
import { trackSpecFormStart, trackSpecFormSubmit } from '@/utils/analytics';

// Zod validation schema per PATCH 4
const specFormSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  company: z.string().min(2, "Company is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  deliveryStreet: z.string().min(5, "Street address is required"),
  deliveryCity: z.string().min(2, "City is required"),
  deliveryState: z.string().min(2, "State is required"),
  deliveryZip: z.string().regex(/^\d{5}$/, "Valid 5-digit ZIP required"),
  material: z.string().min(1, "Select a material"),
  tons: z.number().min(20, "Minimum 20 tons").max(1000, "Maximum 1000 tons"),
  deliveryDatePreference: z.string().optional(),
  deliveryWindowPreference: z.string().min(1, "Select delivery window"),
  // Optional fields
  projectName: z.string().optional(),
  poNumber: z.string().optional(),
  specItemDescription: z.string().optional(),
  notes: z.string().optional(),
  multiDropRequested: z.boolean().optional(),
  multiDropDetails: z.string().optional(),
  expediteRequested: z.boolean(),
});

type FormData = z.infer<typeof specFormSchema>;

const materials = [
  '#57 Stone (ASTM/DOT-grade)',
  'RCA - Recycled Concrete Aggregate',
  'Dense Graded Base / Road Base (Item 4/304/ABC)',
  'Stone Dust / Crusher Fines',
  '#8 Stone (Pipe Bedding)',
  '#89 Stone (Utility/Drainage)',
  'Utility Sand (Spec-Only)',
];

const deliveryWindows = [
  'AM (7-11)',
  'Midday (11-2)',
  'PM (2-6)',
  'Best Available',
];

const usStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

interface SpecReservationFormProps {
  selectedMaterial?: string;
}

export interface SpecReservationFormHandle {
  setMaterial: (material: string) => void;
  scrollToForm: () => void;
}

const SpecReservationForm = forwardRef<SpecReservationFormHandle, SpecReservationFormProps>(
  ({ selectedMaterial }, ref) => {
    const formRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState<Partial<FormData>>({
      fullName: '',
      company: '',
      email: '',
      phone: '',
      deliveryStreet: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryZip: '',
      material: selectedMaterial || '',
      tons: 50,
      deliveryDatePreference: '',
      deliveryWindowPreference: '',
      projectName: '',
      poNumber: '',
      specItemDescription: '',
      notes: '',
      multiDropRequested: false,
      multiDropDetails: '',
      expediteRequested: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedOrderId, setSubmittedOrderId] = useState('');
    const [specFile, setSpecFile] = useState<File | null>(null);
    const [showProjectDetails, setShowProjectDetails] = useState(false);
    const [formStarted, setFormStarted] = useState(false);

    // Honeypot field
    const [honeypot, setHoneypot] = useState('');

    useImperativeHandle(ref, () => ({
      setMaterial: (material: string) => {
        setFormData(prev => ({ ...prev, material }));
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      scrollToForm: () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    }));

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      
      setFormData(prev => ({ ...prev, [name]: newValue }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }

      // Track form start on first interaction
      if (!formStarted) {
        setFormStarted(true);
        trackSpecFormStart(formData.material);
      }
    };

    const handleTonsChange = (value: number) => {
      setFormData(prev => ({ ...prev, tons: Math.min(1000, Math.max(20, value)) }));
      if (errors.tons) {
        setErrors(prev => ({ ...prev, tons: '' }));
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          toast.error('Only PDF, JPG, and PNG files are allowed');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size must be under 10MB');
          return;
        }
        setSpecFile(file);
      }
    };

    const validateForm = (): boolean => {
      try {
        specFormSchema.parse({
          ...formData,
          tons: formData.tons || 0,
          expediteRequested: formData.expediteRequested || false,
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(newErrors);
        }
        return false;
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Honeypot check for spam prevention
      if (honeypot) {
        console.log('Honeypot triggered - spam submission blocked');
        return;
      }

      if (!validateForm()) {
        toast.error('Please fix the errors in the form');
        return;
      }

      setIsSubmitting(true);

      try {
        // Generate quote ID first for file upload
        const tempQuoteId = `SPEC-${Date.now()}`;
        
        // Upload file if provided (PATCH 1 - store path only)
        let specFilePath: string | undefined;
        if (specFile) {
          const uploadResult = await uploadSpecFile(specFile, tempQuoteId);
          if (uploadResult) {
            specFilePath = uploadResult;
          }
        }

        // Create quote order
        const quoteData: SpecMaterialQuoteData = {
          fullName: formData.fullName!,
          company: formData.company!,
          email: formData.email!,
          phone: formData.phone!,
          deliveryStreet: formData.deliveryStreet!,
          deliveryCity: formData.deliveryCity!,
          deliveryState: formData.deliveryState!,
          deliveryZip: formData.deliveryZip!,
          material: formData.material!,
          tons: formData.tons!,
          deliveryDatePreference: formData.deliveryDatePreference || '',
          deliveryWindowPreference: formData.deliveryWindowPreference!,
          projectName: formData.projectName,
          poNumber: formData.poNumber,
          specItemDescription: formData.specItemDescription,
          notes: formData.notes,
          specFilePath,
          multiDropRequested: formData.multiDropRequested,
          multiDropDetails: formData.multiDropDetails,
          expediteRequested: formData.expediteRequested || false,
        };

        const result = await createSpecMaterialQuote(quoteData);

        if (result.success && result.orderId) {
          // Send emails
          await sendSpecQuoteEmails(quoteData, result.orderId);
          
          // Track analytics
          trackSpecFormSubmit(formData.tons!, formData.material!, !!specFilePath);
          
          setSubmittedOrderId(result.orderId);
          setIsSubmitted(true);
          toast.success('Quote request submitted successfully!');
        } else {
          toast.error(result.error || 'Failed to submit quote request');
        }
      } catch (error) {
        console.error('Error submitting spec quote:', error);
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

    const inputClass = (fieldName: string) =>
      `w-full bg-[#0F1115] border ${
        errors[fieldName] ? 'border-red-500' : 'border-[rgba(255,255,255,0.10)]'
      } rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#B7C0CC]/50 focus:outline-none focus:border-[#BADF24] transition-colors`;

    if (isSubmitted) {
      return (
        <section id="reservation-form" ref={formRef} className="bg-[#0F1115] py-16 md:py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[#BADF24]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#BADF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#F5F7FA] mb-2">Quote Request Received!</h3>
              <p className="text-[#BADF24] font-medium mb-4">Reference: {submittedOrderId}</p>
              <p className="text-[#B7C0CC] mb-6">
                A sourcing specialist will follow up within the same business day with pricing and availability.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData(prev => ({ ...prev, material: '', tons: 50 }));
                }}
                className="text-[#BADF24] hover:underline font-medium"
              >
                Submit another request
              </button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section id="reservation-form" ref={formRef} className="bg-[#0F1115] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
              Shop / <span className="text-[#BADF24]">Reserve Delivery</span>
            </h2>
            <p className="text-lg text-[#B7C0CC]">
              Fill out the form below to get pricing and reserve your material delivery.
            </p>
          </div>

          <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot - hidden from users */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Material Selection */}
              <div>
                <label className="block text-[#F5F7FA] font-medium mb-2">
                  Select Material *
                </label>
                <select
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className={`${inputClass('material')} appearance-none cursor-pointer`}
                  style={selectStyle}
                >
                  <option value="" className="bg-[#0F1115]">Choose a material...</option>
                  {materials.map((mat) => (
                    <option key={mat} value={mat} className="bg-[#0F1115]">{mat}</option>
                  ))}
                </select>
                {errors.material && <p className="text-red-500 text-xs mt-1">{errors.material}</p>}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[#F5F7FA] font-medium mb-2">
                  Quantity (Tons) * <span className="text-[#B7C0CC] font-normal text-sm">Min: 20, Max: 1,000</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="20"
                    max="1000"
                    step="10"
                    value={formData.tons || 50}
                    onChange={(e) => handleTonsChange(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-[#0F1115] rounded-lg appearance-none cursor-pointer accent-[#BADF24]"
                  />
                  <input
                    type="number"
                    value={formData.tons || 50}
                    onChange={(e) => handleTonsChange(parseInt(e.target.value) || 20)}
                    min="20"
                    max="1000"
                    className="w-24 bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-lg px-3 py-2 text-[#F5F7FA] text-center focus:outline-none focus:border-[#BADF24]"
                  />
                </div>
                {errors.tons && <p className="text-red-500 text-xs mt-1">{errors.tons}</p>}
              </div>

              {/* Delivery Address */}
              <div className="space-y-4">
                <label className="block text-[#F5F7FA] font-medium">Delivery Address *</label>
                <input
                  type="text"
                  name="deliveryStreet"
                  value={formData.deliveryStreet}
                  onChange={handleChange}
                  placeholder="Street Address"
                  className={inputClass('deliveryStreet')}
                />
                {errors.deliveryStreet && <p className="text-red-500 text-xs mt-1">{errors.deliveryStreet}</p>}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-2">
                    <input
                      type="text"
                      name="deliveryCity"
                      value={formData.deliveryCity}
                      onChange={handleChange}
                      placeholder="City"
                      className={inputClass('deliveryCity')}
                    />
                    {errors.deliveryCity && <p className="text-red-500 text-xs mt-1">{errors.deliveryCity}</p>}
                  </div>
                  <div>
                    <select
                      name="deliveryState"
                      value={formData.deliveryState}
                      onChange={handleChange}
                      className={`${inputClass('deliveryState')} appearance-none cursor-pointer`}
                      style={selectStyle}
                    >
                      <option value="" className="bg-[#0F1115]">State</option>
                      {usStates.map((state) => (
                        <option key={state} value={state} className="bg-[#0F1115]">{state}</option>
                      ))}
                    </select>
                    {errors.deliveryState && <p className="text-red-500 text-xs mt-1">{errors.deliveryState}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="deliveryZip"
                      value={formData.deliveryZip}
                      onChange={handleChange}
                      placeholder="ZIP"
                      maxLength={5}
                      className={inputClass('deliveryZip')}
                    />
                    {errors.deliveryZip && <p className="text-red-500 text-xs mt-1">{errors.deliveryZip}</p>}
                  </div>
                </div>
              </div>

              {/* Delivery Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#F5F7FA] font-medium mb-2">Preferred Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDatePreference"
                    value={formData.deliveryDatePreference}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={inputClass('deliveryDatePreference')}
                  />
                </div>
                <div>
                  <label className="block text-[#F5F7FA] font-medium mb-2">Delivery Window *</label>
                  <select
                    name="deliveryWindowPreference"
                    value={formData.deliveryWindowPreference}
                    onChange={handleChange}
                    className={`${inputClass('deliveryWindowPreference')} appearance-none cursor-pointer`}
                    style={selectStyle}
                  >
                    <option value="" className="bg-[#0F1115]">Select window...</option>
                    {deliveryWindows.map((window) => (
                      <option key={window} value={window} className="bg-[#0F1115]">{window}</option>
                    ))}
                  </select>
                  {errors.deliveryWindowPreference && (
                    <p className="text-red-500 text-xs mt-1">{errors.deliveryWindowPreference}</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <label className="block text-[#F5F7FA] font-medium">Contact Information *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className={inputClass('fullName')}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Company"
                      className={inputClass('company')}
                    />
                    {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className={inputClass('email')}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone"
                      className={inputClass('phone')}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Project Details (Collapsible) */}
              <div className="border border-[rgba(255,255,255,0.10)] rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowProjectDetails(!showProjectDetails)}
                  className="w-full flex items-center justify-between px-4 py-3 text-[#F5F7FA] hover:bg-[#0F1115]/50 transition-colors rounded-lg"
                >
                  <span className="font-medium">Project Details (Optional)</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showProjectDetails ? 'rotate-180' : ''}`} />
                </button>
                
                {showProjectDetails && (
                  <div className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleChange}
                        placeholder="Project Name"
                        className={inputClass('projectName')}
                      />
                      <input
                        type="text"
                        name="poNumber"
                        value={formData.poNumber}
                        onChange={handleChange}
                        placeholder="PO # (optional)"
                        className={inputClass('poNumber')}
                      />
                    </div>
                    
                    <input
                      type="text"
                      name="specItemDescription"
                      value={formData.specItemDescription}
                      onChange={handleChange}
                      placeholder="Item / spec name (e.g., 'NYSDOT Item 4', '304', 'ABC', '#57 ASTM C33')"
                      className={inputClass('specItemDescription')}
                    />
                    
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Notes / Spec Notes"
                      rows={3}
                      className={`${inputClass('notes')} resize-none`}
                    />
                    
                    {/* File Upload */}
                    <div>
                      <label className="block text-[#B7C0CC] text-sm mb-2">
                        Upload Spec (PDF, JPG, PNG - max 10MB)
                      </label>
                      {specFile ? (
                        <div className="flex items-center gap-3 bg-[#0F1115] border border-[#BADF24]/30 rounded-lg px-4 py-3">
                          <Upload className="w-5 h-5 text-[#BADF24]" />
                          <span className="text-[#F5F7FA] flex-1 truncate">{specFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setSpecFile(null)}
                            className="text-[#B7C0CC] hover:text-red-400 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 bg-[#0F1115] border border-dashed border-[rgba(255,255,255,0.20)] rounded-lg px-4 py-3 cursor-pointer hover:border-[#BADF24]/50 transition-colors">
                          <Upload className="w-5 h-5 text-[#B7C0CC]" />
                          <span className="text-[#B7C0CC]">Choose file or drag here</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Multi-drop toggle */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="multiDropRequested"
                          checked={formData.multiDropRequested || false}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-[rgba(255,255,255,0.20)] bg-[#0F1115] text-[#BADF24] focus:ring-[#BADF24] focus:ring-offset-0"
                        />
                        <span className="text-[#F5F7FA]">Multiple drop locations?</span>
                      </label>
                      {formData.multiDropRequested && (
                        <textarea
                          name="multiDropDetails"
                          value={formData.multiDropDetails}
                          onChange={handleChange}
                          placeholder="Enter additional delivery addresses or details..."
                          rows={2}
                          className={`${inputClass('multiDropDetails')} resize-none mt-3`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Expedite Option */}
              <div className="bg-[#BADF24]/5 border border-[#BADF24]/20 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="expediteRequested"
                    checked={formData.expediteRequested || false}
                    onChange={handleChange}
                    className="w-5 h-5 mt-0.5 rounded border-[#BADF24]/30 bg-[#0F1115] text-[#BADF24] focus:ring-[#BADF24] focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-[#F5F7FA] font-medium">Need same/next day? Add Expedite</span>
                    <p className="text-[#B7C0CC] text-sm mt-1">
                      Standard lead time: 48 hours. We'll respond within the same business day.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button - PATCH 6 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BADF24] text-[#0F1115] py-4 rounded-lg font-bold text-lg hover:bg-[#a8cb1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Save & Request Pricing'
                )}
              </button>

              <p className="text-center text-[#B7C0CC] text-sm">
                We'll respond within the same business day • No obligation
              </p>
            </form>
          </div>
        </div>
      </section>
    );
  }
);

SpecReservationForm.displayName = 'SpecReservationForm';

export default SpecReservationForm;
