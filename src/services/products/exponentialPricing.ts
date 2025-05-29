
import { Product } from './types';

/**
 * Calculate price using exponential pricing model
 * Formula: price = a * e^(b * quantity) + c
 * 
 * @param basePrice The base price per ton (used as fallback if no custom parameters)
 * @param quantity The quantity in tons
 * @param a The multiplier coefficient (default: 400)
 * @param b The exponential decay rate (default: -0.32)
 * @param c The base offset (default: 95)
 * @returns The calculated price per ton
 */
export function calculateExponentialPrice(
  basePrice: number,
  quantity: number,
  a: number = 400,
  b: number = -0.32,
  c: number = 95
): number {
  // Ensure quantity is at least 1 to avoid calculation issues
  const safeQuantity = Math.max(1, quantity);
  
  // Calculate using exponential formula: a * e^(b * quantity) + c
  const pricePerTon = a * Math.exp(b * safeQuantity) + c;
  
  // Ensure the price doesn't go below a reasonable minimum (use basePrice as fallback)
  const minimumPrice = Math.max(basePrice * 0.5, 50); // At least 50% of base price or $50
  const finalPrice = Math.max(pricePerTon, minimumPrice);
  
  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Get exponential pricing parameters for a product
 * Uses product-specific parameters if available, otherwise defaults
 */
export function getExponentialPricingParams(product: Product): {
  a: number;
  b: number;
  c: number;
} {
  return {
    a: product.pricing_a ?? 400,  // Multiplier coefficient
    b: product.pricing_b ?? -0.32, // Exponential decay rate
    c: product.pricing_c ?? 95    // Base offset
  };
}

/**
 * Calculate final price for a product with exponential pricing
 */
export function calculateProductExponentialPrice(
  product: Product,
  quantity: number
): {
  basePrice: number;
  multiplier: number;
  pricePerTon: number;
  totalPrice: number;
} {
  const { a, b, c } = getExponentialPricingParams(product);
  const safeQuantity = Math.max(1, quantity);
  
  // Calculate the exponential price
  const pricePerTon = calculateExponentialPrice(product.price, quantity, a, b, c);
  
  // Calculate multiplier compared to base price for display purposes
  const multiplier = pricePerTon / product.price;
  
  // Calculate total price
  const totalPrice = Math.round(pricePerTon * quantity * 100) / 100;
  
  return {
    basePrice: product.price,
    multiplier: Math.round(multiplier * 100) / 100,
    pricePerTon,
    totalPrice
  };
}
