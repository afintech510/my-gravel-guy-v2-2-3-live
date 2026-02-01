import React from 'react';
import { MapPin, Truck, Clock, Shield } from 'lucide-react';
import type { MarketMaterialData, Product, DeliveryLocation } from './types';
import { getProductImage, getMaterialDisplayName } from '@/services/marketMaterialService';

interface MarketHeroProps {
  pageData: MarketMaterialData;
  product: Product;
  market: DeliveryLocation;
}

export default function MarketHero({ pageData, product, market }: MarketHeroProps) {
  const materialName = getMaterialDisplayName(pageData, product);
  const heroImage = getProductImage(pageData, product);
  
  const headline = pageData.hero_headline || 
    `${materialName} Delivery in ${pageData.market_display_name}`;
  
  const subheadline = pageData.hero_subheadline || 
    `Fast, reliable bulk ${materialName.toLowerCase()} delivery for contractors and large projects.`;

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 mb-6">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {pageData.market_display_name}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            {subheadline}
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Truck className="h-5 w-5 text-primary" />
              <span>20-500 Tons Available</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="h-5 w-5 text-primary" />
              <span>Expedited Delivery Available</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="h-5 w-5 text-primary" />
              <span>Contractor-Grade Quality</span>
            </div>
          </div>
        </div>

        {/* Product Image */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10">
            <img 
              src={heroImage} 
              alt={materialName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                {product.category || 'Aggregate'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
