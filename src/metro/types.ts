// Metro network types — a metro is a marketed area served by one or more
// fulfillment nodes (yards), split into delivery zones priced by drive distance.

export type CategorySlug = 'gravel' | 'mulch' | 'sand' | 'soil';

export type SellUnit = 'ton' | 'yd';

export interface MaterialVariant {
  slug: string;
  name: string;
  shortDescription: string;
  bestFor: string[];
  /** Node (wholesale) material price per sell unit, before delivery and premium */
  nodePricePerUnit: number;
  /** Swatch color used until real product photography is in place */
  swatch: string;
  popular?: boolean;
}

export interface MaterialCategory {
  slug: CategorySlug;
  name: string;
  tagline: string;
  unit: SellUnit;
  /** Tons per cubic yard — used to show the other unit and to size trucks */
  tonsPerYard: number;
  /** Default depth (inches) used by the coverage helper */
  defaultDepthIn: number;
  variants: MaterialVariant[];
}

export interface Truck {
  id: 'small' | 'medium' | 'large';
  name: string;
  /** Max payload for dense material (stone, sand, soil) in tons */
  capacityTons: number;
  /** Max volume in cubic yards (binding for light material like mulch) */
  capacityYards: number;
  /** Multiplier applied to the zone's base per-load delivery cost */
  deliveryCostFactor: number;
}

export interface DeliveryZone {
  slug: string;
  name: string;
  /** Node cost of one small-truck delivery load to this zone (USD) */
  loadCost: number;
  /** Minimum order in the category's sell unit */
  minUnits: number;
  zips: string[];
}

export interface FulfillmentNode {
  id: string;
  name: string;
  /** Public-facing description; partner names stay private until contracts are signed */
  publicLabel: string;
  /** Order cutoff for next-day delivery, 24h local time */
  cutoffHour: number;
  deliversSaturday: boolean;
}

export interface MetroTown {
  slug: string;
  name: string;
  zoneSlug: string;
  zip: string;
  /** Short, factual local note — only publish towns we actually deliver to */
  note: string;
}

export interface Metro {
  slug: string;
  name: string;
  shortName: string;
  state: string;
  timeZone: string;
  status: 'live' | 'pilot' | 'coming-soon';
  headline: string;
  subhead: string;
  /** Pricing inputs are placeholders until a node signs a price sheet */
  priceBookConfirmed: boolean;
  nodes: FulfillmentNode[];
  zones: DeliveryZone[];
  towns: MetroTown[];
  categories: MaterialCategory[];
  trucks: Truck[];
  pricing: {
    /** Premium applied over node cost (material + delivery) for the MGG experience */
    premiumRate: number;
    /** Discount on delivery cost for the 2nd+ load (ELM: additional loads at 75%) */
    additionalLoadDiscount: number;
    saturdayFeeRate: number;
    rushFeeRate: number;
    roundTo: number;
  };
  phone: string;
  phoneHref: string;
}

export type DeliverySpeed = 'standard' | 'rush';

export interface QuoteInput {
  metro: Metro;
  categorySlug: CategorySlug;
  variantSlug: string;
  quantity: number;
  zoneSlug: string;
  saturday?: boolean;
  speed?: DeliverySpeed;
}

export interface LoadPlanEntry {
  truck: Truck;
  quantity: number;
}

export interface QuoteResult {
  unit: SellUnit;
  quantity: number;
  loads: LoadPlanEntry[];
  materialCost: number;
  deliveryCost: number;
  premium: number;
  /** Everyday delivered price (material + delivery + premium), rounded */
  basePrice: number;
  saturdayFee: number;
  rushFee: number;
  total: number;
  pricePerUnit: number;
  belowMinimum: boolean;
  minUnits: number;
}
