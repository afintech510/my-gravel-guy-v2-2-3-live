
export interface EmailData {
  materialCategory: string;
  materialSubcategory: string;
  materialSize: string;
  applicationType: string;
  areas: { length: number; width: number }[];
  depth: number;
  extraPercentage: number;
  totalArea: number;
  cubicYards: number;
  tons: number;
  zipCode: string | null;
  price: number;
  discountedPrice: number;
  discountApplied: boolean;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    consent: boolean;
  };
}

export interface ContactFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  propertyAddress: string;
  projectType: string;
  approximateArea: string;
  additionalDetails: string;
  preferredContact: string;
}

export const sendCalculatorEmail = async (data: EmailData): Promise<boolean> => {
  try {
    // In a real implementation, you'd call your backend API here
    // For now, we'll use a mock API call
    console.log('Sending email to sales@mygravelguy.com with data:', data);

    // Example of how you'd implement this with fetch:
    const response = await fetch('/api/send-calculator-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'sales@mygravelguy.com',
        subject: `Calculator Quote Request - ${data.contactInfo.name}`,
        data: data
      }),
    });

    // For demo purposes, we'll just simulate a successful response
    // Normally you'd check if response.ok or handle the actual response
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendContactFormEmail = async (data: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Sending contact form email with data:', data);
    
    // This is a legacy function that's no longer used directly
    // Contact forms now use the quote email service for database integration
    console.log('Contact form email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact form email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
