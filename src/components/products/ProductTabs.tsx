
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from '@/services/productTypes';
import { Truck, Package, HelpCircle, ClipboardList } from 'lucide-react';

interface ProductTabsProps {
  product: Product;
}

// Category-specific specs that get merged with product data
function getSpecifications(product: Product) {
  const specs: { label: string; value: string }[] = [];
  const cat = product.category?.toLowerCase() || '';

  // Always show these if available
  if (product.name) specs.push({ label: 'Product Name', value: product.name });
  if (product.size) specs.push({ label: 'Particle Size', value: product.size });
  if (product.color) specs.push({ label: 'Color', value: product.color.charAt(0).toUpperCase() + product.color.slice(1) });

  // Category-derived specs
  if (cat.includes('crushed-concrete') || cat.includes('rca')) {
    specs.push({ label: 'Material Type', value: 'Recycled Crushed Concrete (RCA)' });
    specs.push({ label: 'Shape', value: 'Angular, irregular edges' });
    specs.push({ label: 'Compaction', value: 'Excellent — locks together under pressure' });
    specs.push({ label: 'Drainage', value: 'Good permeability' });
    specs.push({ label: 'Weight', value: '~2,400–2,600 lbs per cubic yard' });
  } else if (cat.includes('crushed-gravel') || cat.includes('driveway-gravel')) {
    specs.push({ label: 'Material Type', value: 'Crushed Natural Gravel' });
    specs.push({ label: 'Shape', value: 'Angular to sub-angular' });
    specs.push({ label: 'Compaction', value: 'Very good — angular edges interlock' });
    specs.push({ label: 'Drainage', value: 'Good — allows water to pass through' });
    specs.push({ label: 'Weight', value: '~2,600–2,800 lbs per cubic yard' });
  } else if (cat.includes('crushed-stone') || cat === 'rock-stone') {
    specs.push({ label: 'Material Type', value: 'Crushed Quarry Stone' });
    specs.push({ label: 'Shape', value: 'Angular, mechanically crushed' });
    specs.push({ label: 'Compaction', value: 'Excellent — industry standard for base work' });
    specs.push({ label: 'Drainage', value: 'Good permeability' });
    specs.push({ label: 'Weight', value: '~2,700–2,800 lbs per cubic yard' });
  } else if (cat.includes('river-rock') || cat.includes('natural-gravel')) {
    specs.push({ label: 'Material Type', value: 'Natural River Stone / Gravel' });
    specs.push({ label: 'Shape', value: 'Rounded, naturally tumbled' });
    specs.push({ label: 'Compaction', value: 'Low — not recommended for base layers' });
    specs.push({ label: 'Drainage', value: 'Excellent — large voids between stones' });
    specs.push({ label: 'Weight', value: '~2,400–2,700 lbs per cubic yard' });
  } else if (cat.includes('walkway')) {
    specs.push({ label: 'Material Type', value: 'Decorative Walkway Gravel' });
    specs.push({ label: 'Shape', value: 'Sub-angular to rounded' });
    specs.push({ label: 'Compaction', value: 'Moderate — suitable for foot traffic' });
    specs.push({ label: 'Drainage', value: 'Good permeability' });
    specs.push({ label: 'Weight', value: '~2,500–2,700 lbs per cubic yard' });
  } else if (cat === 'sand') {
    specs.push({ label: 'Material Type', value: 'Sand' });
    specs.push({ label: 'Shape', value: 'Fine granular particles' });
    specs.push({ label: 'Compaction', value: 'Good when wet, moderate when dry' });
    specs.push({ label: 'Drainage', value: 'Moderate — depends on grain size' });
    specs.push({ label: 'Weight', value: '~2,600–2,800 lbs per cubic yard' });
  } else if (cat === 'mulch') {
    specs.push({ label: 'Material Type', value: 'Wood Mulch' });
    specs.push({ label: 'Texture', value: 'Shredded / double-ground' });
    specs.push({ label: 'Coverage', value: '~160 sq ft per cubic yard at 2" depth' });
    specs.push({ label: 'Weight', value: '~400–800 lbs per cubic yard' });
    specs.push({ label: 'Lifespan', value: '1–2 seasons before refresh needed' });
  } else if (cat === 'soil' || cat === 'dirt') {
    specs.push({ label: 'Material Type', value: cat === 'soil' ? 'Soil / Compost' : 'Fill Dirt' });
    specs.push({ label: 'Texture', value: 'Fine, screened' });
    specs.push({ label: 'Compaction', value: cat === 'dirt' ? 'Good — ideal for fill applications' : 'Moderate' });
    specs.push({ label: 'Weight', value: '~2,000–2,400 lbs per cubic yard' });
  }

  // Universal specs
  if (product.tonYardRatio) {
    specs.push({ label: 'Tons per Cubic Yard', value: `~${product.tonYardRatio}` });
  }
  specs.push({ label: 'Minimum Order', value: '3 tons' });
  specs.push({ label: 'Sold By', value: 'Ton (delivered)' });

  return specs;
}

