
import { GoogleShoppingProduct } from './feedGenerator';
import { isContinentalUSState } from './usTargeting';

export interface MerchantCenterConfig {
  merchantId: string;
  accessToken: string;
  developerId?: string;
}

export interface ProductStatus {
  productId: string;
  status: 'approved' | 'disapproved' | 'pending';
  issues?: Array<{
    code: string;
    description: string;
    severity: 'error' | 'warning';
  }>;
  lastUpdated: string;
}

export class GoogleMerchantCenterAPI {
  private config: MerchantCenterConfig;
  private baseUrl = 'https://shoppingcontent.googleapis.com/content/v2.1';

  constructor(config: MerchantCenterConfig) {
    this.config = config;
  }

  /**
   * Upload product to Google Merchant Center with US restrictions
   */
  async uploadProduct(product: GoogleShoppingProduct): Promise<any> {
    const url = `${this.baseUrl}/${this.config.merchantId}/products`;
    
    const requestBody = {
      offerId: product.id,
      title: product.title,
      description: product.description,
      link: product.link,
      imageLink: product.image_link,
      condition: product.condition,
      availability: product.availability,
      price: {
        value: parseFloat(product.price.replace(' USD', '')),
        currency: 'USD'
      },
      brand: product.brand,
      productTypes: [product.product_type],
      googleProductCategory: product.google_product_category,
      shippingWeight: {
        value: parseFloat(product.shipping_weight.replace(' lb', '')),
        unit: 'lb'
      },
      // US-specific shipping configuration
      shipping: [{
        country: 'US',
        service: 'Continental US Delivery',
        price: {
          value: 0,
          currency: 'USD'
        },
        minTransitTime: '1',
        maxTransitTime: '3'
      }],
      shippingLabel: product.shipping_label,
      customLabel0: product.custom_label_0,
      customLabel1: product.custom_label_1,
      customLabel2: product.custom_label_2,
      customLabel3: product.custom_label_3,
      customLabel4: product.custom_label_4,
      // Explicit destination targeting
      includedDestinations: ['Shopping'],
      excludedDestinations: ['Display'],
      channel: 'online',
      contentLanguage: 'en',
      targetCountry: 'US'
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload product: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading product to Merchant Center:', error);
      if (error instanceof Error && error.message.includes('400')) {
        console.error('API Request Body:', JSON.stringify(requestBody, null, 2));
      }
      throw error;
    }
  }

  /**
   * Batch upload multiple products with US restrictions
   */
  async batchUploadProducts(products: GoogleShoppingProduct[]): Promise<any> {
    const url = `${this.baseUrl}/products/batch`;
    
    const entries = products.map((product, index) => ({
      batchId: index,
      merchantId: this.config.merchantId,
      method: 'insert',
      product: {
        offerId: product.id,
        title: product.title,
        description: product.description,
        link: product.link,
        imageLink: product.image_link,
        condition: product.condition,
        availability: product.availability,
        price: {
          value: parseFloat(product.price.replace(' USD', '')),
          currency: 'USD'
        },
        brand: product.brand,
        productTypes: [product.product_type],
        googleProductCategory: product.google_product_category,
        shippingWeight: {
          value: parseFloat(product.shipping_weight.replace(' lb', '')),
          unit: 'lb'
        },
        // US-specific shipping configuration
        shipping: [{
          country: 'US',
          service: 'Continental US Delivery',
          price: {
            value: 0,
            currency: 'USD'
          },
          minTransitTime: '1',
          maxTransitTime: '3'
        }],
        shippingLabel: product.shipping_label,
        customLabel0: product.custom_label_0,
        customLabel1: product.custom_label_1,
        customLabel2: product.custom_label_2,
        customLabel3: product.custom_label_3,
        customLabel4: product.custom_label_4,
        includedDestinations: ['Shopping'],
        excludedDestinations: ['Display'],
        channel: 'online',
        contentLanguage: 'en',
        targetCountry: 'US'
      }
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entries })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to batch upload products: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error batch uploading products to Merchant Center:', error);
      if (error instanceof Error && error.message.includes('400')) {
        console.error('API Request Body:', JSON.stringify({ entries }, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get product status from Google Merchant Center
   */
  async getProductStatus(productId: string): Promise<ProductStatus> {
    const url = `${this.baseUrl}/${this.config.merchantId}/products/${productId}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get product status: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        productId: data.offerId,
        status: data.issues && data.issues.length > 0 ? 'disapproved' : 'approved',
        issues: data.issues || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting product status:', error);
      throw error;
    }
  }

  /**
   * Get all product statuses
   */
  async getAllProductStatuses(): Promise<ProductStatus[]> {
    const url = `${this.baseUrl}/${this.config.merchantId}/productstatuses`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get product statuses: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.resources?.map((item: any) => ({
        productId: item.productId,
        status: item.destinationStatuses?.[0]?.status || 'pending',
        issues: item.itemLevelIssues || [],
        lastUpdated: item.lastUpdateDate || new Date().toISOString()
      })) || [];
    } catch (error) {
      console.error('Error getting product statuses:', error);
      throw error;
    }
  }

  /**
   * Delete product from Google Merchant Center
   */
  async deleteProduct(productId: string): Promise<void> {
    const url = `${this.baseUrl}/${this.config.merchantId}/products/${productId}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting product from Merchant Center:', error);
      throw error;
    }
  }
}
