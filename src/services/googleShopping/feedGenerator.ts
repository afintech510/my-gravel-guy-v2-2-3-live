
import { Product } from '@/services/productTypes';
import { getProducts } from '@/services/productService';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';

export interface GoogleShoppingProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  condition: 'new' | 'used' | 'refurbished';
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
  price: string;
  brand: string;
  gtin?: string;
  mpn?: string;
  product_type: string;
  google_product_category: string;
  shipping_weight: string;
  custom_label_0?: string; // For geographic targeting
  custom_label_1?: string; // For material type
  custom_label_2?: string; // For size
  custom_label_3?: string; // For usage type
  custom_label_4?: string; // For pricing tier
}

export class GoogleShoppingFeedGenerator {
  private baseUrl: string;
  private brandName: string;
  private defaultZipCode: string;

  constructor(baseUrl: string = 'https://mygravelguy.com', brandName: string = 'My Gravel Guy', defaultZipCode: string = '75001') {
    this.baseUrl = baseUrl;
    this.brandName = brandName;
    this.defaultZipCode = defaultZipCode;
  }

  /**
   * Generate Google Shopping feed for all products
   */
  async generateFeed(zipCode?: string): Promise<GoogleShoppingProduct[]> {
    const products = await getProducts();
    const targetZip = zipCode || this.defaultZipCode;
    
    console.log(`Generating Google Shopping feed for ${products.length} products in zip code ${targetZip}`);
    
    return products.map(product => this.convertToGoogleShoppingProduct(product, targetZip));
  }

  /**
   * Convert internal product to Google Shopping format
   */
  private convertToGoogleShoppingProduct(product: Product, zipCode: string): GoogleShoppingProduct {
    // Calculate price for standard 10-ton quantity
    const pricingResult = calculateProductExponentialPrice(product, 10);
    const basePrice = Math.round(pricingResult.pricePerTon * 100) / 100;
    
    // Generate proper product URL
    const productUrl = `${this.baseUrl}/products/${encodeURIComponent(product.slug)}`;
    
    // Get primary image with fallback
    const imageUrl = this.getProductImageUrl(product);
    
    // Determine Google product category based on material type
    const googleCategory = this.getGoogleProductCategory(product);
    
    // Create product type hierarchy
    const productType = this.createProductTypeHierarchy(product);
    
    // Calculate shipping weight (tons to pounds)
    const shippingWeight = this.calculateShippingWeight(product);
    
    return {
      id: product.id.toString(),
      title: this.createOptimizedTitle(product),
      description: this.createOptimizedDescription(product),
      link: productUrl,
      image_link: imageUrl,
      condition: 'new',
      availability: 'in_stock', // Bulk materials are typically always available
      price: `${basePrice} USD`,
      brand: this.brandName,
      product_type: productType,
      google_product_category: googleCategory,
      shipping_weight: shippingWeight,
      custom_label_0: this.getGeographicLabel(zipCode),
      custom_label_1: product.category,
      custom_label_2: product.size || 'Various',
      custom_label_3: product.usage || 'General',
      custom_label_4: this.getPricingTier(basePrice)
    };
  }

  /**
   * Create SEO-optimized title for Google Shopping
   */
  private createOptimizedTitle(product: Product): string {
    let title = product.name;
    
    // Add size information if available
    if (product.size) {
      title += ` - ${product.size}`;
    }
    
    // Add material type for clarity
    if (product.category === 'gravel') {
      title += ' Gravel';
    } else if (product.category === 'sand') {
      title += ' Sand';
    } else if (product.category === 'base') {
      title += ' Base Material';
    }
    
    // Add "Bulk Delivery" to indicate service type
    title += ' - Bulk Delivery';
    
    // Ensure title doesn't exceed Google's 150 character limit
    return title.length > 150 ? title.substring(0, 147) + '...' : title;
  }

  /**
   * Create detailed description optimized for Google Shopping
   */
  private createOptimizedDescription(product: Product): string {
    let description = product.description;
    
    // Add key selling points
    const sellingPoints = [
      'Bulk delivery available',
      'Professional grade materials',
      'Local supplier network',
      'Competitive pricing'
    ];
    
    // Add material specifications
    if (product.specifications) {
      if (product.specifications.size) {
        description += ` Size: ${product.specifications.size}.`;
      }
      if (product.specifications.color) {
        description += ` Color: ${product.specifications.color}.`;
      }
    }
    
    // Add usage information
    if (product.uses && product.uses.length > 0) {
      description += ` Ideal for: ${product.uses.join(', ')}.`;
    }
    
    // Add selling points
    description += ` ${sellingPoints.join('. ')}.`;
    
    // Ensure description doesn't exceed Google's 5000 character limit
    return description.length > 5000 ? description.substring(0, 4997) + '...' : description;
  }

