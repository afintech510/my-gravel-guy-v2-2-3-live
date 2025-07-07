import { Product } from '@/services/productTypes';
import { getProducts } from '@/services/productService';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';
import { 
  isContinentalUSZipCode, 
  getContinentalUSRegion, 
  generateUSShippingConfig,
  isContinentalUSState
} from './usTargeting';

export interface GoogleShoppingProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_link?: string; // For product variants
  mobile_link?: string; // Mobile-optimized links
  condition: 'new' | 'used' | 'refurbished';
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
  price: string;
  sale_price?: string; // For promotional pricing
  sale_price_effective_date?: string; // Sale period
  brand: string;
  gtin?: string;
  mpn?: string;
  product_type: string;
  google_product_category: string;
  // Enhanced US-specific targeting
  shipping: string;
  shipping_label: string;
  // Optimized custom labels for Performance Max
  custom_label_0?: string; // Campaign Group (Gravel, Sand, Soil, etc.)
  custom_label_1?: string; // Material Size (Fine, Medium, Large, Various)
  custom_label_2?: string; // Primary Use (Driveway, Landscaping, Construction, Decorative)
  custom_label_3?: string; // US Regional targeting
  custom_label_4?: string; // Pricing tier for bidding optimization
  // Explicit geographic restrictions
  included_destination: string;
  excluded_destination: string;
}

export class GoogleShoppingFeedGenerator {
  private baseUrl: string;
  private brandName: string;
  private defaultZipCode: string;
  private shippingConfig: any;

  constructor(baseUrl: string = 'https://mygravelguy.com', brandName: string = 'My Gravel Guy', defaultZipCode: string = '75001') {
    this.baseUrl = baseUrl;
    this.brandName = brandName;
    this.defaultZipCode = defaultZipCode;
    this.shippingConfig = generateUSShippingConfig();
  }

  /**
   * Generate Google Shopping feed for continental US only
   */
  async generateFeed(): Promise<GoogleShoppingProduct[]> {
    const products = await getProducts();
    
    console.log(`Generating Google Shopping feed for ${products.length} products for continental US`);
    
    return products.map(product => this.convertToGoogleShoppingProduct(product));
  }

  /**
   * Convert internal product to Google Shopping format with US restrictions
   */
  private convertToGoogleShoppingProduct(product: Product): GoogleShoppingProduct {
    // Calculate price for minimum 3-ton order quantity
    const pricingResult = calculateProductExponentialPrice(product, 3);
    const totalPrice = Math.round(pricingResult.pricePerTon * 3 * 100) / 100;
    
    // Generate proper product URL
    const productUrl = `${this.baseUrl}/products/${encodeURIComponent(product.slug)}`;
    const mobileUrl = `${this.baseUrl}/products/${encodeURIComponent(product.slug)}?mobile=1`;
    
    // Get primary and additional images
    const imageUrl = this.getProductImageUrl(product);
    const additionalImageUrl = this.getAdditionalImageUrl(product);
    
    // Determine Google product category based on material type
    const googleCategory = this.getGoogleProductCategory(product);
    
    // Create product type hierarchy
    const productType = this.createProductTypeHierarchy(product);
    
    // Generate promotional pricing if applicable
    const salePrice = this.generateSalePrice(totalPrice);
    
    return {
      id: `${product.id}-US`, // Continental US ID
      title: this.createOptimizedTitle(product),
      description: this.createOptimizedDescription(product),
      link: productUrl,
      mobile_link: mobileUrl,
      image_link: imageUrl,
      additional_image_link: additionalImageUrl,
      condition: 'new',
      availability: 'in_stock',
      price: `${totalPrice} USD`,
      sale_price: salePrice ? `${salePrice} USD` : undefined,
      sale_price_effective_date: salePrice ? this.generateSalePeriod() : undefined,
      brand: this.brandName,
      product_type: productType,
      google_product_category: googleCategory,
      // US-specific shipping configuration
      shipping: this.generateShippingInfo(),
      shipping_label: 'Continental US Only',
      // Optimized custom labels for Performance Max
      custom_label_0: this.getCampaignGroup(product.category),
      custom_label_1: this.getMaterialSize(product.size, product.specifications?.size),
      custom_label_2: this.getPrimaryUse(product.usage, product.uses),
      custom_label_3: 'Continental-US',
      custom_label_4: this.getPricingTier(totalPrice),
      // Explicit geographic restrictions
      included_destination: 'US',
      excluded_destination: 'AK,HI,PR,VI,GU,AS,MP,CA,AU,MX,International'
    };
  }

