
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductWithLocations, Location, ZipCodeValidationResult, PriceTier, ZipCodeData } from './productTypes';

// Define a constant for the products table name
const PRODUCTS_TABLE = 'products';

// Define a constant for the locations table name
const LOCATIONS_TABLE = 'delivery_locations';

// Define a constant for the service_areas table name
const SERVICE_AREAS_TABLE = 'service_zip_codes';

/**
 * Gets all products from the database
 * @returns Array of products
 */
export async function getProducts(forceRefresh = false): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    // Map database columns to Product interface
    const products = (data || []).map(item => {
      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: Number(item.price) || 0,
        image: item.image || '',
        category: (item.category as Product['category']) || 'gravel',
        slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
        tonYardRatio: Number(item.ton_yard_ratio) || 1.5,
        subtype: item.subtype as Product['subtype'],
        size: item.size as Product['size'],
        color: item.color as Product['color']
      } as Product;
    });

    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * Gets a product from the database by slug
 * @param slug The slug of the product to get
 * @returns The product, or null if not found
 */
export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    if (!data) return null;

    // Map database row to Product interface
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: data.image || '',
      category: (data.category as Product['category']) || 'gravel',
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      tonYardRatio: Number(data.ton_yard_ratio) || 1.5,
      subtype: data.subtype as Product['subtype'],
      size: data.size as Product['size'],
      color: data.color as Product['color']
    };

    return product;
  } catch (error) {
    console.error('Failed to get product:', error);
    return null;
  }
}

/**
 * Gets a product from the database by slug
 * @param slug The slug of the product to get
 * @returns The product, or null if not found
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    if (!data) return null;

    // Map database row to Product interface
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: data.image || '',
      category: (data.category as Product['category']) || 'gravel',
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      tonYardRatio: Number(data.ton_yard_ratio) || 1.5,
      subtype: data.subtype as Product['subtype'],
      size: data.size as Product['size'],
      color: data.color as Product['color']
    };

    return product;
  } catch (error) {
    console.error('Failed to get product:', error);
    return null;
  }
}

/**
 * Gets a product from the database by ID
 * @param id The ID of the product to get
 * @returns The product, or null if not found
 */
export async function getProductById(id: string | number): Promise<Product | null> {
  try {
    const productId = typeof id === 'string' ? id : id.toString();
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    if (!data) return null;

    // Map database row to Product interface
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: data.image || '',
      category: (data.category as Product['category']) || 'gravel',
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      tonYardRatio: Number(data.ton_yard_ratio) || 1.5,
      subtype: data.subtype as Product['subtype'],
      size: data.size as Product['size'],
      color: data.color as Product['color']
    };

    return product;
  } catch (error) {
    console.error('Failed to get product:', error);
    return null;
  }
}

/**
 * Gets all products with their locations from the database
 * @returns Array of products with locations
 */
export async function getProductsWithLocations(): Promise<ProductWithLocations[]> {
  try {
    const { data: products, error: productsError } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return [];
    }

    const { data: locations, error: locationsError } = await supabase
      .from(LOCATIONS_TABLE)
      .select('*');

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return [];
    }

    // Map database rows to ProductWithLocations interface
    const productsWithLocations = (products || []).map(product => {
      // Convert each product to the correct interface
      const mappedProduct: Product = {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: Number(product.price) || 0,
        image: product.image || '',
        category: (product.category as Product['category']) || 'gravel',
        slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
        tonYardRatio: Number(product.ton_yard_ratio) || 1.5,
        subtype: product.subtype as Product['subtype'],
        size: product.size as Product['size'],
        color: product.color as Product['color']
      };

      // Filter and map locations for this product
      const productLocations = (locations || [])
        .filter(location => location.product_id === product.id)
        .map(location => ({
          id: location.id,
          name: location.name || '',
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          zip: location.zip || '',
          lat: Number(location.lat) || 0,
          lng: Number(location.lng) || 0,
          product_id: location.product_id
        }));

      return {
        ...mappedProduct,
        locations: productLocations
      };
    });

    return productsWithLocations;
  } catch (error) {
    console.error('Failed to get products with locations:', error);
    return [];
  }
}

/**
 * Gets all locations from the database
 * @returns Array of locations
 */
export async function getLocations(): Promise<Location[]> {
  try {
    const { data, error } = await supabase
      .from(LOCATIONS_TABLE)
      .select('*');

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    // Map database rows to Location interface
    return (data || []).map(item => ({
      id: item.id,
      name: item.name || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      zip: item.zip || '',
      lat: Number(item.lat) || 0,
      lng: Number(item.lng) || 0,
      product_id: item.product_id
    }));
  } catch (error) {
    console.error('Failed to get locations:', error);
    return [];
  }
}

/**
 * Gets a location from the database by ID
 * @param id The ID of the location to get
 * @returns The location, or null if not found
 */
export async function getLocation(id: string): Promise<Location | null> {
  try {
    const { data, error } = await supabase
      .from(LOCATIONS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      product_id: data.product_id
    };
  } catch (error) {
    console.error('Failed to get location:', error);
    return null;
  }
}

/**
 * Gets all unique categories from the products table
 * @returns Array of unique categories
 */
export async function getUniqueCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('category')
      .neq('category', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    // Extract categories and filter out any null or undefined values
    const categories = (data || [])
      .map(item => item.category)
      .filter(category => category !== null && category !== undefined) as string[];

    // Return unique categories
    return [...new Set(categories)];
  } catch (error) {
    console.error('Failed to get unique categories:', error);
    return [];
  }
}