// Category-specific common uses
function getCommonUses(product: Product): string[] {
  const cat = product.category?.toLowerCase() || '';

  if (cat.includes('crushed-concrete') || cat.includes('rca')) {
    return ['Driveway base layers', 'Parking pad foundations', 'Road base and sub-base', 'Trench backfill', 'Under concrete slabs', 'Erosion control'];
  } else if (cat.includes('crushed-gravel') || cat.includes('driveway-gravel')) {
    return ['Driveway surfaces and base', 'Parking areas', 'French drains and drainage', 'Under pavers and patios', 'Road shoulders', 'Backfill around foundations'];
  } else if (cat.includes('crushed-stone') || cat === 'rock-stone') {
    return ['Structural base layers', 'Concrete mix aggregate', 'Drainage systems', 'Under slabs and footings', 'Road and highway base', 'Retaining wall backfill'];
  } else if (cat.includes('river-rock') || cat.includes('natural-gravel')) {
    return ['Landscaping and garden beds', 'Decorative ground cover', 'Dry creek beds', 'Around trees and shrubs', 'Water features', 'Erosion control on slopes'];
  } else if (cat.includes('walkway')) {
    return ['Garden pathways', 'Walkways and trails', 'Patio borders', 'Between stepping stones', 'Decorative ground cover', 'Zen garden features'];
  } else if (cat === 'sand') {
    return ['Leveling base for pavers', 'Sandbox and play areas', 'Masonry and mortar mix', 'Beach and volleyball courts', 'Under above-ground pools', 'Fill and grading'];
  } else if (cat === 'mulch') {
    return ['Garden bed top dressing', 'Tree rings and borders', 'Weed suppression', 'Moisture retention', 'Playground surfacing', 'Landscape aesthetics'];
  } else if (cat === 'soil' || cat === 'dirt') {
    return ['Lawn establishment', 'Garden bed preparation', 'Grading and leveling', 'Raised bed fill', 'Erosion repair', 'Construction fill'];
  }
  return ['Driveways', 'Landscaping', 'Drainage', 'Construction base', 'Backfill'];
}

