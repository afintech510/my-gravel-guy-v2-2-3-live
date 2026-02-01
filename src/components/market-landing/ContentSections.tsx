import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, MapPin, Package, Wrench, AlertTriangle, HelpCircle } from 'lucide-react';
import type { MarketMaterialData, Product, DeliveryLocation } from './types';
import { getMaterialDisplayName } from '@/services/marketMaterialService';

interface ContentSectionsProps {
  pageData: MarketMaterialData;
  product: Product;
  market: DeliveryLocation;
}

export default function ContentSections({ pageData, product, market }: ContentSectionsProps) {
  const materialName = getMaterialDisplayName(pageData, product);

  return (
    <div className="space-y-12">
      {/* Local Intro */}
      {pageData.local_intro_copy && (
        <section>
          <h2 className="text-2xl font-bold mb-4">
            {materialName} in {pageData.market_display_name}
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {pageData.local_intro_copy}
            </p>
          </div>
        </section>
      )}

      {/* Best Uses */}
      {pageData.best_uses && pageData.best_uses.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Best Uses for {materialName}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {pageData.best_uses.map((use, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{use}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Specifications */}
      {pageData.spec_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>{pageData.spec_notes}</p>
            </div>
            {product.size && (
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="font-medium">Size:</span> {product.size}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Material Caveats */}
      {pageData.material_caveats && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800 dark:text-amber-200">
              {pageData.material_caveats}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Local Logistics */}
      {pageData.local_logistics_copy && (
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Delivery in {pageData.market_display_name}
          </h3>
          <p className="text-muted-foreground">
            {pageData.local_logistics_copy}
          </p>
        </section>
      )}

      {/* Gallery */}
      {pageData.gallery_image_urls && pageData.gallery_image_urls.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4">Product Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pageData.gallery_image_urls.map((url, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src={url} 
                  alt={`${materialName} - Image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {pageData.faq_json && pageData.faq_json.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {pageData.faq_json.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}
    </div>
  );
}
