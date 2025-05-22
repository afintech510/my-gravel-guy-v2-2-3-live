
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductWithLocations, Location, ZipCodeValidationResult, PriceTier, ZipCodeData } from './productTypes';

// Define a constant for the products table name
const PRODUCTS_TABLE = 'products';

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

    // Transform the raw data to match the Product interface
    const products: Product[] = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      image: item.image || '',
      images: item.images || [item.image || ''].filter(Boolean),
      category: (item.category as Product['category']) || 'gravel',
      slug: item.slug || '',
      tonYardRatio: Number(item.ton_yard_ratio) || 1.5,
      subtype: item.subtype as Product['subtype'],
      size: item.size as Product['size'],
      color: item.color as Product['color'],
      specifications: item.specifications,
      uses: item.uses,
      faqs: item.faqs
    }));

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
    
    // Transform the raw data to match the Product interface
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: data.image || '',
      images: data.images || [data.image || ''].filter(Boolean),
      category: (data.category as Product['category']) || 'gravel',
      slug: data.slug || '',
      tonYardRatio: Number(data.ton_yard_ratio) || 1.5,
      subtype: data.subtype as Product['subtype'],
      size: data.size as Product['size'],
      color: data.color as Product['color'],
      specifications: data.specifications,
      uses: data.uses,
      faqs: data.faqs
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
    
    // Transform the raw data to match the Product interface
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: data.image || '',
      images: data.images || [data.image || ''].filter(Boolean),
      category: (data.category as Product['category']) || 'gravel',
      slug: data.slug || '',
      tonYardRatio: Number(data.ton_yard_ratio) || 1.5,
      subtype: data.subtype as Product['subtype'],
      size: data.size as Product['size'],
      color: data.color as Product['color'],
      specifications: data.specifications,
      uses: data.uses,
      faqs: data.faqs
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
    
    // Transform the raw data to match the Product interface
    const product: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: data.image || '',
      images: data.images || [data.image || ''].filter(Boolean),
      category: (data.category as Product['category']) || 'gravel',
      slug: data.slug || '',
      tonYardRatio: Number(data.ton_yard_ratio) || 1.5,
      subtype: data.subtype as Product['subtype'],
      size: data.size as Product['size'],
      color: data.color as Product['color'],
      specifications: data.specifications,
      uses: data.uses,
      faqs: data.faqs
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

    // Get locations from the delivery_locations table instead
    const { data: locations, error: locationsError } = await supabase
      .from('delivery_locations')
      .select('*');

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return [];
    }

    // Transform the raw data to match the Product interface
    const transformedProducts: Product[] = (products || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      image: item.image || '',
      images: item.images || [item.image || ''].filter(Boolean),
      category: (item.category as Product['category']) || 'gravel',
      slug: item.slug || '',
      tonYardRatio: Number(item.ton_yard_ratio) || 1.5,
      subtype: item.subtype as Product['subtype'],
      size: item.size as Product['size'],
      color: item.color as Product['color'],
      specifications: item.specifications,
      uses: item.uses,
      faqs: item.faqs
    }));

    // Transform the raw location data
    const transformedLocations: Location[] = (locations || []).map(item => ({
      id: item.id,
      product_id: item.product_id || '',
      product_name: item.product_name || item.title || '',
      title: item.title || '',
      description: item.description || '',
      lat: Number(item.lat) || 0,
      lng: Number(item.lng) || 0,
      city: item.city || '',
      state: item.state || '',
      region: item.region || '',
      slug: item.slug || '',
      created_at: item.created_at || ''
    }));

    const productsWithLocations: ProductWithLocations[] = transformedProducts.map(product => ({
      ...product,
      locations: transformedLocations.filter(location => location.product_id === product.id.toString())
    }));

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
    // Use delivery_locations table instead
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('*');

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    // Transform the raw location data
    const transformedLocations: Location[] = (data || []).map(item => ({
      id: item.id,
      product_id: item.product_id || '',
      product_name: item.product_name || item.title || '',
      title: item.title || '',
      description: item.description || '',
      lat: Number(item.lat) || 0,
      lng: Number(item.lng) || 0,
      city: item.city || '',
      state: item.state || '',
      region: item.region || '',
      slug: item.slug || '',
      created_at: item.created_at || ''
    }));

    return transformedLocations;
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
    // Use delivery_locations table instead
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return null;
    }

    if (!data) return null;

    // Transform the raw location data
    const location: Location = {
      id: data.id,
      product_id: data.product_id || '',
      product_name: data.product_name || data.title || '',
      title: data.title || '',
      description: data.description || '',
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      city: data.city || '',
      state: data.state || '',
      region: data.region || '',
      slug: data.slug || '',
      created_at: data.created_at || ''
    };

    return location;
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
 * Gets all service areas from the database grouped by state
 * @returns Record of service areas by state
 */
export async function getServiceAreasByState(): Promise<Record<string, ZipCodeData[]>> {
  try {
    const { data, error } = await supabase
      .from('service_zip_codes')
      .select('*')
      .order('state_id', { ascending: true });

    if (error) {
      console.error('Error fetching service areas:', error);
      return {};
    }

    // Group zip codes by state
    const zipsByState: Record<string, ZipCodeData[]> = {};
    
    (data || []).forEach(zipData => {
      const zipCodeData: ZipCodeData = {
        zip: zipData.zip || '',
        lat: Number(zipData.lat) || 0,
        lng: Number(zipData.lng) || 0,
        city: zipData.city || '',
        state_id: zipData.state_id || '',
        state_name: zipData.state_name || '',
        population: Number(zipData.population) || 0,
        density: Number(zipData.density) || 0,
        county_fips: zipData.county_fips || '',
        county_name: zipData.county_name || '',
        county_names_all: zipData.county_names_all || '',
        county_fips_all: zipData.county_fips_all || '',
        timezone: zipData.timezone || ''
      };
      
      const state = zipData.state_id || 'Unknown';
      if (!zipsByState[state]) {
        zipsByState[state] = [];
      }
      zipsByState[state].push(zipCodeData);
    });

    return zipsByState;
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
    // Use the validate_zip_code RPC function
    const { data, error } = await supabase
      .rpc('validate_zip_code', { zip_code: zipCode });

    if (error) {
      console.error('Error validating ZIP code:', error);
      return { inServiceArea: false };
    }

    // Check if data is not null and has the 'in_service_area' property
    if (data && data[0]) {
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
    // Use validate_zip_code RPC function
    const { data, error } = await supabase
      .rpc('validate_zip_code', { zip_code: zipCode });

    if (error) {
      console.error('Error validating ZIP code:', error);
      return 0;
    }

    // Check if data is not null and has the 'price_adjustment' property
    if (data && data[0] && data[0].price_adjustment !== null) {
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
    const { data: tables, error: tableError } = await supabase
      .rpc('get_tables');
      
    if (tableError) {
      console.error('Error checking tables:', tableError);
      return [];
    }
    
    const hasPriceTiersTable = tables && tables.some((t: any) => t.table_name === 'price_tiers');
    
    // If price_tiers table exists, query it
    if (hasPriceTiersTable) {
      const productIdStr = productId.toString();
      
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
