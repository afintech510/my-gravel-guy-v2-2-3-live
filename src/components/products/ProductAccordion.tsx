
import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Product } from '@/services/productTypes';
import { FileText, Package, HardHat, Truck, RotateCcw, HelpCircle, Newspaper } from "lucide-react";

interface ProductAccordionProps {
  product: Product;
}

const ProductAccordion = ({ product }: ProductAccordionProps) => {
  const renderProductUsage = () => {
    if (!product.uses || product.uses.length === 0) {
      return (
        <p>This product is versatile and can be used in a variety of landscaping and construction applications.</p>
      );
    }

    return (
      <div>
        <p className="mb-4">This product is ideal for:</p>
        <ul className="list-disc pl-5 space-y-2">
          {product.uses.map((use, index) => (
            <li key={index}>{use}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderFAQs = () => {
    if (!product.faqs || product.faqs.length === 0) {
      return (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">How much material do I need?</h4>
            <p className="text-gray-600">
              Use our calculator tool on this page to determine how much material you'll need for your project. 
              You can also contact us for assistance with calculating the right amount.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">How is the material delivered?</h4>
            <p className="text-gray-600">
              We deliver using dump trucks. The driver will place the material 
              as close to your desired location as possible, where the truck can safely access.
            </p>
          </div>
          <div className="border-b pb-4">
            <h4 className="font-medium mb-2">What if I order too much or too little?</h4>
            <p className="text-gray-600">
              If you order too little, you can always place another order. If you order too much, 
              unfortunately, we cannot take returns on delivered materials.
            </p>
          </div>
          <p className="text-sm mt-4">
            For more questions, please visit our <a href="/faq" className="text-primary hover:underline">FAQ page</a>.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {product.faqs.map((faq, index) => (
          <div key={index} className="border-b pb-4 last:border-0">
            <h4 className="font-medium mb-2">{faq.question}</h4>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Accordion type="single" collapsible className="w-full mt-12" defaultValue="description">
      <AccordionItem value="description">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <FileText className="mr-3 h-5 w-5" />
            Description
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          <div className="prose max-w-none">
            <p>{product.description}</p>
            {product.specifications && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Specifications</h4>
                <ul className="list-disc pl-5">
                  {product.specifications.density && (
                    <li><strong>Density:</strong> {product.specifications.density}</li>
                  )}
                  {product.specifications.size && (
                    <li><strong>Size:</strong> {product.specifications.size}</li>
                  )}
                  {product.specifications.color && (
                    <li><strong>Color:</strong> {product.specifications.color}</li>
                  )}
                  {product.specifications.coverage && (
                    <li><strong>Coverage:</strong> {product.specifications.coverage}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="product-usage">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <Package className="mr-3 h-5 w-5" />
            Product Usage
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          <div className="prose max-w-none">
            {renderProductUsage()}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="how-it-works">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <HardHat className="mr-3 h-5 w-5" />
            How It Works
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          <div className="prose max-w-none">
            <h4 className="font-medium mb-4">Our Simple 3-Step Process</h4>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">1</span>
                </div>
                <h5 className="font-medium mb-2">Select & Order</h5>
                <p className="text-sm text-gray-600">
                  Choose your material, enter your delivery location, select quantity and delivery date, then complete your order.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">2</span>
                </div>
                <h5 className="font-medium mb-2">Schedule Delivery</h5>
                <p className="text-sm text-gray-600">
                  We'll confirm your order and prepare your materials for delivery on your selected date.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-3">
                  <span className="font-bold text-primary">3</span>
                </div>
                <h5 className="font-medium mb-2">Receive Materials</h5>
                <p className="text-sm text-gray-600">
                  Our driver will deliver your materials to your specified location, ready for your project.
                </p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="delivery-requirements">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <Truck className="mr-3 h-5 w-5" />
            Delivery Requirements
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          <div className="prose max-w-none">
            <p className="mb-4">
              To ensure a smooth delivery process, please review these requirements:
            </p>
            
            <ul className="list-disc pl-5 space-y-3 mb-4">
              <li>
                <strong>Access:</strong> Ensure there's adequate access for a full-size dump truck to your delivery location. 
                Our trucks are approximately 8' wide, 12' high, and up to 30' long.
              </li>
              <li>
                <strong>Location:</strong> Mark or clearly identify where you want the material placed. 
                Our drivers will do their best to place the material as directed.
              </li>
              <li>
                <strong>Clearance:</strong> Check for overhead wires, tree branches, or other obstacles that might 
                prevent a dump truck from safely reaching and dumping at the delivery location.
              </li>
              <li>
                <strong>Soft Ground:</strong> Please note that we cannot drive on soft or wet ground as trucks may 
                get stuck or damage your property.
              </li>
              <li>
                <strong>Someone Present:</strong> We recommend having someone present during delivery to direct the driver, 
                but it's not required.
              </li>
            </ul>
            
            <p>
              <strong>Note:</strong> Our delivery service includes dropping the material in one location. 
              Spreading or placement in multiple locations is not included but can be arranged for an additional fee.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="refund-policy">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <RotateCcw className="mr-3 h-5 w-5" />
            Refund Policy
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          <div className="prose max-w-none">
            <p className="mb-4">
              Due to the nature of bulk materials, we have the following refund policies:
            </p>
            
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Before Delivery:</strong> Orders can be cancelled or modified up to 24 hours before your scheduled 
                delivery for a full refund.
              </li>
              <li>
                <strong>Weather Cancellations:</strong> If weather prevents delivery, we will reschedule or refund at your preference.
              </li>
              <li>
                <strong>After Delivery:</strong> Once materials are delivered, we cannot accept returns or provide refunds.
              </li>
              <li>
                <strong>Quality Issues:</strong> If you believe the delivered product does not match what you ordered, 
                please contact us within 24 hours of delivery with photos.
              </li>
            </ul>
            
            <p className="mt-4 text-sm">
              For our complete refund policy, please visit our <a href="/refund" className="text-primary hover:underline">Refund Policy page</a>.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faqs">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <HelpCircle className="mr-3 h-5 w-5" />
            FAQs
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          {renderFAQs()}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="blog">
        <AccordionTrigger className="py-4 text-lg font-semibold">
          <div className="flex items-center">
            <Newspaper className="mr-3 h-5 w-5" />
            Related Articles
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4 px-1">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg overflow-hidden">
              <div className="h-40 bg-gray-100"></div>
              <div className="p-4">
                <h4 className="font-medium mb-1">How to Prepare Your Site for Gravel Delivery</h4>
                <p className="text-sm text-gray-600 mb-3">Tips for ensuring your site is ready for a smooth delivery experience.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/blog/preparing-for-gravel-delivery">Read Article</a>
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="h-40 bg-gray-100"></div>
              <div className="p-4">
                <h4 className="font-medium mb-1">5 Creative Ways to Use {product.name}</h4>
                <p className="text-sm text-gray-600 mb-3">Inspiration for your next landscaping or construction project.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/blog/creative-uses-for-gravel">Read Article</a>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="link" asChild>
              <a href="/blog">View All Articles</a>
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ProductAccordion;
