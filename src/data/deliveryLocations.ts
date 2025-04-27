
export interface DeliveryLocation {
  product_name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export const deliveryLocations: DeliveryLocation[] = [
  {
    product_name: "River Rock Gravel",
    city: "Austin",
    state: "TX",
    lat: 30.2672,
    lng: -97.7431
  },
  {
    product_name: "Crushed Stone",
    city: "Dallas",
    state: "TX",
    lat: 32.7767,
    lng: -96.7970
  },
  {
    product_name: "Pea Gravel",
    city: "Houston",
    state: "TX",
    lat: 29.7604,
    lng: -95.3698
  },
  {
    product_name: "Construction Sand",
    city: "San Antonio",
    state: "TX",
    lat: 29.4241,
    lng: -98.4936
  },
  {
    product_name: "Fill Dirt",
    city: "Phoenix",
    state: "AZ",
    lat: 33.4484,
    lng: -112.0740
  },
  {
    product_name: "River Rock",
    city: "Denver",
    state: "CO",
    lat: 39.7392,
    lng: -104.9903
  },
  {
    product_name: "Limestone Gravel",
    city: "Miami",
    state: "FL",
    lat: 25.7617,
    lng: -80.1918
  },
  {
    product_name: "Beach Sand",
    city: "Los Angeles",
    state: "CA",
    lat: 34.0522,
    lng: -118.2437
  }
];
