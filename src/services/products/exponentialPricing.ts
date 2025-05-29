
import { Product } from './types';

/**
 * Calculate price using exponential pricing model
 * Formula: price = basePrice * (a + b * e^(-c * quantity))
 * 
 * @param basePrice The base price per ton
 * @param quantity The quantity in tons
 * @param a The asymptotic minimum multiplier (default: 0.8)
 * @param b The initial premium multiplier (default: 0.4)
 * @param c The decay rate (default: 0.1)
 * @returns The calculated price per ton
 */
export function calculateExponentialPrice(
  basePrice: number,
  quantity: number,
  a: number = 0.8,
  b: number = 0.4,
  c: number = 0.1
): number {
  // Ensure quantity is at least 1 to avoid division issues
  const safeQuantity = Math.max(1, quantity);
  
  // Calculate the exponential multiplier
  const multiplier = a + b * Math.exp(-c * safeQuantity);
  
  // Calculate the final price per ton
  const pricePerTon = basePrice * multiplier;
  
  // Round to 2 decimal places
  return Math.round(pricePerTon * 100) / 100;
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
    a: product.pricing_a ?? 0.8,  // Asymptotic minimum (80% of base price for large orders)
    b: product.pricing_b ?? 0.4,  // Initial premium (40% premium for small orders)
    c: product.pricing_c ?? 0.1   // Decay rate (how quickly price decreases with quantity)
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
  
  // Calculate multiplier
  const multiplier = a + b * Math.exp(-c * safeQuantity);
  
  // Calculate prices
  const pricePerTon = calculateExponentialPrice(product.price, quantity, a, b, c);
  const totalPrice = Math.round(pricePerTon * quantity * 100) / 100;
  
  return {
    basePrice: product.price,
    multiplier: Math.round(multiplier * 100) / 100,
    pricePerTon,
    totalPrice
  };
}
