
import { DeliveryLocation, generateLocationSlug } from '@/types/location.types';

export const southeastLocations: DeliveryLocation[] = [
  {
    city: "Miami",
    state: "FL",
    product_name: "Beach Pebbles",
    lat: 25.7617,
    lng: -80.1918,
    slug: generateLocationSlug("Miami", "FL")
  },
  {
    city: "Atlanta",
    state: "GA",
    product_name: "Red Clay Gravel",
    lat: 33.7490,
    lng: -84.3880,
    slug: generateLocationSlug("Atlanta", "GA")
  },
  {
    city: "Nashville",
    state: "TN",
    product_name: "Limestone Chips",
    lat: 36.1627,
    lng: -86.7816,
    slug: generateLocationSlug("Nashville", "TN")
  },
  {
    city: "New Orleans",
    state: "LA",
    product_name: "Bayou Gravel",
    lat: 29.9511,
    lng: -90.0715,
    slug: generateLocationSlug("New Orleans", "LA")
  },
  {
    city: "Charlotte",
    state: "NC",
    product_name: "Carolina Crush",
    lat: 35.2271,
    lng: -80.8431,
    slug: generateLocationSlug("Charlotte", "NC")
  },
  {
    city: "Birmingham",
    state: "AL",
    product_name: "Southern Stone",
    lat: 33.5207,
    lng: -86.8025,
    slug: generateLocationSlug("Birmingham", "AL")
  },
  {
    city: "Jacksonville",
    state: "FL",
    product_name: "Beach Gravel",
    lat: 30.3322,
    lng: -81.6557,
    slug: generateLocationSlug("Jacksonville", "FL")
  }
];
