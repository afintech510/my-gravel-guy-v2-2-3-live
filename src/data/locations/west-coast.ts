
import { DeliveryLocation, generateLocationSlug } from '@/types/location.types';

export const westCoastLocations: DeliveryLocation[] = [
  {
    city: "Phoenix",
    state: "AZ",
    product_name: "Desert Cobble",
    lat: 33.4484,
    lng: -112.0740,
    slug: generateLocationSlug("Phoenix", "AZ")
  },
  {
    city: "Los Angeles",
    state: "CA",
    product_name: "Decorative Gravel",
    lat: 34.0522,
    lng: -118.2437,
    slug: generateLocationSlug("Los Angeles", "CA")
  },
  {
    city: "San Francisco",
    state: "CA",
    product_name: "Drainage Rock",
    lat: 37.7749,
    lng: -122.4194,
    slug: generateLocationSlug("San Francisco", "CA")
  },
  {
    city: "Seattle",
    state: "WA",
    product_name: "River Pebbles",
    lat: 47.6062,
    lng: -122.3321,
    slug: generateLocationSlug("Seattle", "WA")
  },
  {
    city: "Denver",
    state: "CO",
    product_name: "Mountain Stone",
    lat: 39.7392,
    lng: -104.9903,
    slug: generateLocationSlug("Denver", "CO")
  },
  {
    city: "Portland",
    state: "OR",
    product_name: "River Rock",
    lat: 45.5155,
    lng: -122.6789,
    slug: generateLocationSlug("Portland", "OR")
  },
  {
    city: "Sacramento",
    state: "CA",
    product_name: "Gold Rush Gravel",
    lat: 38.5816,
    lng: -121.4944,
    slug: generateLocationSlug("Sacramento", "CA")
  },
  {
    city: "Salt Lake City",
    state: "UT",
    product_name: "Mountain Gravel",
    lat: 40.7608,
    lng: -111.8910,
    slug: generateLocationSlug("Salt Lake City", "UT")
  }
];
