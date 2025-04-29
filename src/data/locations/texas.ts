
import { DeliveryLocation, generateLocationSlug } from '@/types/location.types';

export const texasLocations: DeliveryLocation[] = [
  {
    city: "Austin",
    state: "Texas",
    product_name: "River Rock",
    lat: 30.2672,
    lng: -97.7431,
    slug: generateLocationSlug("Austin", "TX")
  },
  {
    city: "Dallas",
    state: "Texas", 
    product_name: "Limestone Gravel",
    lat: 32.7767,
    lng: -96.7970,
    slug: generateLocationSlug("Dallas", "TX")
  },
  {
    city: "Houston",
    state: "Texas",
    product_name: "Pea Gravel",
    lat: 29.7604,
    lng: -95.3698,
    slug: generateLocationSlug("Houston", "TX")
  },
  {
    city: "San Antonio",
    state: "Texas",
    product_name: "Crushed Stone",
    lat: 29.4241,
    lng: -98.4936,
    slug: generateLocationSlug("San Antonio", "TX")
  },
  {
    city: "Fort Worth",
    state: "Texas",
    product_name: "Decorative Gravel",
    lat: 32.7555,
    lng: -97.3308,
    slug: generateLocationSlug("Fort Worth", "TX")
  },
  {
    city: "El Paso",
    state: "Texas",
    product_name: "Desert Rock",
    lat: 31.7619,
    lng: -106.4850,
    slug: generateLocationSlug("El Paso", "TX")
  },
  {
    city: "Arlington",
    state: "Texas",
    product_name: "Recycled Concrete",
    lat: 32.7357,
    lng: -97.1081,
    slug: generateLocationSlug("Arlington", "TX")
  }
];
