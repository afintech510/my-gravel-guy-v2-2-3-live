-- Insert test market_materials data for Nashville market with multiple materials

-- Nashville + 57 Crushed Stone
INSERT INTO public.market_materials (
  market_id,
  product_id,
  status,
  market_display_name,
  material_display_name,
  hero_headline,
  hero_subheadline,
  local_intro_copy,
  local_logistics_copy,
  spec_notes,
  best_uses,
  seo_title,
  seo_description,
  faq_json,
  min_tons,
  max_tons,
  expedite_enabled,
  sat_enabled,
  expedite_fee_pct,
  sat_fee_pct,
  confirmation_window_hours,
  standard_lead_time_hours
) VALUES (
  '87775d56-e149-4f2c-ba98-401b7bc816fa', -- Nashville
  'fdec85cd-eb9e-4857-b3f6-6ee6b5cbb5ef', -- Driveway Gravel 3/8"
  'active',
  'Nashville, TN',
  '#57 Crushed Stone',
  'Nashville''s Trusted Source for #57 Crushed Stone',
  'Bulk delivery from 20-500 tons. Same-week availability.',
  'We serve the greater Nashville metro area including Davidson, Williamson, Rutherford, and Wilson counties. Our local quarry partners ensure consistent quality and competitive pricing for all your aggregate needs.',
  'Standard delivery within 48 hours of order confirmation. Expedited next-day delivery available for an additional 15%. Saturday delivery also available.',
  'TDOT-approved #57 limestone. Meets TN state specifications for base and drainage applications.',
  ARRAY['Driveway base', 'French drains', 'Parking areas', 'Pipe bedding', 'Landscaping drainage'],
  '#57 Crushed Stone Delivery in Nashville TN | Bulk Aggregate | MyGravelGuy',
  'Order #57 crushed stone for delivery in Nashville. 20-500 tons available with expedited and Saturday delivery options. TDOT-approved limestone.',
  '[{"question": "What is #57 crushed stone used for?", "answer": "#57 stone is versatile - ideal for driveways, drainage, French drains, and as a base material. The 3/4\" to 1\" pieces compact well while maintaining good drainage."}, {"question": "How much does delivery cost?", "answer": "Delivery is included in the quoted price for the Nashville metro area. Expedited delivery adds 15% and Saturday delivery adds 15%."}, {"question": "What is the minimum order?", "answer": "Our minimum order is 20 tons, which covers approximately 400-500 square feet at 4\" depth."}]',
  20,
  500,
  true,
  true,
  0.15,
  0.15,
  4,
  48
);

-- Nashville + Decomposed Granite
INSERT INTO public.market_materials (
  market_id,
  product_id,
  status,
  market_display_name,
  material_display_name,
  hero_headline,
  hero_subheadline,
  local_intro_copy,
  local_logistics_copy,
  best_uses,
  seo_title,
  seo_description,
  faq_json,
  min_tons,
  max_tons,
  expedite_enabled,
  sat_enabled
) VALUES (
  '87775d56-e149-4f2c-ba98-401b7bc816fa', -- Nashville
  '25da461a-38fd-4284-9bac-946b0917be47', -- Decomposed Granite
  'active',
  'Nashville, TN',
  'Decomposed Granite (DG)',
  'Premium Decomposed Granite for Nashville Landscapes',
  'Natural gold and tan tones. Perfect for pathways and patios.',
  'Our decomposed granite is sourced from regional suppliers and screened to ensure consistent sizing. Popular for residential landscaping throughout Middle Tennessee.',
  'Delivery available throughout Davidson County and surrounding areas. 48-hour standard lead time.',
  ARRAY['Pathways', 'Patio areas', 'Xeriscaping', 'Tree surrounds', 'Garden borders'],
  'Decomposed Granite Delivery Nashville TN | Bulk DG | MyGravelGuy',
  'Order decomposed granite for delivery in Nashville. Natural gold tones perfect for pathways and patios. 20-500 tons with same-week delivery.',
  '[{"question": "What colors are available?", "answer": "Our standard DG comes in natural gold/tan tones. Contact us for specialty colors like red or gray."}, {"question": "Does DG need a binder?", "answer": "For pathways with heavy foot traffic, we recommend adding a stabilizer. For decorative areas, loose DG works great."}]',
  20,
  300,
  true,
  true
);

-- Boston + Driveway Gravel
INSERT INTO public.market_materials (
  market_id,
  product_id,
  status,
  market_display_name,
  material_display_name,
  hero_headline,
  hero_subheadline,
  local_intro_copy,
  best_uses,
  seo_title,
  seo_description,
  min_tons,
  max_tons
) VALUES (
  'f28ac166-e738-4102-8f21-603151e1e7d6', -- Boston
  'c022797d-21c3-4e17-b822-0b34b7e9c602', -- Driveway Gravel 1 1/2"
  'active',
  'Boston, MA',
  '1.5" Driveway Gravel',
  'Boston''s Premier Driveway Gravel Supplier',
  'Bulk gravel delivery for residential and commercial projects.',
  'Serving the greater Boston area including Suffolk, Middlesex, Norfolk, and Essex counties. Our New England quarry partners provide quality crushed stone that handles harsh winters.',
  ARRAY['Driveway surfaces', 'Parking lots', 'Construction access roads', 'Base material'],
  '1.5" Driveway Gravel Delivery Boston MA | Bulk Stone | MyGravelGuy',
  'Order 1.5 inch driveway gravel for delivery in Boston. Bulk quantities from 20-500 tons. Fast delivery throughout Greater Boston.',
  20,
  500
);