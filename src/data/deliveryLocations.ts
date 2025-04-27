
import { DeliveryLocation } from '@/components/DeliveryMap';

// This is a fallback data source that can be used when the Google Sheet data is unavailable
export const deliveryLocations: DeliveryLocation[] = [
  {
    city: "Austin",
    state: "Texas",
    product_name: "River Rock",
    lat: 30.2672,
    lng: -97.7431
  },
  {
    city: "Dallas",
    state: "Texas", 
    product_name: "Limestone Gravel",
    lat: 32.7767,
    lng: -96.7970
  },
  {
    city: "Houston",
    state: "Texas",
    product_name: "Pea Gravel",
    lat: 29.7604,
    lng: -95.3698
  },
  {
    city: "San Antonio",
    state: "Texas",
    product_name: "Crushed Stone",
    lat: 29.4241,
    lng: -98.4936
  },
  {
    city: "Phoenix",
    state: "Arizona",
    product_name: "Desert Cobble",
    lat: 33.4484,
    lng: -112.0740
  },
  {
    city: "Los Angeles",
    state: "California",
    product_name: "Decorative Gravel",
    lat: 34.0522,
    lng: -118.2437
  },
  {
    city: "San Francisco",
    state: "California",
    product_name: "Drainage Rock",
    lat: 37.7749,
    lng: -122.4194
  },
  {
    city: "Seattle",
    state: "Washington",
    product_name: "River Pebbles",
    lat: 47.6062,
    lng: -122.3321
  },
  {
    city: "Denver",
    state: "Colorado",
    product_name: "Mountain Stone",
    lat: 39.7392,
    lng: -104.9903
  },
  {
    city: "Chicago",
    state: "Illinois",
    product_name: "Granite Gravel",
    lat: 41.8781,
    lng: -87.6298
  },
  {
    city: "New York",
    state: "New York",
    product_name: "Premium Gravel Mix",
    lat: 40.7128,
    lng: -74.0060
  },
  {
    city: "Miami",
    state: "Florida",
    product_name: "Beach Pebbles",
    lat: 25.7617,
    lng: -80.1918
  },
  {
    city: "Atlanta",
    state: "Georgia",
    product_name: "Red Clay Gravel",
    lat: 33.7490,
    lng: -84.3880
  },
  {
    city: "Nashville",
    state: "Tennessee",
    product_name: "Limestone Chips",
    lat: 36.1627,
    lng: -86.7816
  },
  {
    city: "New Orleans",
    state: "Louisiana",
    product_name: "Bayou Gravel",
    lat: 29.9511,
    lng: -90.0715
  }
];

// Export the DeliveryLocation interface and the deliveryLocations array
export { DeliveryLocation };
