import { supabase } from '@/integrations/supabase/client';

export interface SpecMaterialQuoteData {
  // Contact
  fullName: string;
  company: string;
  email: string;
  phone: string;
  
  // Delivery (ALL REQUIRED per PATCH 4)
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  
  // Order Details
  material: string;
  tons: number;
  deliveryDatePreference: string;
  deliveryWindowPreference: string;
  
  // Project Details (optional)
  projectName?: string;
  poNumber?: string;
  specItemDescription?: string;
  notes?: string;
  specFilePath?: string;
  multiDropRequested?: boolean;
  multiDropDetails?: string;
  
  // Expedite
  expediteRequested: boolean;
}

interface SpecMetaJson {
  material: string;
  tons: number;
  company: string;
  project_name: string | null;
  po_number: string | null;
  spec_item_description: string | null;
  delivery_window: string;
  multi_drop_requested: boolean;
  multi_drop_details: string | null;
  expedite_requested: boolean;
  spec_file_path: string | null;
  user_notes: string | null;
  persona: string;
  source: string;
}

export const generateSpecQuoteId = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = Math.floor(now.getTime() / 1000);
  return `SPEC-${dateStr}-${timestamp}`;
};

/**
 * Build notes field with structured JSON block per PATCH 2
 */
const buildNotesField = (data: SpecMaterialQuoteData): string => {
  // Human-readable summary line
  const summary = `Spec Quote: ${data.material}, ${data.tons} tons, ${data.company}, ${data.deliveryCity} ${data.deliveryState}`;
  
  // Structured JSON block
  const metaJson: SpecMetaJson = {
    material: data.material,
    tons: data.tons,
    company: data.company,
    project_name: data.projectName || null,
    po_number: data.poNumber || null,
    spec_item_description: data.specItemDescription || null,
    delivery_window: data.deliveryWindowPreference,
    multi_drop_requested: data.multiDropRequested || false,
    multi_drop_details: data.multiDropDetails || null,
    expedite_requested: data.expediteRequested,
    spec_file_path: data.specFilePath || null,
    user_notes: data.notes || null,
    persona: "Contractor/PM/DOT/Utility",
    source: "Spec Materials Landing Page"
  };
  
  return `${summary}\n\n--- MGG_SPEC_META_JSON ---\n${JSON.stringify(metaJson, null, 2)}\n--- END_MGG_SPEC_META_JSON ---`;
};

/**
 * Upload spec file to private storage bucket
 * Returns file path only (not signed URL) per PATCH 1
 */