  /**
   * Create SEO-optimized title for Google Shopping using format: "Material Type – Size – Use – Delivery"
   */
  private createOptimizedTitle(product: Product): string {
    const parts: string[] = [];
    
    // Start with high-intent keywords
    parts.push('Bulk');
    
    // Add material type with category
    let materialType = product.name;
    if (product.category === 'gravel') {
      materialType += ' Gravel';
    } else if (product.category === 'sand') {
      materialType += ' Sand';
    } else if (product.category === 'base') {
      materialType += ' Base';
    } else if (product.category === 'dirt' || product.category === 'soil') {
      materialType += ' Soil';
    }
    parts.push(materialType);
    
    // Add size if available
    if (product.size || product.specifications?.size) {
      const size = product.size || product.specifications?.size || '';
      parts.push(`${size}`);
    }
    
    // Add primary use
    const primaryUse = this.getPrimaryUseForTitle(product.usage, product.uses);
    parts.push(primaryUse);
    
    // Add delivery commitment
    parts.push('Fast Delivery');
    
    // Join with dashes and ensure under 150 characters
    const title = parts.join(' – ');
    return title.length > 150 ? title.substring(0, 147) + '...' : title;
  }

  /**
   * Create mobile-optimized description with HTML stripping and better structure
   */
  private createOptimizedDescription(product: Product): string {
    // Strip HTML tags from description
    let cleanDescription = this.stripHtmlTags(product.description || '');
    
    // Start with key selling points
    const keyPoints = [
      'Professional grade landscaping materials with fast bulk delivery',
      'Local supplier network ensures competitive pricing',
      'Perfect for residential and commercial projects'
    ];
    
    let description = keyPoints.join('. ') + '. ';
    
    // Add material specifications in mobile-friendly format
    if (product.specifications) {
      if (product.specifications.size) {
        description += `Material Size: ${product.specifications.size}. `;
      }
      if (product.specifications.color) {
        description += `Color: ${product.specifications.color}. `;
      }
      if (product.specifications.coverage) {
        description += `Coverage: ${product.specifications.coverage}. `;
      }
    }
    
    // Add usage information
    if (product.uses && product.uses.length > 0) {
      description += `Ideal Applications: ${product.uses.slice(0, 3).join(', ')}. `;
    }
    
    // Add original description if it's clean and not too long
    if (cleanDescription && cleanDescription.length < 1000) {
      description += cleanDescription + ' ';
    }
    
    // Add trust signals
    description += 'Minimum 3-ton orders. Same-day delivery available in most areas. Professional installation guidance included.';
    
    // Ensure under 5000 characters and end properly
    if (description.length > 5000) {
      description = description.substring(0, 4997) + '...';
    }
    
    return description.trim();
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Decode HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get additional image URL for product variants
   */
  private getAdditionalImageUrl(product: Product): string | undefined {
    // Use second image from images array if available
    if (product.images && product.images.length > 1) {
      const imageUrl = product.images[1];
      return imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`;
    }
    return undefined;
  }

  /**
   * Generate promotional sale price (10% off for larger orders)
   */
  private generateSalePrice(basePrice: number): number | undefined {
    // Apply 5% discount for orders over $150
    if (basePrice > 150) {
      return Math.round(basePrice * 0.95 * 100) / 100;
    }
    return undefined;
  }

  /**
   * Generate sale period for promotional pricing
   */
  private generateSalePeriod(): string {
    const now = new Date();
    const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    return `${now.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * Get campaign group for Performance Max optimization
   */
  private getCampaignGroup(category: string): string {
    const campaignGroups: Record<string, string> = {
      'gravel': 'Gravel',
      'sand': 'Sand', 
      'dirt': 'Soil',
      'soil': 'Soil',
      'mulch': 'Mulch',
      'base': 'Base',
      'stone': 'Stone',
      'rock': 'Stone',
      'crushed-gravel': 'Gravel',
      'crushed-concrete': 'Base'
    };
    
    return campaignGroups[category] || 'Materials';
  }

  /**
   * Get material size category for custom labels
   */
  private getMaterialSize(size?: string, specSize?: string): string {
    const sizeValue = size || specSize || '';
    
    if (!sizeValue) return 'Various';
    
    // Parse size and categorize
    if (sizeValue.includes('1/4') || sizeValue.includes('0.25') || sizeValue.includes('fine')) {
      return 'Fine';
    } else if (sizeValue.includes('1/2') || sizeValue.includes('3/4') || sizeValue.includes('0.5') || sizeValue.includes('0.75')) {
      return 'Medium';
    } else if (sizeValue.includes('1"') || sizeValue.includes('2"') || sizeValue.includes('large')) {
      return 'Large';
    }
    
    return 'Various';
  }

  /**
   * Get primary use for custom labels
   */
  private getPrimaryUse(usage?: string, uses?: string[]): string {
    // Priority order for use cases
    if (usage === 'driveway' || (uses && uses.some(u => u.toLowerCase().includes('driveway')))) {
      return 'Driveway';
    }
    
    if (uses && uses.length > 0) {
      const useString = uses[0].toLowerCase();
      if (useString.includes('landscape') || useString.includes('garden')) {
        return 'Landscaping';
      }
      if (useString.includes('construction') || useString.includes('building')) {
        return 'Construction';
      }
      if (useString.includes('decorative') || useString.includes('accent')) {
        return 'Decorative';
      }
      if (useString.includes('walkway') || useString.includes('path')) {
        return 'Walkway';
      }
    }
    
    return 'Landscaping'; // Default
  }

  /**
   * Get primary use for title optimization (shorter format)
   */
  private getPrimaryUseForTitle(usage?: string, uses?: string[]): string {
    if (usage === 'driveway' || (uses && uses.some(u => u.toLowerCase().includes('driveway')))) {
      return 'Driveway';
    }
    
    if (uses && uses.length > 0) {
      const useString = uses[0].toLowerCase();
      if (useString.includes('landscape')) {
        return 'Landscaping';
      }
      if (useString.includes('construction')) {
        return 'Construction';
      }
      if (useString.includes('walkway')) {
        return 'Walkway';
      }
    }
    
    return 'Landscaping';
  }

  /**
   * Generate US-specific shipping information
   */
  private generateShippingInfo(): string {
    return 'US:Continental US:0 USD:1-3 business days';
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
   * Create hierarchical product type for Google Shopping with US focus
   */
  private createProductTypeHierarchy(product: Product): string {
    const hierarchy = ['US Landscaping Materials'];
    
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
   * Determine pricing tier for segmentation
   */
  private getPricingTier(price: number): string {
    if (price < 30) return 'Budget';
    if (price < 60) return 'Standard';
    if (price < 100) return 'Premium';
    return 'Specialty';
  }

  /**
   * Generate XML feed format for Google Merchant Center with US restrictions
   */
  async generateXMLFeed(): Promise<string> {
    const products = await this.generateFeed();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
    xml += '<channel>\n';
    xml += `<title>${this.brandName} Continental US Product Feed</title>\n`;
    xml += `<link>${this.baseUrl}</link>\n`;
    xml += '<description>Premium landscaping materials with bulk delivery - Continental US only</description>\n';
    
    products.forEach(product => {
      xml += '<item>\n';
      xml += `<g:id>${this.escapeXml(product.id)}</g:id>\n`;
      xml += `<g:title>${this.escapeXml(product.title)}</g:title>\n`;
      xml += `<g:description>${this.escapeXml(product.description)}</g:description>\n`;
      xml += `<g:link>${this.escapeXml(product.link)}</g:link>\n`;
      
      // Add mobile link if available
      if (product.mobile_link) {
        xml += `<g:mobile_link>${this.escapeXml(product.mobile_link)}</g:mobile_link>\n`;
      }
      
      xml += `<g:image_link>${this.escapeXml(product.image_link)}</g:image_link>\n`;
      
      // Add additional image if available
      if (product.additional_image_link) {
        xml += `<g:additional_image_link>${this.escapeXml(product.additional_image_link)}</g:additional_image_link>\n`;
      }
      
      xml += `<g:condition>${product.condition}</g:condition>\n`;
      xml += `<g:availability>${product.availability}</g:availability>\n`;
      xml += `<g:price>${product.price}</g:price>\n`;
      
      // Add sale price information if available
      if (product.sale_price) {
        xml += `<g:sale_price>${product.sale_price}</g:sale_price>\n`;
      }
      if (product.sale_price_effective_date) {
        xml += `<g:sale_price_effective_date>${product.sale_price_effective_date}</g:sale_price_effective_date>\n`;
      }
      
      xml += `<g:brand>${this.escapeXml(product.brand)}</g:brand>\n`;
      xml += `<g:product_type>${this.escapeXml(product.product_type)}</g:product_type>\n`;
      xml += `<g:google_product_category>${product.google_product_category}</g:google_product_category>\n`;
      xml += `<g:shipping>${this.escapeXml(product.shipping)}</g:shipping>\n`;
      xml += `<g:shipping_label>${this.escapeXml(product.shipping_label)}</g:shipping_label>\n`;
      xml += `<g:custom_label_0>${this.escapeXml(product.custom_label_0 || '')}</g:custom_label_0>\n`;
      xml += `<g:custom_label_1>${this.escapeXml(product.custom_label_1 || '')}</g:custom_label_1>\n`;
      xml += `<g:custom_label_2>${this.escapeXml(product.custom_label_2 || '')}</g:custom_label_2>\n`;
      xml += `<g:custom_label_3>${this.escapeXml(product.custom_label_3 || '')}</g:custom_label_3>\n`;
      xml += `<g:custom_label_4>${this.escapeXml(product.custom_label_4 || '')}</g:custom_label_4>\n`;
      xml += `<g:included_destination>${this.escapeXml(product.included_destination)}</g:included_destination>\n`;
      xml += `<g:excluded_destination>${this.escapeXml(product.excluded_destination)}</g:excluded_destination>\n`;
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
