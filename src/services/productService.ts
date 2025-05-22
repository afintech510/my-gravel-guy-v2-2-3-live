import { supabase } from '@/integrations/supabase/client';
import { Product, ProductWithLocations, Location, ZipCodeValidationResult, PriceTier } from './productTypes';

const PRODUCTS_TABLE = 'products';
const LOCATIONS_TABLE = 'locations';

/**
 * Gets all products from the database
 * @returns Array of products
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * Gets a single product from the database by its slug
 * @param slug The product slug
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

    return data;
  } catch (error) {
    console.error('Failed to get product:', error);
    return null;
  }
}

/**
 * Gets a single product from the database by its ID
 * @param id The product ID
 * @returns The product, or null if not found
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
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
      .select('*')
      .order('created_at', { ascending: false });

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

    // Combine products and locations
    const productsWithLocations = products.map((product: any) => ({
      ...product,
      locations: locations.filter((location: any) => location.product_id === product.id),
    }));

    return productsWithLocations || [];
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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get locations:', error);
    return [];
  }
}

/**
 * Gets a single location from the database by its slug
 * @param slug The location slug
 * @returns The location, or null if not found
 */
export async function getLocation(slug: string): Promise<Location | null> {
  try {
    const { data, error } = await supabase
      .from(LOCATIONS_TABLE)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get location:', error);
    return null;
  }
}

/**
 * Validates a ZIP code and returns whether it is in the service area
 * @param zipCode The ZIP code to validate
 * @returns Object with boolean flag for whether the ZIP code is in the service area
 */
export async function validateZipCode(zipCode: string): Promise<ZipCodeValidationResult> {
  try {
    // Use the validate_zip_code RPC function
    const { data, error } = await supabase
      .rpc('validate_zip_code', { zip_code: zipCode })
      .select('*');

    if (error) {
      console.error('Error validating ZIP code:', error);
      return { inServiceArea: false };
    }

    // Check if data is not null and has the 'in_service_area' property
    if (data && data.length > 0) {
      return {
        inServiceArea: data[0].in_service_area,
        priceAdjustment: data[0].price_adjustment
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
    // Use the validate_zip_code RPC function
    const { data, error } = await supabase
      .rpc('validate_zip_code', { zip_code: zipCode })
      .select('*');

    if (error) {
      console.error('Error validating ZIP code:', error);
      return 0;
    }

    // Check if data is not null and has the 'price_adjustment' property
    if (data && data.length > 0 && data[0].price_adjustment !== null) {
      return data[0].price_adjustment;
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
 * @param price The product price
 * @param adjustment The price adjustment
 * @returns The adjusted price
 */
export function applyZipCodeAdjustment(price: number, adjustment: number): number {
  const adjustmentFactor = 1 + (adjustment / 100);
  return +(price * adjustmentFactor).toFixed(2);
}

/**
 * Gets price tiers for a specific product
 * @param productId The product ID to get price tiers for
 * @returns Array of price tiers
 */
export async function getPriceTiers(productId: string | number): Promise<PriceTier[]> {
  try {
    // First check if the price_tiers table exists
    // Instead of trying to query directly, first check if table exists
    // by getting its schema/definition
    const { data: tables, error: tableError } = await supabase
      .rpc('get_tables' as any)
      .select('*');
      
    if (tableError) {
      console.error('Error checking tables:', tableError);
      return [];
    }
    
    const hasPriceTiersTable = tables && tables.some((t: any) => t.table_name === 'price_tiers');
    
    // If price_tiers table exists, query it using type assertion
    if (hasPriceTiersTable) {
      const productIdStr = productId.toString();
      
      // Use type assertion to fix the TypeScript error
      const { data, error } = await supabase
        .from('price_tiers' as any)
        .select('*')
        .eq('product_id', productIdStr)
        .order('min_tons', { ascending: true });
        
      if (error) {
        console.error('Error fetching price tiers:', error);
        return [];
      }
      
      return data || [];
    }
    
    // If table doesn't exist, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching price tiers:', error);
    return [];
  }
}

/**
 * Gets the price multiplier to use for a specific quantity of tons
 * @param priceTiers Array of price tiers
 * @param tons The number of tons to get a multiplier for
 * @returns Price multiplier (0-1.0)
 */
export function getMultiplierForTons(priceTiers: PriceTier[], tons: number): number {
  // If no tiers, return standard price (multiplier = 1)
  if (!priceTiers || priceTiers.length === 0) {
    return 1.0;
  }
  
  // Find applicable tier
  const applicableTier = priceTiers.find(tier => {
    return tons >= tier.min_tons && (tier.max_tons === null || tons <= tier.max_tons);
  });
  
  // Return tier multiplier if found, otherwise standard price
  return applicableTier ? applicableTier.multiplier : 1.0;
}