/**
 * Gets all service areas from the database for a specific state
 * @param state The state to get service areas for
 * @returns Array of service areas
 */
export async function getServiceAreasByState(state?: string): Promise<Record<string, ZipCodeData[]>> {
  try {
    let query = supabase
      .from(SERVICE_AREAS_TABLE)
      .select('*');
      
    if (state) {
      query = query.eq('state_id', state);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching service areas:', error);
      return {};
    }
    
    // Group by state
    const groupedByState: Record<string, ZipCodeData[]> = {};
    
    (data || []).forEach(zipData => {
      const state = zipData.state_id;
      if (!groupedByState[state]) {
        groupedByState[state] = [];
      }
      
      groupedByState[state].push({
        zip: zipData.zip,
        lat: zipData.lat,
        lng: zipData.lng,
        city: zipData.city,
        state_id: zipData.state_id,
        state_name: zipData.state_name,
        population: zipData.population,
        density: zipData.density,
        county_fips: zipData.county_fips,
        county_name: zipData.county_name,
        county_names_all: zipData.county_names_all,
        county_fips_all: zipData.county_fips_all,
        timezone: zipData.timezone
      });
    });

    return groupedByState;
  } catch (error) {
    console.error('Failed to get service areas:', error);
    return {};
  }
}

/**
 * Validates a ZIP code and returns whether it is in the service area
 * @param zipCode The ZIP code to validate
 * @returns Object with boolean flag for whether the ZIP code is in the service area
 */
export async function validateZipCode(zipCode: string): Promise<ZipCodeValidationResult> {
  try {
    // Use the validate_zip_code RPC function - fix the type issue with a cast
    const { data, error } = await supabase
      .rpc('validate_zip_code', { zip_code: zipCode }) as unknown as {
        data: Array<{ in_service_area: boolean, price_adjustment: number }> | null,
        error: Error | null
      };

    if (error) {
      console.error('Error validating ZIP code:', error);
      return { inServiceArea: false };
    }

    // Check if data is not null and has the 'in_service_area' property
    if (data && data.length > 0) {
      return {
        inServiceArea: Boolean(data[0].in_service_area),
        priceAdjustment: Number(data[0].price_adjustment || 0)
      };
    } else {
      // If no data is returned, assume the ZIP code is not in the service area
      return { inServiceArea: false };
    }
  } catch (error) {
    console.error('Failed to validate ZIP code:', error);
    return { inServiceArea: false };
  }
}

/**
 * Gets the price adjustment for a specific ZIP code
 * @param zipCode The ZIP code to get the price adjustment for
 * @returns The price adjustment, or 0 if not found
 */
export async function getPriceAdjustmentForZipCode(zipCode: string): Promise<number> {
  try {
    // Fix the type issue with a cast
    const { data, error } = await supabase
      .rpc('validate_zip_code', { zip_code: zipCode }) as unknown as {
        data: Array<{ price_adjustment: number }> | null,
        error: Error | null
      };

    if (error) {
      console.error('Error validating ZIP code:', error);
      return 0;
    }

    // Check if data is not null and has the 'price_adjustment' property
    if (data && data.length > 0 && data[0].price_adjustment !== null) {
      return Number(data[0].price_adjustment || 0);
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Failed to get price adjustment:', error);
    return 0;
  }
}

/**
 * Applies a price adjustment to a product price
 * @param price The original price of the product
 * @param priceAdjustment The price adjustment to apply
 * @returns The adjusted price
 */
export function applyZipCodeAdjustment(price: number, priceAdjustment: number): number {
  return +(price + priceAdjustment).toFixed(2);
}

/**
 * Gets price tiers for a specific product
 * @param productId The product ID to get price tiers for
 * @returns Array of price tiers
 */
export async function getPriceTiers(productId: string | number): Promise<PriceTier[]> {
  try {
    // First check if the price_tiers table exists
    // Fix the type issue with a cast
    const { data: tables, error: tableError } = await supabase
      .rpc('get_tables') as unknown as {
        data: Array<{ table_name: string }> | null,
        error: Error | null
      };
      
    if (tableError) {
      console.error('Error checking tables:', tableError);
      return [];
    }
    
    const hasPriceTiersTable = tables && tables.some((t) => t.table_name === 'price_tiers');
    
    // If price_tiers table exists, query it
    if (hasPriceTiersTable) {
      const productIdStr = productId.toString();
      
      // Use a cast to fix the TypeScript error
      const { data, error } = await supabase
        .from('price_tiers')
        .select('*')
        .eq('product_id', productIdStr)
        .order('min_tons', { ascending: true });
        
      if (error) {
        console.error('Error fetching price tiers:', error);
        return [];
      }
      
      return (data || []) as PriceTier[];
    }
    
    // If table doesn't exist, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching price tiers:', error);
    return [];
  }
}

/**
 * Gets the appropriate multiplier for a given quantity based on price tiers
 * @param priceTiers The price tiers to use
 * @param quantity The quantity to get the multiplier for
 * @returns The multiplier for the given quantity
 */
export function getMultiplierForTons(priceTiers: PriceTier[], quantity: number): number {
  if (!priceTiers || priceTiers.length === 0) {
    return 1.0; // Default multiplier if no tiers
  }

  // Sort tiers in descending order of min_tons
  const sortedTiers = [...priceTiers].sort((a, b) => b.min_tons - a.min_tons);

  for (const tier of sortedTiers) {
    if (quantity >= tier.min_tons && (tier.max_tons === null || quantity <= tier.max_tons)) {
      return tier.multiplier;
    }
  }

  return 1.0; // Default multiplier if no tier matches
}