  /**
   * Get product image URL with fallbacks
   */
  private getProductImageUrl(product: Product): string {
    // Use first image from images array if available
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      // Convert relative URLs to absolute
      return imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`;
    }
    
    // Fallback to main image
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `${this.baseUrl}${product.image}`;
    }
    
    // Ultimate fallback
    return `${this.baseUrl}/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png`;
  }

  /**
   * Map product categories to Google product categories
   */
  private getGoogleProductCategory(product: Product): string {
    const categoryMap: Record<string, string> = {
      'gravel': '1279', // Building Materials > Landscaping > Gravel & Stone
      'sand': '1279', // Building Materials > Landscaping > Gravel & Stone  
      'dirt': '1278', // Building Materials > Landscaping > Soil & Fertilizers
      'soil': '1278', // Building Materials > Landscaping > Soil & Fertilizers
      'mulch': '1278', // Building Materials > Landscaping > Soil & Fertilizers
      'base': '1279', // Building Materials > Landscaping > Gravel & Stone
      'stone': '1279', // Building Materials > Landscaping > Gravel & Stone
      'rock': '1279', // Building Materials > Landscaping > Gravel & Stone
      'crushed-gravel': '1279',
      'crushed-concrete': '1279'
    };
    
    return categoryMap[product.category] || '1279'; // Default to Gravel & Stone
  }

  /**
   * Create hierarchical product type for Google Shopping
   */
  private createProductTypeHierarchy(product: Product): string {
    const hierarchy = ['Landscaping Materials'];
    
    // Add category level
    if (product.category === 'gravel') {
      hierarchy.push('Gravel & Aggregate');
    } else if (product.category === 'sand') {
      hierarchy.push('Sand');
    } else if (product.category === 'dirt' || product.category === 'soil') {
      hierarchy.push('Soil & Dirt');
    } else if (product.category === 'base') {
      hierarchy.push('Base Materials');
    } else {
      hierarchy.push('Other Materials');
    }
    
    // Add subtype if available
    if (product.subtype) {
      hierarchy.push(product.subtype);
    }
    
    // Add size if available
    if (product.size) {
      hierarchy.push(product.size);
    }
    
    return hierarchy.join(' > ');
  }

  /**
   * Calculate shipping weight for bulk materials
   */
  private calculateShippingWeight(product: Product): string {
    // Default weight for 1 ton in pounds (2000 lbs)
    // This represents minimum order quantity
    const defaultWeightLbs = 2000;
    
    // Adjust based on material density if ton/yard ratio is available
    if (product.tonYardRatio) {
      // Higher ratio means denser material
      const adjustedWeight = defaultWeightLbs * (product.tonYardRatio / 1.5);
      return `${Math.round(adjustedWeight)} lb`;
    }
    
    return `${defaultWeightLbs} lb`;
  }

  /**
   * Get geographic label for targeting
   */
  private getGeographicLabel(zipCode: string): string {
    // Extract state/region from zip code (simplified mapping)
    const firstDigit = zipCode.charAt(0);
    const regionMap: Record<string, string> = {
      '0': 'Northeast',
      '1': 'Northeast', 
      '2': 'Southeast',
      '3': 'Southeast',
      '4': 'Southeast',
      '5': 'Midwest',
      '6': 'South-Central',
      '7': 'South-Central',
      '8': 'Mountain',
      '9': 'West'
    };
    
    return regionMap[firstDigit] || 'National';
  }

  /**
   * Determine pricing tier for segmentation
   */
  private getPricingTier(price: number): string {
    if (price < 30) return 'Budget';
    if (price < 60) return 'Standard';
    if (price < 100) return 'Premium';
    return 'Specialty';
  }

  /**
   * Generate XML feed format for Google Merchant Center
   */
  async generateXMLFeed(zipCode?: string): Promise<string> {
    const products = await this.generateFeed(zipCode);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
    xml += '<channel>\n';
    xml += `<title>${this.brandName} Product Feed</title>\n`;
    xml += `<link>${this.baseUrl}</link>\n`;
    xml += '<description>Premium landscaping materials with bulk delivery</description>\n';
    
    products.forEach(product => {
      xml += '<item>\n';
      xml += `<g:id>${this.escapeXml(product.id)}</g:id>\n`;
      xml += `<g:title>${this.escapeXml(product.title)}</g:title>\n`;
      xml += `<g:description>${this.escapeXml(product.description)}</g:description>\n`;
      xml += `<g:link>${this.escapeXml(product.link)}</g:link>\n`;
      xml += `<g:image_link>${this.escapeXml(product.image_link)}</g:image_link>\n`;
      xml += `<g:condition>${product.condition}</g:condition>\n`;
      xml += `<g:availability>${product.availability}</g:availability>\n`;
      xml += `<g:price>${product.price}</g:price>\n`;
      xml += `<g:brand>${this.escapeXml(product.brand)}</g:brand>\n`;
      xml += `<g:product_type>${this.escapeXml(product.product_type)}</g:product_type>\n`;
      xml += `<g:google_product_category>${product.google_product_category}</g:google_product_category>\n`;
      xml += `<g:shipping_weight>${product.shipping_weight}</g:shipping_weight>\n`;
      xml += `<g:custom_label_0>${this.escapeXml(product.custom_label_0 || '')}</g:custom_label_0>\n`;
      xml += `<g:custom_label_1>${this.escapeXml(product.custom_label_1 || '')}</g:custom_label_1>\n`;
      xml += `<g:custom_label_2>${this.escapeXml(product.custom_label_2 || '')}</g:custom_label_2>\n`;
      xml += `<g:custom_label_3>${this.escapeXml(product.custom_label_3 || '')}</g:custom_label_3>\n`;
      xml += `<g:custom_label_4>${this.escapeXml(product.custom_label_4 || '')}</g:custom_label_4>\n`;
      xml += '</item>\n';
    });
    
    xml += '</channel>\n';
    xml += '</rss>';
    
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
