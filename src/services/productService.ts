
import { fetchSheetData } from "../utils/googleSheets";
import { Product } from './productTypes';
import { getPriceAdjustmentForZipCode } from './zipCodeService';

// In-memory cache configuration
let productsCache: Product[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// The Google Sheet ID from your URL
const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";

/**
 * Fetch products from Google Sheets
 */
export async function getProducts(): Promise<Product[]> {
  if (productsCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return productsCache;
  }

  try {
    console.log('Fetching products from Google Sheets...');
    const rawProducts = await fetchSheetData(SHEET_ID, "Products");
    
    const products: Product[] = rawProducts.map((row, index) => ({
      id: index + 1,
      name: row.name || `Product ${index + 1}`,
      description: row.description || "",
      price: parseFloat(row.price) || 0,
      image: row.image || "/placeholder.svg",
      category: (row.category as 'gravel' | 'sand' | 'dirt') || 'gravel',
      tonYardRatio: parseFloat(row.tonYardRatio) || 1.5,
      slug: row.slug || row.name?.toLowerCase().replace(/\s+/g, '-') || `product-${index + 1}`,
      specifications: {
        density: row.density || "",
        size: row.size || "",
        color: row.color || "",
        coverage: row.coverage || ""
      },
      uses: row.uses ? row.uses.split(',').map((use: string) => use.trim()) : [],
      faqs: []
    }));
    
    productsCache = products;
    lastFetchTimestamp = Date.now();
    
    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return productsCache || [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: number): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find(p => p.id === id);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  const products = await getProducts();
  const product = products.find(p => p.slug === slug);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product;
}

/**
 * Validate ZIP code and check service availability
 */
export async function validateZipCode(zipCode: string): Promise<{
  valid: boolean;
  inServiceArea: boolean;
  zipData?: import('./zipCodeService').ZipCodeData;
  priceAdjustment?: number;
}> {
  try {
    const priceAdjustment = await getPriceAdjustmentForZipCode(zipCode);
    const inPricingTable = priceAdjustment !== 0 || zipCode === "00000";
    
    const { getZipCodes } = await import('./zipCodeService');
    const allZipCodes = await getZipCodes();
    const zipData = allZipCodes.find(z => z.zip === zipCode);
    
    const valid = !!zipData;
    const inServiceArea = inPricingTable;
    
    return {
      valid,
      inServiceArea,
      zipData,
      priceAdjustment: inServiceArea ? priceAdjustment : undefined
    };
  } catch (error) {
    console.error("Error validating ZIP code:", error);
    return {
      valid: false,
      inServiceArea: false
    };
  }
}

