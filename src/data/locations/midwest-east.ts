
import { DeliveryLocation, generateLocationSlug } from '@/types/location.types';

export const midwestEastLocations: DeliveryLocation[] = [
  {
    city: "Chicago",
    state: "Illinois",
    product_name: "Granite Gravel",
    lat: 41.8781,
    lng: -87.6298,
    slug: generateLocationSlug("Chicago", "IL"),
    title: "Gravel Delivery in Chicago, IL",
    description: "Fast and reliable gravel delivery throughout Chicago and surrounding suburbs."
  },
  {
    city: "New York",
    state: "New York",
    product_name: "Premium Gravel Mix",
    lat: 40.7128,
    lng: -74.0060,
    slug: generateLocationSlug("New York", "NY"),
    title: "Gravel Delivery in New York, NY",
    description: "Premium gravel delivery across all New York City boroughs with on-time service."
  },
  {
    city: "Boston",
    state: "Massachusetts",
    product_name: "New England Stone",
    lat: 42.3601,
    lng: -71.0589,
    slug: "boston-ma",
    title: "Gravel Delivery in Boston, MA",
    description: "Quality gravel and stone delivery throughout Boston and the greater Massachusetts area."
  }
];