// Category-specific FAQs
function getFAQs(product: Product): { question: string; answer: string }[] {
  const cat = product.category?.toLowerCase() || '';
  const name = product.name;

  const faqs: { question: string; answer: string }[] = [];

  // Universal FAQ
  faqs.push({
    question: `How much ${name} do I need?`,
    answer: `Use our material calculator on this page to estimate tonnage based on your project dimensions. As a rule of thumb, 1 ton of ${cat.includes('mulch') ? 'mulch covers about 160 sq ft at 2" deep' : 'gravel/stone covers about 80 sq ft at 3" deep'}. We recommend ordering 5–10% extra for settling and edge fill. Our minimum order is 3 tons.`
  });

  faqs.push({
    question: `What does ${name} look like in my area?`,
    answer: `As a natural product, the exact color, texture, and composition of ${name} varies by region based on local quarry supply. We source from trusted suppliers nearest to your delivery location. If you have specific color or appearance requirements, contact us before ordering and we'll help match you with the right material.`
  });

  faqs.push({
    question: 'How is the material delivered?',
    answer: 'All orders are delivered by dump truck directly to your property. The driver will dump the material as close to your desired location as safely possible. You\'ll need a clear, accessible area for the truck — typically at least 10 feet wide and with adequate overhead clearance. Someone must be present to direct placement.'
  });

  faqs.push({
    question: 'Is delivery really free?',
    answer: 'Yes — delivery is included in the per-ton price you see on the site. There are no hidden fees, fuel surcharges, or surprise charges at delivery. The price you see is the price you pay. We source from suppliers near your ZIP code to keep costs low.'
  });

  // Category-specific FAQs
  if (cat.includes('crushed') || cat.includes('gravel') || cat.includes('stone') || cat.includes('driveway') || cat.includes('walkway') || cat.includes('rock')) {
    faqs.push({
      question: `How deep should I install ${name}?`,
      answer: `For driveways: 3–4 inches of surface gravel over a compacted base. For walkways: 2–3 inches is sufficient. For drainage applications: 6–12 inches depending on the project. For base layers under concrete or pavers: 4–6 inches, compacted in lifts. Always compact each layer with a plate compactor for the best results.`
    });

    faqs.push({
      question: 'Do I need a base layer underneath?',
      answer: 'For driveways and high-traffic areas, we recommend a base layer of larger stone (2–3") under your finish layer. This provides stability, improves drainage, and prevents sinking. For lighter applications like garden paths, you can often lay directly on compacted soil with landscape fabric underneath.'
    });
  }

  if (cat === 'mulch') {
    faqs.push({
      question: 'How often should mulch be replaced?',
      answer: 'Most mulch should be refreshed every 1–2 years. Dyed mulch holds its color for about a year. Natural mulch decomposes faster (6–12 months) but adds beneficial nutrients to the soil. You can top-dress with 1–2 inches of fresh mulch rather than fully replacing it each time.'
    });

    faqs.push({
      question: 'Should I remove old mulch before adding new?',
      answer: 'Generally no — old decomposing mulch is good for the soil. Simply add a fresh layer on top. Only remove old mulch if it\'s matted down, has fungal issues, or is more than 4 inches deep (too much mulch can suffocate plant roots).'
    });
  }

  if (cat === 'sand') {
    faqs.push({
      question: 'What type of sand is best for my project?',
      answer: 'Mason sand is ideal for mortar, leveling, and under pavers. Playground sand is washed and safe for play areas. Beach sand works for volleyball courts and decorative use. Washed sand is great for general fill and drainage. Not sure? Contact us and we\'ll recommend the right type.'
    });
  }

  if (cat === 'soil' || cat === 'dirt') {
    faqs.push({
      question: 'What\'s the difference between topsoil, fill dirt, and compost?',
      answer: 'Topsoil is screened, nutrient-rich soil ideal for lawns and gardens. Fill dirt is raw, unscreened material used for grading, filling holes, and construction. Compost is organic matter that enriches soil — mix it with topsoil for the best garden beds. Loam is a balanced blend of sand, silt, and clay, ideal for growing.'
    });
  }

  faqs.push({
    question: 'Can I cancel or modify my order?',
    answer: 'You can modify or cancel your order up until the material is dispatched for delivery. Contact us as soon as possible if you need changes. Once the truck is loaded and en route, cancellation is not possible. We\'ll confirm all details with you before dispatch.'
  });

  return faqs;
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const specs = getSpecifications(product);
  const uses = getCommonUses(product);
  const faqs = getFAQs(product);

  return (
    <div className="mt-16">
      <Tabs defaultValue="details">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="specifications" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            Specifications
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            Delivery Info
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="prose prose-neutral dark:prose-invert max-w-none mt-6">
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Specifications</h3>

          {/* Specs Table */}
          <div className="rounded-lg border border-border overflow-hidden mb-8">
            <table className="w-full">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={spec.label} className={i % 2 === 0 ? 'bg-muted/50' : 'bg-background'}>
                    <td className="px-4 py-3 font-medium text-sm text-foreground w-1/3">{spec.label}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Common Uses */}
          <h4 className="text-lg font-semibold mb-3">Common Uses</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {uses.map((use) => (
              <div key={use} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {use}
              </div>
            ))}
          </div>

          {/* Regional Note */}
          <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Regional Variation:</strong> As a natural product, exact color, texture, and composition may vary by region based on local quarry supply. We source from trusted suppliers nearest to your delivery location for the best quality and pricing.
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Delivery Information</h3>

          <div className="space-y-6">
            {/* How It Works */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">How Delivery Works</h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</span>
                  <span><strong className="text-foreground">Order placed</strong> — We confirm your material, quantity, delivery address, and preferred date.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">2</span>
                  <span><strong className="text-foreground">Sourced locally</strong> — We match you with a vetted supplier near your location for the best pricing and fastest delivery.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">3</span>
                  <span><strong className="text-foreground">Delivered by dump truck</strong> — Material is dumped at your specified location. Someone must be present to direct placement.</span>
                </li>
              </ol>
            </div>

            {/* Delivery Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <h5 className="font-semibold text-foreground mb-2">Scheduling</h5>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>Minimum 72-hour lead time</li>
                  <li>Monday–Friday delivery</li>
                  <li>Morning (8am–12pm) or afternoon (12pm–4pm)</li>
                  <li>Select your preferred date at checkout</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h5 className="font-semibold text-foreground mb-2">Site Requirements</h5>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>10 ft minimum width for truck access</li>
                  <li>Adequate overhead clearance (no low wires)</li>
                  <li>Firm surface — trucks are heavy when loaded</li>
                  <li>Someone must be present at delivery</li>
                </ul>
              </div>
            </div>

            {/* Pricing & Payment */}
            <div className="rounded-lg border border-border p-4">
              <h5 className="font-semibold text-foreground mb-2">Pricing & Payment</h5>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><strong className="text-foreground">All-inclusive pricing</strong> — Delivery, taxes, and fees are included. No surprise charges.</li>
                <li><strong className="text-foreground">Minimum order:</strong> 3 tons per product</li>
                <li><strong className="text-foreground">Volume discounts:</strong> Per-ton price decreases as you order more</li>
                <li><strong className="text-foreground">Authorization hold:</strong> Your card is authorized at checkout but not charged until we confirm your order details</li>
                <li><strong className="text-foreground">Payment methods:</strong> Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay</li>
              </ul>
            </div>

            {/* Service Area */}
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Service Area:</strong> We deliver to all 48 contiguous U.S. states. Enter your ZIP code on the product page to get instant delivered pricing for your location. Remote or difficult-access locations may require additional coordination.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-lg border border-border overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 font-medium text-sm text-foreground hover:bg-muted/50 transition-colors">
                  {faq.question}
                  <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTabs;
