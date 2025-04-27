
export interface DeliveryLocation {
  product_name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

// Generate a larger set of sample data
const generateMoreLocations = (): DeliveryLocation[] => {
  const products = [
    "River Rock Gravel", "Crushed Stone", "Pea Gravel", "Construction Sand", 
    "Fill Dirt", "Limestone Gravel", "Beach Sand", "Decorative Gravel",
    "Recycled Concrete", "Drainage Gravel", "Top Soil", "Garden Soil Mix",
    "Play Sand", "Volcanic Rock", "Decomposed Granite"
  ];
  
  const cities = {
    "TX": ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock"],
    "CA": ["Los Angeles", "San Diego", "San Francisco", "San Jose", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim"],
    "FL": ["Miami", "Jacksonville", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Port St. Lucie", "Cape Coral", "Fort Lauderdale", "Tallahassee"],
    "NY": ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"],
    "IL": ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin", "Waukegan", "Cicero"],
    "AZ": ["Phoenix", "Tucson", "Mesa", "Chandler", "Glendale", "Scottsdale", "Gilbert", "Tempe", "Peoria", "Surprise"],
    "CO": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial"],
    "WA": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Yakima", "Federal Way"],
    "GA": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Macon", "Roswell", "Albany", "Johns Creek"],
    "NC": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord"]
  };
  
  // Create base coordinates for states to ensure points are in right general area
  const stateBaseCoords = {
    "TX": { lat: 31.0, lng: -100.0 },
    "CA": { lat: 36.7, lng: -119.5 },
    "FL": { lat: 28.1, lng: -81.6 },
    "NY": { lat: 42.9, lng: -75.5 },
    "IL": { lat: 40.0, lng: -89.0 },
    "AZ": { lat: 34.3, lng: -111.6 },
    "CO": { lat: 39.0, lng: -105.5 },
    "WA": { lat: 47.4, lng: -120.4 },
    "GA": { lat: 32.6, lng: -83.4 },
    "NC": { lat: 35.6, lng: -79.3 }
  };

  const results: DeliveryLocation[] = [];
  
  // For each state and city
  Object.entries(cities).forEach(([state, stateCities]) => {
    const baseCoord = stateBaseCoords[state as keyof typeof stateBaseCoords];
    
    stateCities.forEach((city) => {
      // Get 1-3 products per city
      const numProducts = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numProducts; i++) {
        const productIndex = Math.floor(Math.random() * products.length);
        
        // Add slight variation to coordinates for each city in state
        const latVariation = (Math.random() - 0.5) * 3;
        const lngVariation = (Math.random() - 0.5) * 3;
        
        results.push({
          product_name: products[productIndex],
          city: city,
          state: state,
          lat: baseCoord.lat + latVariation,
          lng: baseCoord.lng + lngVariation
        });
      }
    });
  });
  
  return results;
};

// Original hardcoded data
const originalLocations: DeliveryLocation[] = [
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

// Combine original and generated locations
const allLocations = [...originalLocations, ...generateMoreLocations()];

// Remove duplicates and limit to 110 entries
const uniqueLocations = allLocations.filter((location, index, self) => 
  index === self.findIndex((l) => 
    l.city === location.city && 
    l.state === location.state && 
    l.product_name === location.product_name
  )
);

// Export exactly 110 locations
export const deliveryLocations = uniqueLocations.slice(0, 110);