export const uploadSpecFile = async (file: File, quoteId: string): Promise<string | null> => {
  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    console.error('Invalid file type:', file.type);
    return null;
  }
  
  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    console.error('File too large:', file.size);
    return null;
  }
  
  // Sanitize filename
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `spec-uploads/${quoteId}/${sanitizedFilename}`;
  
  try {
    const { error } = await supabase.storage
      .from('customer-uploads')
      .upload(filePath, file, { upsert: false });
    
    if (error) {
      console.error('File upload failed:', error);
      return null;
    }
    
    // Return path only, NOT signed URL (PATCH 1)
    return filePath;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

/**
 * Create a spec material quote order record
 */
export const createSpecMaterialQuote = async (quoteData: SpecMaterialQuoteData) => {
  console.log('Creating spec material quote:', quoteData);
  
  const orderId = generateSpecQuoteId();
  const notesField = buildNotesField(quoteData);
  
  const orderRecord = {
    order_id: orderId,
    product_id: quoteData.material,
    unit: 'tons',
    unit_price: 0,
    total_price: 0,
    quantity: quoteData.tons,
    delivery_name: quoteData.fullName,
    delivery_email: quoteData.email,
    delivery_phone: quoteData.phone,
    delivery_street: quoteData.deliveryStreet,
    delivery_city: quoteData.deliveryCity,
    delivery_state: quoteData.deliveryState,
    delivery_zip: quoteData.deliveryZip,
    delivery_date: quoteData.deliveryDatePreference || null,
    delivery_time_preference: quoteData.deliveryWindowPreference,
    notes: notesField,
    fulfillment_status: 'Quote Needed' as const,
    status: 'Quote',
    billing_name: quoteData.fullName,
    billing_email: quoteData.email,
    tags: ['spec-materials', quoteData.expediteRequested ? 'expedite' : 'standard'].filter(Boolean),
  };

  console.log('Inserting spec quote order:', orderRecord);

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating spec quote:', error);
      throw error;
    }

    console.log('Spec quote created successfully:', data);
    return { success: true, orderId, data };
  } catch (error) {
    console.error('Failed to create spec quote:', error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Send email notifications for spec quote
 */
export const sendSpecQuoteEmails = async (
  quoteData: SpecMaterialQuoteData,
  orderId: string
) => {
  try {
    // Send internal notification
    await supabase.functions.invoke('send-email', {
      body: {
        to: 'operations@mygravelguy.com',
        subject: `New Spec Quote Request: ${quoteData.material} - ${quoteData.tons} tons`,
        html: `
          <h2>New Spec Material Quote Request</h2>
          <p><strong>Quote ID:</strong> ${orderId}</p>
          <p><strong>Material:</strong> ${quoteData.material}</p>
          <p><strong>Quantity:</strong> ${quoteData.tons} tons</p>
          <p><strong>Company:</strong> ${quoteData.company}</p>
          <p><strong>Contact:</strong> ${quoteData.fullName}</p>
          <p><strong>Email:</strong> ${quoteData.email}</p>
          <p><strong>Phone:</strong> ${quoteData.phone}</p>
          <p><strong>Delivery Address:</strong><br/>
            ${quoteData.deliveryStreet}<br/>
            ${quoteData.deliveryCity}, ${quoteData.deliveryState} ${quoteData.deliveryZip}
          </p>
          <p><strong>Delivery Date:</strong> ${quoteData.deliveryDatePreference || 'Not specified'}</p>
          <p><strong>Delivery Window:</strong> ${quoteData.deliveryWindowPreference}</p>
          ${quoteData.expediteRequested ? '<p><strong>⚡ EXPEDITE REQUESTED</strong></p>' : ''}
          ${quoteData.projectName ? `<p><strong>Project:</strong> ${quoteData.projectName}</p>` : ''}
          ${quoteData.poNumber ? `<p><strong>PO #:</strong> ${quoteData.poNumber}</p>` : ''}
          ${quoteData.specItemDescription ? `<p><strong>Spec Item:</strong> ${quoteData.specItemDescription}</p>` : ''}
          ${quoteData.notes ? `<p><strong>Notes:</strong> ${quoteData.notes}</p>` : ''}
          ${quoteData.multiDropRequested ? `<p><strong>Multi-Drop:</strong> Yes - ${quoteData.multiDropDetails || 'Details pending'}</p>` : ''}
          ${quoteData.specFilePath ? `<p><strong>Spec File:</strong> Uploaded to ${quoteData.specFilePath}</p>` : ''}
        `,
        reply_to: quoteData.email,
      },
    });

    // Send customer confirmation
    await supabase.functions.invoke('send-email', {
      body: {
        to: quoteData.email,
        subject: `Quote Request Received - ${quoteData.material} Delivery`,
        html: `
          <h2>We received your quote request!</h2>
          <p>Hi ${quoteData.fullName},</p>
          <p>Thank you for your spec material quote request. Our sourcing team is reviewing your requirements and will respond within the same business day.</p>
          
          <h3>Request Summary</h3>
          <ul>
            <li><strong>Reference:</strong> ${orderId}</li>
            <li><strong>Material:</strong> ${quoteData.material}</li>
            <li><strong>Quantity:</strong> ${quoteData.tons} tons</li>
            <li><strong>Delivery:</strong> ${quoteData.deliveryCity}, ${quoteData.deliveryState}</li>
            ${quoteData.specItemDescription ? `<li><strong>Spec Item:</strong> ${quoteData.specItemDescription}</li>` : ''}
          </ul>
          
          <p>If you have questions, reply to this email or call us at (615) 555-0100.</p>
          
          <p>Best,<br/>MyGravelGuy Sourcing Team</p>
        `,
        reply_to: 'operations@mygravelguy.com',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending emails:', error);
    return { success: false, error: (error as Error).message };
  }
};
