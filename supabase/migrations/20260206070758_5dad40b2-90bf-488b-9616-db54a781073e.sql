-- Insert sample leads
INSERT INTO public.leads (display_name, phone, email, material, requested_qty, requested_unit, job_address, job_city, job_state, job_zip, target_price, timeline, site_access, notes) VALUES
('Johnson Landscaping', '(555) 123-4567', 'mike@johnsonlandscaping.com', 'Crushed Limestone', 45, 'tons', '1234 Oak Street', 'Dallas', 'TX', '75201', 85, 'Next week', ARRAY['tri_axle', 'semi_trailer'], 'Large driveway project, need delivery before rain'),
('ABC Contractors', '(555) 234-5678', 'sarah@abccontractors.com', 'River Rock 1-3"', 20, 'tons', '5678 Maple Ave', 'Fort Worth', 'TX', '76102', 120, '2 weeks', ARRAY['small', 'tri_axle'], 'Decorative landscaping for commercial property'),
('Smith Residential', '(555) 345-6789', 'bob@smithresidential.com', 'Pea Gravel', 12, 'tons', '910 Pine Road', 'Austin', 'TX', '78701', 95, 'ASAP', ARRAY['small'], 'Backyard patio base layer'),
('Metro Paving Co', '(555) 456-7890', 'info@metropaving.com', 'Road Base', 150, 'tons', '2000 Industrial Blvd', 'Houston', 'TX', '77001', 55, 'This month', ARRAY['semi_trailer'], 'Parking lot project - multiple loads needed'),
('Green Thumb Gardens', '(555) 567-8901', 'lisa@greenthumb.com', 'Decomposed Granite', 8, 'tons', '333 Garden Lane', 'San Antonio', 'TX', '78201', 110, 'Flexible', ARRAY['small', 'tri_axle'], 'Pathway installation');

-- Insert sample supplier quotes (referencing the leads we just created)
INSERT INTO public.supplier_quotes (
  lead_id,
  supplier_name, supplier_phone, supplier_address, supplier_notes,
  material, qty_tons,
  spec_requirement, application, delivery_address, delivery_city, delivery_state, delivery_zip,
  site_access, project_notes,
  is_all_in, material_is_unit, material_price, material_unit,
  delivery_included, delivery_rate, delivery_basis,
  max_qty_per_load, max_qty_unit, lead_time, lead_time_notes,
  available_trucks, payment_methods, cc_fee_percent,
  price_summary
) 
SELECT 
  l.id,
  'Texas Aggregate Supply', '(214) 555-1000', '500 Quarry Road, Dallas TX', 'Reliable supplier, good quality',
  'Crushed Limestone #57', 45,
  'TXDOT Grade A', 'Driveway base', '1234 Oak Street', 'Dallas', 'TX', '75201',
  ARRAY['tri_axle', 'semi_trailer'], 'Standard delivery, customer will be on-site',
  false, true, 22.50, 'ton',
  false, 350, 'total',
  22, 'ton', '24-48 hours', 'Same day possible with extra fee',
  ARRAY['tri_axle_20_22', 'semi_25_27'], ARRAY['CC', 'NET30', 'Check'], 3,
  '$22.50/ton • $350 Del.'
FROM public.leads l WHERE l.display_name = 'Johnson Landscaping';

INSERT INTO public.supplier_quotes (
  lead_id,
  supplier_name, supplier_phone, supplier_address,
  material, qty_tons,
  application, delivery_city, delivery_state, delivery_zip,
  site_access,
  is_all_in, all_in_delivered_total,
  max_qty_per_load, max_qty_unit, lead_time,
  available_trucks, payment_methods,
  price_summary
)
SELECT 
  l.id,
  'Hill Country Stone', '(512) 555-2000', '100 Stone Way, Austin TX',
  'River Rock 1-3"', 20,
  'Decorative', 'Fort Worth', 'TX', '76102',
  ARRAY['small', 'tri_axle'],
  true, 2850,
  18, 'ton', '3-5 days',
  ARRAY['med_10_19', 'tri_axle_20_22'], ARRAY['CC', 'Wire', 'Zelle'],
  'Delivered Total $2850'
FROM public.leads l WHERE l.display_name = 'ABC Contractors';

INSERT INTO public.supplier_quotes (
  lead_id,
  supplier_name, supplier_phone,
  material, qty_tons,
  application, delivery_city, delivery_state, delivery_zip,
  is_all_in, material_is_unit, material_price, material_unit,
  delivery_included,
  max_qty_per_load, lead_time,
  available_trucks, payment_methods, cc_fee_percent,
  price_summary
)
SELECT 
  l.id,
  'Austin Gravel Co', '(512) 555-3000',
  'Pea Gravel 3/8"', 12,
  'Patio base', 'Austin', 'TX', '78701',
  false, true, 45, 'ton',
  true,
  10, '24 hours',
  ARRAY['small_upto_10'], ARRAY['CC', 'Venmo', 'Zelle'], 2.5,
  '$45/ton • Del. Incl.'
FROM public.leads l WHERE l.display_name = 'Smith Residential';