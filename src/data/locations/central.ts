
import { DeliveryLocation, generateLocationSlug } from '@/types/location.types';

export const centralLocations: DeliveryLocation[] = [
  {
    city: "Kansas City",
    state: "MO",
    product_name: "Heartland Rock",
    lat: 39.0997,
    lng: -94.5786,
    slug: generateLocationSlug("Kansas City", "MO")
  },
  {
    city: "Omaha",
    state: "NE",
    product_name: "Prairie Gravel",
    lat: 41.2565,
    lng: -95.9345,
    slug: generateLocationSlug("Omaha", "NE")
  },
  {
    city: "Des Moines",
    state: "IA",
    product_name: "Field Stone",
    lat: 41.5868,
    lng: -93.6250,
    slug: generateLocationSlug("Des Moines", "IA")
  }
];
