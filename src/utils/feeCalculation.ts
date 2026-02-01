// Fee Calculation Utility - Additive fee model for market landing pages

export interface FeeCalculationInput {
  baseTons: number;
  pricePerTon: number;
  expediteEnabled: boolean;
  saturdayEnabled: boolean;
  expediteFeePct?: number; // default 0.15 (15%)
  saturdayFeePct?: number; // default 0.15 (15%)
}

export interface FeeCalculationResult {
  baseTotal: number;
  expediteFeeAmount: number;
  saturdayFeeAmount: number;
  totalWithFees: number;
  multiplier: number;
  breakdown: {
    base: number;
    expedite: number;
    saturday: number;
    total: number;
  };
}

/**
 * Calculate total price with additive fees (NOT compounding)
 * 
 * With both expedite + saturday at 15% each:
 * - ADDITIVE: 1 + 0.15 + 0.15 = 1.30 (30% total)
 * - NOT compounding: 1.15 * 1.15 = 1.3225 (32.25%)
 */
export const calculateTotalWithFees = (input: FeeCalculationInput): FeeCalculationResult => {
  const expediteFeePct = input.expediteFeePct ?? 0.15;
  const saturdayFeePct = input.saturdayFeePct ?? 0.15;

  const baseTotal = input.baseTons * input.pricePerTon;

  // ADDITIVE fee calculation
  let multiplier = 1;
  if (input.expediteEnabled) multiplier += expediteFeePct;
  if (input.saturdayEnabled) multiplier += saturdayFeePct;

  const expediteFeeAmount = input.expediteEnabled ? baseTotal * expediteFeePct : 0;
  const saturdayFeeAmount = input.saturdayEnabled ? baseTotal * saturdayFeePct : 0;

  return {
    baseTotal,
    expediteFeeAmount,
    saturdayFeeAmount,
    totalWithFees: baseTotal * multiplier,
    multiplier,
    breakdown: {
      base: baseTotal,
      expedite: expediteFeeAmount,
      saturday: saturdayFeeAmount,
      total: baseTotal * multiplier
    }
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (pct: number): string => {
  return `${Math.round(pct * 100)}%`;
};
